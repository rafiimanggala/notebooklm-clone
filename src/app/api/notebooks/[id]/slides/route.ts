import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';
import { generateSlides } from '@/lib/ai/claude';

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

    const result = db
      .select()
      .from(schema.studyAidResults)
      .where(
        and(
          eq(schema.studyAidResults.notebookId, id),
          eq(schema.studyAidResults.type, 'slides')
        )
      )
      .orderBy(desc(schema.studyAidResults.createdAt))
      .limit(1)
      .get();

    if (!result) {
      return Response.json({ slides: null });
    }

    return Response.json({
      id: result.id,
      slides: JSON.parse(result.result),
      createdAt: result.createdAt,
    });
  } catch (error) {
    console.error('Failed to get slides:', error);
    return Response.json(
      { error: 'Failed to get slides' },
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

    const slides = await generateSlides(sourceContent);

    const resultId = uuid();
    const now = Date.now();

    db.insert(schema.studyAidResults)
      .values({
        id: resultId,
        notebookId: id,
        type: 'slides',
        result: JSON.stringify(slides),
        createdAt: now,
      })
      .run();

    return Response.json({
      id: resultId,
      slides,
      createdAt: now,
    });
  } catch (error) {
    console.error('Failed to generate slides:', error);
    return Response.json(
      { error: 'Failed to generate slides' },
      { status: 500 }
    );
  }
}
