import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

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

    const messages = db
      .select()
      .from(schema.messages)
      .where(eq(schema.messages.notebookId, id))
      .all();

    return Response.json({
      notebook,
      sourceCount: sources.length,
      messageCount: messages.length,
    });
  } catch (error) {
    console.error('Failed to get notebook:', error);
    return Response.json(
      { error: 'Failed to get notebook' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, description, customInstructions, chatStyle, language } = body;

    const existing = db
      .select()
      .from(schema.notebooks)
      .where(eq(schema.notebooks.id, id))
      .get();

    if (!existing) {
      return Response.json(
        { error: 'Notebook not found' },
        { status: 404 }
      );
    }

    const updates: Record<string, unknown> = {
      updatedAt: Date.now(),
    };

    if (title !== undefined) {
      if (typeof title !== 'string' || !title.trim()) {
        return Response.json(
          { error: 'Title must be a non-empty string' },
          { status: 400 }
        );
      }
      updates.title = title.trim();
    }

    if (description !== undefined) {
      updates.description = description?.trim() ?? null;
    }

    if (customInstructions !== undefined) {
      updates.customInstructions = typeof customInstructions === 'string' ? customInstructions : '';
    }

    if (chatStyle !== undefined) {
      const validStyles = ['default', 'analyst', 'guide', 'creative', 'concise'];
      if (typeof chatStyle === 'string' && validStyles.includes(chatStyle)) {
        updates.chatStyle = chatStyle;
      }
    }

    if (language !== undefined && typeof language === 'string' && language.trim()) {
      updates.language = language.trim();
    }

    db.update(schema.notebooks)
      .set(updates)
      .where(eq(schema.notebooks.id, id))
      .run();

    const notebook = db
      .select()
      .from(schema.notebooks)
      .where(eq(schema.notebooks.id, id))
      .get();

    return Response.json({ notebook });
  } catch (error) {
    console.error('Failed to update notebook:', error);
    return Response.json(
      { error: 'Failed to update notebook' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = db
      .select()
      .from(schema.notebooks)
      .where(eq(schema.notebooks.id, id))
      .get();

    if (!existing) {
      return Response.json(
        { error: 'Notebook not found' },
        { status: 404 }
      );
    }

    // Cascade deletes handled by foreign keys, but explicitly clean up
    db.delete(schema.flashcardSets)
      .where(eq(schema.flashcardSets.notebookId, id))
      .run();
    db.delete(schema.quizSets)
      .where(eq(schema.quizSets.notebookId, id))
      .run();
    db.delete(schema.audioOverviews)
      .where(eq(schema.audioOverviews.notebookId, id))
      .run();
    db.delete(schema.messages)
      .where(eq(schema.messages.notebookId, id))
      .run();
    db.delete(schema.chunks)
      .where(eq(schema.chunks.notebookId, id))
      .run();
    db.delete(schema.sources)
      .where(eq(schema.sources.notebookId, id))
      .run();
    db.delete(schema.notebooks)
      .where(eq(schema.notebooks.id, id))
      .run();

    return Response.json({ success: true });
  } catch (error) {
    console.error('Failed to delete notebook:', error);
    return Response.json(
      { error: 'Failed to delete notebook' },
      { status: 500 }
    );
  }
}
