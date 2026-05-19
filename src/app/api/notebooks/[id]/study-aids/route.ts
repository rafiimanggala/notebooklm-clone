import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateStudyAid, generateFlashcards, generateQuiz, generateMindMap, generateDataTable, generateTOC, generateSlides } from '@/lib/ai/claude';

const VALID_TYPES = ['faq', 'study-guide', 'timeline', 'briefing', 'flashcard', 'quiz', 'mind-map', 'data-table', 'toc', 'slides'] as const;

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
    const { type } = body;

    if (!type || !VALID_TYPES.includes(type)) {
      return Response.json(
        { error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}` },
        { status: 400 }
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

    // Route to appropriate generator
    if (type === 'flashcard') {
      const flashcards = await generateFlashcards(sourceContent);
      return Response.json({ flashcards });
    }

    if (type === 'quiz') {
      const questions = await generateQuiz(sourceContent);
      return Response.json({ questions });
    }

    if (type === 'mind-map') {
      const mindMap = await generateMindMap(sourceContent);
      return Response.json({ mindMap });
    }

    if (type === 'data-table') {
      const tables = await generateDataTable(sourceContent);
      return Response.json({ tables });
    }

    if (type === 'toc') {
      const toc = await generateTOC(sourceContent);
      return Response.json({ toc });
    }

    if (type === 'slides') {
      const slides = await generateSlides(sourceContent);
      return Response.json({ slides });
    }

    // Generate standard study aid
    const content = await generateStudyAid(type, sourceContent);

    return Response.json({
      studyAid: { type, content },
    });
  } catch (error) {
    console.error('Failed to generate study aid:', error);
    return Response.json(
      { error: 'Failed to generate study aid' },
      { status: 500 }
    );
  }
}
