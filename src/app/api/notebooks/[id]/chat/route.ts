import { NextRequest } from 'next/server';
import { streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';
import { getContextForQuery } from '@/lib/ai/retrieval';

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

    const body = await request.json();
    const { message, history } = body;

    if (!message || typeof message !== 'string') {
      return Response.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Save user message
    const userMessageId = uuid();
    const now = Date.now();

    db.insert(schema.messages)
      .values({
        id: userMessageId,
        notebookId: id,
        role: 'user',
        content: message,
        citations: '[]',
        createdAt: now,
      })
      .run();

    // Get context from sources
    const { context, citations } = await getContextForQuery(id, message);

    // Build message history
    const chatHistory = (history ?? []).map(
      (m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })
    );

    // Stream response
    const result = streamText({
      model: anthropic('claude-sonnet-4-20250514'),
      system: `You are a research assistant. Answer based ONLY on the provided sources. Cite using [1], [2] etc.\n\nSources:\n${context}`,
      messages: [...chatHistory, { role: 'user' as const, content: message }],
      onFinish: async ({ text }) => {
        // Save assistant message after stream completes
        db.insert(schema.messages)
          .values({
            id: uuid(),
            notebookId: id,
            role: 'assistant',
            content: text,
            citations: JSON.stringify(citations),
            createdAt: Date.now(),
          })
          .run();
      },
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Failed to process chat:', error);
    return Response.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}
