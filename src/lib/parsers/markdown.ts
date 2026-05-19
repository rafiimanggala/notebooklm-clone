interface MarkdownResult {
  title: string;
  content: string;
}

export async function parseMarkdown(content: string, title?: string): Promise<MarkdownResult> {
  try {
    // Strip YAML frontmatter (between --- markers at start)
    let processed = content;
    if (processed.startsWith('---')) {
      const endIndex = processed.indexOf('---', 3);
      if (endIndex !== -1) {
        processed = processed.slice(endIndex + 3);
      }
    }

    // Normalize whitespace (same pattern as text.ts)
    processed = processed
      .replace(/\r\n/g, '\n')
      .replace(/\t/g, '  ')
      .replace(/[ ]{3,}/g, '  ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    if (!processed) {
      throw new Error('Empty markdown content provided');
    }

    const resolvedTitle = title?.trim() || deriveTitle(processed);

    return {
      title: resolvedTitle,
      content: processed,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to parse markdown: ${message}`);
  }
}

function deriveTitle(content: string): string {
  // Look for first H1 heading
  const lines = content.split('\n');
  for (const line of lines) {
    const h1Match = line.match(/^#\s+(.+)$/);
    if (h1Match) {
      const title = h1Match[1].trim();
      if (title.length > 100) {
        return title.slice(0, 97) + '...';
      }
      return title;
    }
  }

  // Fall back to first non-empty line
  const firstLine = lines.find((l) => l.trim().length > 0)?.trim() || 'Untitled';
  if (firstLine.length > 100) {
    return firstLine.slice(0, 97) + '...';
  }
  return firstLine;
}
