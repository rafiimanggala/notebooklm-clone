import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; audioId: string }> }
) {
  try {
    const { id, audioId } = await params;

    const audioOverview = db
      .select()
      .from(schema.audioOverviews)
      .where(
        and(
          eq(schema.audioOverviews.id, audioId),
          eq(schema.audioOverviews.notebookId, id)
        )
      )
      .get();

    if (!audioOverview) {
      return Response.json(
        { error: 'Audio overview not found' },
        { status: 404 }
      );
    }

    return Response.json({ audioOverview });
  } catch (error) {
    console.error('Failed to get audio overview:', error);
    return Response.json(
      { error: 'Failed to get audio overview' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; audioId: string }> }
) {
  try {
    const { id, audioId } = await params;

    const audioOverview = db
      .select()
      .from(schema.audioOverviews)
      .where(
        and(
          eq(schema.audioOverviews.id, audioId),
          eq(schema.audioOverviews.notebookId, id)
        )
      )
      .get();

    if (!audioOverview) {
      return Response.json(
        { error: 'Audio overview not found' },
        { status: 404 }
      );
    }

    db.delete(schema.audioOverviews)
      .where(eq(schema.audioOverviews.id, audioId))
      .run();

    return Response.json({ success: true });
  } catch (error) {
    console.error('Failed to delete audio overview:', error);
    return Response.json(
      { error: 'Failed to delete audio overview' },
      { status: 500 }
    );
  }
}
