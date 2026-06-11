import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateNotebookGuide } from '@/lib/ai/claude';

export async function GET(
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

    // Load all source content
    const sources = db
      .select()
      .from(schema.sources)
      .where(eq(schema.sources.notebookId, id))
      .all();

    if (sources.length === 0) {
      return Response.json({
        guide: {
          summary: '',
          keyTopics: [],
          suggestedQuestions: [],
        },
      });
    }

    const sourceContent = sources
      .map((s, i) => `[Source ${i + 1}: ${s.title}]\n${s.content}`)
      .join('\n\n---\n\n');

    const language = (notebook as Record<string, unknown>).language as string | undefined;
    const guide = await generateNotebookGuide(sourceContent, language);

    return Response.json({ guide });
  } catch (error) {
    console.error('Failed to generate notebook guide:', error);
    return Response.json(
      { error: 'Failed to generate notebook guide' },
      { status: 500 }
    );
  }
}
