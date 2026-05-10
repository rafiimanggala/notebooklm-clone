interface TextResult {
  title: string;
  content: string;
}

export async function parseText(text: string, title?: string): Promise<TextResult> {
  try {
    const content = text
      .replace(/\r\n/g, '\n')
      .replace(/\t/g, '  ')
      .replace(/[ ]{3,}/g, '  ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    if (!content) {
      throw new Error('Empty text content provided');
    }

    const resolvedTitle = title?.trim() || deriveTitle(content);

    return {
      title: resolvedTitle,
      content,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to parse text: ${message}`);
  }
}

function deriveTitle(content: string): string {
  const firstLine = content.split('\n')[0]?.trim() || 'Untitled';

  // Strip markdown heading markers
  const cleaned = firstLine.replace(/^#+\s*/, '').trim();

  // Truncate to reasonable title length
  if (cleaned.length > 100) {
    return cleaned.slice(0, 97) + '...';
  }

  return cleaned || 'Untitled';
}
