import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const format = request.nextUrl.searchParams.get('format');

    if (!format || !['json', 'chat', 'markdown'].includes(format)) {
      return Response.json(
        { error: 'Invalid format. Must be json, chat, or markdown' },
        { status: 400 }
      );
    }

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

    const safeTitle = notebook.title.replace(/[^a-zA-Z0-9_-]/g, '_');

    if (format === 'json') {
      const exportData = {
        notebook: {
          title: notebook.title,
          description: notebook.description,
          createdAt: notebook.createdAt,
        },
        sources: sources.map((s) => ({
          title: s.title,
          type: s.type,
          content: s.content,
          metadata: JSON.parse(s.metadata),
        })),
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
          citations: JSON.parse(m.citations),
          createdAt: m.createdAt,
        })),
        exportedAt: new Date().toISOString(),
      };

      return new Response(JSON.stringify(exportData, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${safeTitle}.json"`,
        },
      });
    }

    if (format === 'chat') {
      const lines: string[] = [
        `# ${notebook.title} - Chat Export`,
        '',
      ];

      for (const msg of messages) {
        lines.push('---');
        lines.push('');
        const role = msg.role === 'user' ? 'You' : 'AI';
        lines.push(`**${role}:** ${msg.content}`);
        lines.push('');
      }

      if (messages.length > 0) {
        lines.push('---');
      }

      const body = lines.join('\n');

      return new Response(body, {
        headers: {
          'Content-Type': 'text/markdown',
          'Content-Disposition': `attachment; filename="${safeTitle}-chat.md"`,
        },
      });
    }

    // format === 'markdown'
    const lines: string[] = [
      `# ${notebook.title}`,
      '',
    ];

    for (let i = 0; i < sources.length; i++) {
      const source = sources[i];
      lines.push(`## Source: ${source.title}`);
      lines.push(source.content);
      lines.push('');
      if (i < sources.length - 1) {
        lines.push('---');
        lines.push('');
      }
    }

    const body = lines.join('\n');

    return new Response(body, {
      headers: {
        'Content-Type': 'text/markdown',
        'Content-Disposition': `attachment; filename="${safeTitle}-markdown.md"`,
      },
    });
  } catch (error) {
    console.error('Failed to export notebook:', error);
    return Response.json(
      { error: 'Failed to export notebook' },
      { status: 500 }
    );
  }
}
