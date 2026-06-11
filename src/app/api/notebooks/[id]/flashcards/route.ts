import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';
import { generateFlashcards } from '@/lib/ai/claude';

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

    // Return most recent flashcard set
    const flashcardSet = db
      .select()
      .from(schema.flashcardSets)
      .where(eq(schema.flashcardSets.notebookId, id))
      .orderBy(desc(schema.flashcardSets.createdAt))
      .limit(1)
      .get();

    if (!flashcardSet) {
      return Response.json({ flashcards: null });
    }

    return Response.json({
      id: flashcardSet.id,
      flashcards: JSON.parse(flashcardSet.flashcards),
      createdAt: flashcardSet.createdAt,
    });
  } catch (error) {
    console.error('Failed to get flashcards:', error);
    return Response.json(
      { error: 'Failed to get flashcards' },
      { status: 500 }
    );
  }
}

export async function POST(
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

    // Load all source content
    const sources = db
      .select()
      .from(schema.sources)
      .where(eq(schema.sources.notebookId, id))
      .all();

    if (sources.length === 0) {
      return Response.json(
        { error: 'No sources found in this notebook' },
        { status: 400 }
      );
    }

    const sourceContent = sources
      .map((s, i) => `[Source ${i + 1}: ${s.title}]\n${s.content}`)
      .join('\n\n---\n\n');

    const language = (notebook as Record<string, unknown>).language as string | undefined;
    const flashcards = await generateFlashcards(sourceContent, language);

    // Save to DB
    const setId = uuid();
    const now = Date.now();

    db.insert(schema.flashcardSets)
      .values({
        id: setId,
        notebookId: id,
        flashcards: JSON.stringify(flashcards),
        createdAt: now,
      })
      .run();

    return Response.json({
      id: setId,
      flashcards,
      createdAt: now,
    });
  } catch (error) {
    console.error('Failed to generate flashcards:', error);
    return Response.json(
      { error: 'Failed to generate flashcards' },
      { status: 500 }
    );
  }
}
