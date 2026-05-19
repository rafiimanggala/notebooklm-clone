import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';
import { getContextForQuery } from '@/lib/ai/retrieval';
import { chatWithSources } from '@/lib/ai/claude';

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

    // Read notebook's customInstructions
    const customInstructions = (notebook as Record<string, unknown>).customInstructions as string | undefined;
    const effectiveChatStyle = chatStyle ?? (notebook as Record<string, unknown>).chatStyle as string | undefined;

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

    // Limit chat history to last 20 messages (context windowing)
    const recentHistory = chatHistory.slice(-20);

    const allMessages = [...recentHistory, { role: 'user', content: message }];

    const text = await chatWithSources(allMessages, context, citations, customInstructions ?? '', effectiveChatStyle ?? 'default');

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

    const encoder = new TextEncoder();
    const words = text.split(/(\s+)/);
    let wordIndex = 0;

    const stream = new ReadableStream({
      pull(controller) {
        if (wordIndex >= words.length) {
          controller.close();
          return;
        }
        const batch = words.slice(wordIndex, wordIndex + 3).join('');
        wordIndex += 3;
        controller.enqueue(encoder.encode(batch));
      },
    });

    return new Response(stream, {
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
