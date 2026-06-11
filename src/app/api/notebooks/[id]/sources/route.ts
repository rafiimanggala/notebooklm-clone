import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';
import { parseSource } from '@/lib/parsers';
import { chunkText } from '@/lib/chunker';
import { generateEmbedding } from '@/lib/ai/embeddings';
import type { SourceType } from '@/types';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const notebook = db
      .select()
      .from(schema.notebooks)
      .where(eq(schema.notebooks.id, id))
      .get();

    if (!notebook) {
      return Response.json(
        { error: 'Notebook not found' },
        { status: 404 }
      );
    }

    const sources = db
      .select()
      .from(schema.sources)
      .where(eq(schema.sources.notebookId, id))
      .all();

    return Response.json({ sources });
  } catch (error) {
    console.error('Failed to list sources:', error);
    return Response.json(
      { error: 'Failed to list sources' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify notebook exists
    const notebook = db
      .select()
      .from(schema.notebooks)
      .where(eq(schema.notebooks.id, id))
      .get();

    if (!notebook) {
      return Response.json(
        { error: 'Notebook not found' },
        { status: 404 }
      );
    }

    const contentType = request.headers.get('content-type') ?? '';
    let type: SourceType;
    let input: Buffer | string;
    let providedTitle: string | undefined;
    let fileSize: number | null = null;
    let mimeType: string | undefined;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;

      if (!file) {
        return Response.json(
          { error: 'No file provided' },
          { status: 400 }
        );
      }

      const fileName = file.name ?? '';
      if (fileName.endsWith('.epub')) {
        type = 'epub';
      } else if (fileName.endsWith('.pptx')) {
        type = 'pptx';
      } else if (/\.(png|jpg|jpeg|gif|webp)$/i.test(fileName)) {
        type = 'image';
        mimeType = file.type || 'image/png';
      } else if (fileName.endsWith('.docx')) {
        type = 'docx';
      } else if (fileName.endsWith('.pdf')) {
        type = 'pdf';
      } else {
        type = 'pdf';
      }

      const arrayBuffer = await file.arrayBuffer();
      input = Buffer.from(arrayBuffer);
      fileSize = file.size;
      providedTitle = (formData.get('title') as string) ?? undefined;
    } else {
      const body = await request.json();
      type = body.type;
      providedTitle = body.title;

      if (!type || !['text', 'url', 'youtube', 'markdown', 'csv'].includes(type)) {
        return Response.json(
          { error: 'Invalid source type. Must be text, url, youtube, markdown, or csv' },
          { status: 400 }
        );
      }

      if (!body.content || typeof body.content !== 'string') {
        return Response.json(
          { error: 'Content is required' },
          { status: 400 }
        );
      }

      input = body.content;
    }

    const parsed = await parseSource(type, input, mimeType);
    const title = providedTitle?.trim() || parsed.title;

    // Chunk content
    const textChunks = chunkText(parsed.content);

    // Save source
    const sourceId = uuid();
    const now = Date.now();

    const source = {
      id: sourceId,
      notebookId: id,
      title,
      type,
      content: parsed.content,
      metadata: JSON.stringify(parsed.metadata),
      fileSize,
      createdAt: now,
    };

    db.insert(schema.sources).values(source).run();

    // Save chunks with embeddings
    for (let i = 0; i < textChunks.length; i++) {
      const emb = await generateEmbedding(textChunks[i]);
      db.insert(schema.chunks)
        .values({
          id: uuid(),
          sourceId,
          notebookId: id,
          content: textChunks[i],
          chunkIndex: i,
          metadata: JSON.stringify({
            sourceTitle: title,
            sourceType: type,
            chunkIndex: i,
            totalChunks: textChunks.length,
          }),
          embedding: JSON.stringify(emb),
        })
        .run();
    }

    // Update notebook timestamp
    db.update(schema.notebooks)
      .set({ updatedAt: now })
      .where(eq(schema.notebooks.id, id))
      .run();

    return Response.json({ source }, { status: 201 });
  } catch (error) {
    console.error('Failed to add source:', error);
    const message = error instanceof Error ? error.message : 'Failed to add source';
    return Response.json(
      { error: message },
      { status: 500 }
    );
  }
}
