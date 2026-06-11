import { eq } from 'drizzle-orm';
import { db, schema } from '../db';
import { BM25Index } from './bm25';
import { generateEmbedding, cosineSimilarity } from './embeddings';
import type { RetrievalResult, Citation, Chunk, Source } from '@/types';

export function buildIndex(notebookId: string, enabledSourceIds?: string[]): BM25Index {
  const index = new BM25Index();

  const rows = db
    .select()
    .from(schema.chunks)
    .where(eq(schema.chunks.notebookId, notebookId))
    .all();

  const filteredRows = enabledSourceIds
    ? rows.filter(chunk => enabledSourceIds.includes(chunk.sourceId))
    : rows;

  for (const chunk of filteredRows) {
    index.addDocument(chunk.id, chunk.content);
  }

  return index;
}

async function ensureEmbeddings(notebookId: string, enabledSourceIds?: string[]) {
  const rows = db
    .select()
    .from(schema.chunks)
    .where(eq(schema.chunks.notebookId, notebookId))
    .all();

  const filtered = enabledSourceIds
    ? rows.filter(chunk => enabledSourceIds.includes(chunk.sourceId))
    : rows;

  const missing = filtered.filter(c => !c.embedding);
  if (missing.length === 0) return;

  for (const chunk of missing) {
    const emb = await generateEmbedding(chunk.content);
    db.update(schema.chunks)
      .set({ embedding: JSON.stringify(emb) })
      .where(eq(schema.chunks.id, chunk.id))
      .run();
  }
}

export async function retrieveChunks(
  notebookId: string,
  query: string,
  topK = 8,
  enabledSourceIds?: string[],
): Promise<RetrievalResult[]> {
  const rows = db
    .select()
    .from(schema.chunks)
    .where(eq(schema.chunks.notebookId, notebookId))
    .all();

  const filtered = enabledSourceIds
    ? rows.filter(chunk => enabledSourceIds.includes(chunk.sourceId))
    : rows;

  if (filtered.length === 0) return [];

  const hasEmbeddings = filtered.some(c => c.embedding);

  if (hasEmbeddings) {
    await ensureEmbeddings(notebookId, enabledSourceIds);

    const refreshed = db
      .select()
      .from(schema.chunks)
      .where(eq(schema.chunks.notebookId, notebookId))
      .all();

    const freshFiltered = enabledSourceIds
      ? refreshed.filter(chunk => enabledSourceIds.includes(chunk.sourceId))
      : refreshed;

    const queryEmb = await generateEmbedding(query);

    const scored = freshFiltered
      .filter(c => c.embedding)
      .map(c => ({
        chunk: c,
        score: cosineSimilarity(queryEmb, JSON.parse(c.embedding!) as number[]),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    return fetchResults(scored);
  }

  // Fallback: BM25 for chunks without embeddings
  const index = buildIndex(notebookId, enabledSourceIds);
  const bm25Results = index.search(query, topK);

  const scored = bm25Results.map(r => {
    const chunk = filtered.find(c => c.id === r.id)!;
    return { chunk, score: r.score };
  }).filter(r => r.chunk);

  return fetchResults(scored);
}

function fetchResults(
  scored: { chunk: { id: string; sourceId: string; notebookId: string; content: string; chunkIndex: number; metadata: string; embedding: string | null }; score: number }[],
): RetrievalResult[] {
  const results: RetrievalResult[] = [];

  for (const match of scored) {
    const sourceRow = db
      .select()
      .from(schema.sources)
      .where(eq(schema.sources.id, match.chunk.sourceId))
      .get();

    if (!sourceRow) continue;

    results.push({
      chunk: match.chunk as Chunk,
      score: match.score,
      source: sourceRow as Source,
    });
  }

  return results;
}

export async function getContextForQuery(
  notebookId: string,
  query: string,
  enabledSourceIds?: string[],
): Promise<{
  context: string;
  citations: Citation[];
}> {
  const results = await retrieveChunks(notebookId, query, 8, enabledSourceIds);

  if (results.length === 0) {
    return {
      context: 'No relevant sources found.',
      citations: [],
    };
  }

  const citations: Citation[] = [];
  const contextParts: string[] = [];

  for (let i = 0; i < results.length; i++) {
    const { chunk, source } = results[i];
    const refNumber = i + 1;

    contextParts.push(
      `[${refNumber}] (Source: ${source.title})\n${chunk.content}`,
    );

    citations.push({
      sourceId: source.id,
      chunkId: chunk.id,
      text: chunk.content,
    });
  }

  const context = contextParts.join('\n\n---\n\n');

  return { context, citations };
}
