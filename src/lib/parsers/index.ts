import type { SourceType } from '@/types';
import { parsePdf } from './pdf';
import { parseUrl } from './url';
import { parseYoutube } from './youtube';
import { parseText } from './text';

export { parsePdf } from './pdf';
export { parseUrl } from './url';
export { parseYoutube } from './youtube';
export { parseText } from './text';

interface ParseResult {
  title: string;
  content: string;
  metadata: Record<string, unknown>;
}

export async function parseSource(
  type: SourceType,
  input: Buffer | string,
): Promise<ParseResult> {
  switch (type) {
    case 'pdf': {
      if (!(input instanceof Buffer)) {
        throw new Error('PDF source requires a Buffer input');
      }
      const result = await parsePdf(input);
      return {
        title: result.title,
        content: result.content,
        metadata: { pages: result.pages, type: 'pdf' },
      };
    }

    case 'url': {
      if (typeof input !== 'string') {
        throw new Error('URL source requires a string input');
      }
      const result = await parseUrl(input);
      return {
        title: result.title,
        content: result.content,
        metadata: { url: result.url, type: 'url' },
      };
    }

    case 'youtube': {
      if (typeof input !== 'string') {
        throw new Error('YouTube source requires a string URL input');
      }
      const result = await parseYoutube(input);
      return {
        title: result.title,
        content: result.content,
        metadata: {
          videoId: result.videoId,
          url: result.url,
          type: 'youtube',
        },
      };
    }

    case 'text': {
      if (typeof input !== 'string') {
        throw new Error('Text source requires a string input');
      }
      const result = await parseText(input);
      return {
        title: result.title,
        content: result.content,
        metadata: { type: 'text' },
      };
    }

    default:
      throw new Error(`Unknown source type: ${type as string}`);
  }
}
