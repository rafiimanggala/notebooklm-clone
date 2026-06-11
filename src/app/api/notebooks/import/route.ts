import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { v4 as uuid } from 'uuid';
import { chunkText } from '@/lib/chunker';
import { generateEmbedding } from '@/lib/ai/embeddings';

interface ImportSource {
  title: string;
  type: string;
  content: string;
  metadata?: Record<string, unknown>;
}

interface ImportMessage {
  role: string;
  content: string;
  citations?: unknown[];
  createdAt?: number;
}

interface ImportData {
  notebook: {
    title: string;
    description?: string | null;
  };
  sources: ImportSource[];
  messages?: ImportMessage[];
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') ?? '';
    let data: ImportData;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      if (!file) {
        return Response.json({ error: 'No file provided' }, { status: 400 });
      }
      const text = await file.text();
      data = JSON.parse(text);
    } else {
      data = await request.json();
    }

    if (!data.notebook?.title || !Array.isArray(data.sources)) {
      return Response.json(
        { error: 'Invalid import format. Requires notebook.title and sources array.' },
        { status: 400 },
      );
    }

    const notebookId = uuid();
    const now = Date.now();

    db.insert(schema.notebooks)
      .values({
        id: notebookId,
        title: data.notebook.title,
        description: data.notebook.description ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .run();

    for (const src of data.sources) {
      const sourceId = uuid();
      db.insert(schema.sources)
        .values({
          id: sourceId,
          notebookId,
          title: src.title,
          type: src.type,
          content: src.content,
          metadata: JSON.stringify(src.metadata ?? {}),
          fileSize: null,
          createdAt: now,
        })
        .run();

      const textChunks = chunkText(src.content);
      for (let i = 0; i < textChunks.length; i++) {
        const emb = await generateEmbedding(textChunks[i]);
        db.insert(schema.chunks)
          .values({
            id: uuid(),
            sourceId,
            notebookId,
            content: textChunks[i],
            chunkIndex: i,
            metadata: JSON.stringify({
              sourceTitle: src.title,
              sourceType: src.type,
              chunkIndex: i,
              totalChunks: textChunks.length,
            }),
            embedding: JSON.stringify(emb),
          })
          .run();
      }
    }

    if (data.messages && Array.isArray(data.messages)) {
      for (const msg of data.messages) {
        db.insert(schema.messages)
          .values({
            id: uuid(),
            notebookId,
            role: msg.role,
            content: msg.content,
            citations: JSON.stringify(msg.citations ?? []),
            createdAt: msg.createdAt ?? now,
          })
          .run();
      }
    }

    return Response.json(
      { notebook: { id: notebookId, title: data.notebook.title } },
      { status: 201 },
    );
  } catch (error) {
    console.error('Failed to import notebook:', error);
    const message = error instanceof Error ? error.message : 'Failed to import notebook';
    return Response.json({ error: message }, { status: 500 });
  }
}
