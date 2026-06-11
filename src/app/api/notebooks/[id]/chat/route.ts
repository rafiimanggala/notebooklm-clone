import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';
import { getContextForQuery } from '@/lib/ai/retrieval';
import { streamChatWithSources } from '@/lib/ai/claude';

export async function POST(
  request: NextRequest,
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

    const body = await request.json();
    const { message, history, enabledSourceIds, chatStyle } = body;

    if (!message || typeof message !== 'string') {
      return Response.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const customInstructions = (notebook as Record<string, unknown>).customInstructions as string | undefined;
    const effectiveChatStyle = chatStyle ?? (notebook as Record<string, unknown>).chatStyle as string | undefined;
    const language = (notebook as Record<string, unknown>).language as string | undefined;

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

    const { context, citations } = await getContextForQuery(id, message, enabledSourceIds);

    const chatHistory = (history ?? []).map(
      (m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      })
    );

    const recentHistory = chatHistory.slice(-20);
    const allMessages = [...recentHistory, { role: 'user', content: message }];

    const aiStream = streamChatWithSources(
      allMessages, context, citations,
      customInstructions ?? '', effectiveChatStyle ?? 'default',
      language,
    );

    let fullText = '';
    const transform = new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        fullText += new TextDecoder().decode(chunk);
        controller.enqueue(chunk);
      },
      flush() {
        db.insert(schema.messages)
          .values({
            id: uuid(),
            notebookId: id,
            role: 'assistant',
            content: fullText,
            citations: JSON.stringify(citations),
            createdAt: Date.now(),
          })
          .run();
      },
    });

    const responseStream = aiStream.pipeThrough(transform);

    return new Response(responseStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Failed to process chat:', error);
    return Response.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}
