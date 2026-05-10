import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';
import { generateAudioScript } from '@/lib/ai/claude';
import type { AudioFormat } from '@/types';

const VALID_FORMATS: AudioFormat[] = ['deep-dive', 'briefing', 'study-guide', 'custom'];

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
    const { format, customPrompt } = body;

    if (!format || !VALID_FORMATS.includes(format)) {
      return Response.json(
        { error: `Invalid format. Must be one of: ${VALID_FORMATS.join(', ')}` },
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

    // Use custom prompt as additional context if provided
    const effectiveFormat = customPrompt
      ? `${format}\n\nCustom guidance: ${customPrompt}`
      : format;

    // Generate podcast script
    const script = await generateAudioScript(sourceContent, effectiveFormat);

    // Save audio overview
    const audioOverview = {
      id: uuid(),
      notebookId: id,
      title: `${notebook.title} - ${format} overview`,
      format,
      script: JSON.stringify(script),
      audioUrl: null,
      status: 'completed' as const,
      createdAt: Date.now(),
    };

    db.insert(schema.audioOverviews).values(audioOverview).run();

    return Response.json({ audioOverview }, { status: 201 });
  } catch (error) {
    console.error('Failed to generate audio overview:', error);
    return Response.json(
      { error: 'Failed to generate audio overview' },
      { status: 500 }
    );
  }
}
