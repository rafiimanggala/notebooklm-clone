import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';

export async function GET(
  _request: NextRequest,
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

    const messages = db
      .select()
      .from(schema.messages)
      .where(eq(schema.messages.notebookId, id))
      .orderBy(asc(schema.messages.createdAt))
      .all();

    return Response.json({ messages });
  } catch (error) {
    console.error('Failed to get messages:', error);
    return Response.json(
      { error: 'Failed to get messages' },
      { status: 500 }
    );
  }
}
