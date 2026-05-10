import { PDFParse } from 'pdf-parse';

interface PdfResult {
  title: string;
  content: string;
  pages: number;
}

export async function parsePdf(buffer: Buffer): Promise<PdfResult> {
  let parser: PDFParse | null = null;

  try {
    parser = new PDFParse({ data: new Uint8Array(buffer) });

    const [info, textResult] = await Promise.all([
      parser.getInfo(),
      parser.getText(),
    ]);

    const content = textResult.text
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    const metadataTitle = info.info?.Title;
    const firstLine = content.split('\n')[0]?.trim().slice(0, 200) || 'Untitled PDF';
    const title = metadataTitle && typeof metadataTitle === 'string' && metadataTitle.trim().length > 0
      ? metadataTitle.trim()
      : firstLine;

    return {
      title,
      content,
      pages: info.total,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to parse PDF: ${message}`);
  } finally {
    if (parser) {
      await parser.destroy().catch(() => {});
    }
  }
}
