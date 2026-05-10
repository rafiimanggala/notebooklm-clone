import * as cheerio from 'cheerio';

interface UrlResult {
  title: string;
  content: string;
  url: string;
}

const REMOVE_SELECTORS = [
  'script',
  'style',
  'noscript',
  'iframe',
  'nav',
  'footer',
  'header',
  'aside',
  '[role="navigation"]',
  '[role="banner"]',
  '[role="contentinfo"]',
  '.nav',
  '.navbar',
  '.footer',
  '.sidebar',
  '.ads',
  '.ad',
  '.advertisement',
  '.cookie-banner',
  '.popup',
  '.modal',
  '.social-share',
  '.comments',
];

const CONTENT_SELECTORS = ['article', 'main', '[role="main"]', '.post-content', '.article-content', '.entry-content'];

function cleanText(text: string): string {
  return text
    .replace(/\t/g, ' ')
    .replace(/[ ]{2,}/g, ' ')
    .replace(/\n[ ]+/g, '\n')
    .replace(/[ ]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export async function parseUrl(url: string): Promise<UrlResult> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NotebookLM-Clone/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove unwanted elements
    REMOVE_SELECTORS.forEach((selector) => {
      $(selector).remove();
    });

    // Extract title
    const ogTitle = $('meta[property="og:title"]').attr('content');
    const htmlTitle = $('title').text();
    const h1Title = $('h1').first().text();
    const title = (ogTitle || htmlTitle || h1Title || 'Untitled Page').trim();

    // Extract main content
    let content = '';
    for (const selector of CONTENT_SELECTORS) {
      const el = $(selector).first();
      if (el.length > 0) {
        content = el.text();
        break;
      }
    }

    // Fallback to body
    if (!content.trim()) {
      content = $('body').text();
    }

    content = cleanText(content);

    if (!content) {
      throw new Error('No content could be extracted from the page');
    }

    return {
      title,
      content,
      url,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to parse URL "${url}": ${message}`);
  }
}
