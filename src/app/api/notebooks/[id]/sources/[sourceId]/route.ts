import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; sourceId: string }> }
) {
  try {
    const { id, sourceId } = await params;

    const source = db
      .select()
      .from(schema.sources)
      .where(
        and(
          eq(schema.sources.id, sourceId),
          eq(schema.sources.notebookId, id)
        )
      )
      .get();

    if (!source) {
      return Response.json(
        { error: 'Source not found' },
        { status: 404 }
      );
    }

    return Response.json({ source });
  } catch (error) {
    console.error('Failed to get source:', error);
    return Response.json(
      { error: 'Failed to get source' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sourceId: string }> }
) {
  try {
    const { id, sourceId } = await params;
    const body = await request.json();
    const { enabled } = body;

    if (typeof enabled !== 'number' || (enabled !== 0 && enabled !== 1)) {
      return Response.json(
        { error: 'enabled must be 0 or 1' },
        { status: 400 }
      );
    }

    const source = db
      .select()
      .from(schema.sources)
      .where(
        and(
          eq(schema.sources.id, sourceId),
          eq(schema.sources.notebookId, id)
        )
      )
      .get();

    if (!source) {
      return Response.json(
        { error: 'Source not found' },
        { status: 404 }
      );
    }

    db.update(schema.sources)
      .set({ enabled })
      .where(eq(schema.sources.id, sourceId))
      .run();

    const updated = db
      .select()
      .from(schema.sources)
      .where(eq(schema.sources.id, sourceId))
      .get();

    return Response.json({ source: updated });
  } catch (error) {
    console.error('Failed to update source:', error);
    return Response.json(
      { error: 'Failed to update source' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; sourceId: string }> }
) {
  try {
    const { id, sourceId } = await params;

    const source = db
      .select()
      .from(schema.sources)
      .where(
        and(
          eq(schema.sources.id, sourceId),
          eq(schema.sources.notebookId, id)
        )
      )
      .get();

    if (!source) {
      return Response.json(
        { error: 'Source not found' },
        { status: 404 }
      );
    }

    // Delete chunks first, then source
    db.delete(schema.chunks)
      .where(eq(schema.chunks.sourceId, sourceId))
      .run();
    db.delete(schema.sources)
      .where(eq(schema.sources.id, sourceId))
      .run();

    // Update notebook timestamp
    db.update(schema.notebooks)
      .set({ updatedAt: Date.now() })
      .where(eq(schema.notebooks.id, id))
      .run();

    return Response.json({ success: true });
  } catch (error) {
    console.error('Failed to delete source:', error);
    return Response.json(
      { error: 'Failed to delete source' },
      { status: 500 }
    );
  }
}
