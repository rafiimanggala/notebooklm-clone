import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';

export async function GET() {
  try {
    const notebooks = db
      .select()
      .from(schema.notebooks)
      .orderBy(desc(schema.notebooks.updatedAt))
      .all();

    return Response.json({ notebooks });
  } catch (error) {
    console.error('Failed to list notebooks:', error);
    return Response.json(
      { error: 'Failed to list notebooks' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description } = body;

    if (!title || typeof title !== 'string') {
      return Response.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    const now = Date.now();
    const notebook = {
      id: uuid(),
      title: title.trim(),
      description: description?.trim() ?? null,
      createdAt: now,
      updatedAt: now,
    };

    db.insert(schema.notebooks).values(notebook).run();

    return Response.json({ notebook }, { status: 201 });
  } catch (error) {
    console.error('Failed to create notebook:', error);
    return Response.json(
      { error: 'Failed to create notebook' },
      { status: 500 }
    );
  }
}
