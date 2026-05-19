import mammoth from 'mammoth';

interface DocxResult {
  title: string;
  content: string;
}

export async function parseDocx(buffer: Buffer, title?: string): Promise<DocxResult> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    const content = result.value
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    if (!content) {
      throw new Error('Empty DOCX content');
    }

    const firstLine = content.split('\n')[0]?.trim().slice(0, 200) || 'Untitled Document';
    const resolvedTitle = title?.trim() || firstLine;

    return {
      title: resolvedTitle,
      content,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to parse DOCX: ${message}`);
  }
}
