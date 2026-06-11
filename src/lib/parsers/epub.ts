import AdmZip from 'adm-zip';
import * as cheerio from 'cheerio';

interface EpubResult {
  title: string;
  content: string;
  chapters: number;
}

export async function parseEpub(buffer: Buffer): Promise<EpubResult> {
  try {
    const zip = new AdmZip(buffer);
    const entries = zip.getEntries();

    let title = 'Untitled Book';
    const chapters: string[] = [];

    const opfEntry = entries.find(e => e.entryName.endsWith('.opf'));
    if (opfEntry) {
      const opfXml = opfEntry.getData().toString('utf8');
      const titleMatch = opfXml.match(/<dc:title[^>]*>([^<]+)<\/dc:title>/i);
      if (titleMatch) {
        title = titleMatch[1].trim();
      }
    }

    const htmlEntries = entries
      .filter(e => /\.(xhtml|html|htm)$/i.test(e.entryName) && !e.entryName.includes('toc'))
      .sort((a, b) => a.entryName.localeCompare(b.entryName));

    for (const entry of htmlEntries) {
      const html = entry.getData().toString('utf8');
      const $ = cheerio.load(html);
      $('script, style, nav').remove();
      const text = $('body').text().replace(/\s+/g, ' ').trim();
      if (text.length > 50) {
        chapters.push(text);
      }
    }

    if (chapters.length === 0) {
      throw new Error('No readable content found in EPUB');
    }

    const content = chapters
      .map((ch, i) => `[Chapter ${i + 1}]\n${ch}`)
      .join('\n\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    return { title, content, chapters: chapters.length };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to parse EPUB: ${message}`);
  }
}
