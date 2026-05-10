import { eq } from 'drizzle-orm';
import { db, schema } from '../db';
import { BM25Index } from './bm25';
import { decomposeQuery } from './claude';
import type { RetrievalResult, Citation, Chunk, Source } from '@/types';

export function buildIndex(notebookId: string): BM25Index {
  const index = new BM25Index();

  const rows = db
    .select()
    .from(schema.chunks)
    .where(eq(schema.chunks.notebookId, notebookId))
    .all();

  for (const chunk of rows) {
    index.addDocument(chunk.id, chunk.content);
  }

  return index;
}

export async function retrieveChunks(
  notebookId: string,
  query: string,
  topK = 8,
): Promise<RetrievalResult[]> {
  const index = buildIndex(notebookId);

  if (index.size === 0) {
    return [];
  }

  // Primary search
  const primaryResults = index.search(query, topK);

  // Generate alternative queries for broader coverage
  let altQueries: string[] = [];
  try {
    altQueries = await decomposeQuery(query);
  } catch {
    // If query decomposition fails, continue with primary results only
  }

  // Search with each alternative query
  const allResults = new Map<string, number>();

  for (const result of primaryResults) {
    allResults.set(result.id, result.score);
  }

  for (const altQuery of altQueries) {
    const altResults = index.search(altQuery, topK);
    for (const result of altResults) {
      const existing = allResults.get(result.id) ?? 0;
      // Keep the higher score
      allResults.set(result.id, Math.max(existing, result.score));
    }
  }

  // Sort by score descending, take topK
  const merged = Array.from(allResults.entries())
    .map(([id, score]) => ({ id, score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  // Fetch full chunk + source data
  const results: RetrievalResult[] = [];

  for (const match of merged) {
    const chunkRow = db
      .select()
      .from(schema.chunks)
      .where(eq(schema.chunks.id, match.id))
      .get();

    if (!chunkRow) continue;

    const sourceRow = db
      .select()
      .from(schema.sources)
      .where(eq(schema.sources.id, chunkRow.sourceId))
      .get();

    if (!sourceRow) continue;

    results.push({
      chunk: chunkRow as Chunk,
      score: match.score,
      source: sourceRow as Source,
    });
  }

  return results;
}

export async function getContextForQuery(
  notebookId: string,
  query: string,
): Promise<{
  context: string;
  citations: Citation[];
}> {
  const results = await retrieveChunks(notebookId, query);

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
