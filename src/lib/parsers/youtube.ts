import { YoutubeTranscript } from 'youtube-transcript';

interface YoutubeResult {
  title: string;
  content: string;
  videoId: string;
  url: string;
}

function extractVideoId(url: string): string {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }

  throw new Error(`Could not extract video ID from URL: ${url}`);
}

function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

async function fetchVideoTitle(videoId: string): Promise<string> {
  try {
    const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NotebookLM-Clone/1.0)',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return 'Untitled Video';
    }

    const html = await response.text();

    // Try og:title first
    const ogMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/);
    if (ogMatch?.[1]) {
      return ogMatch[1].trim();
    }

    // Fallback to <title>
    const titleMatch = html.match(/<title>([^<]+)<\/title>/);
    if (titleMatch?.[1]) {
      return titleMatch[1].replace(/ - YouTube$/, '').trim();
    }

    return 'Untitled Video';
  } catch {
    return 'Untitled Video';
  }
}

export async function parseYoutube(url: string): Promise<YoutubeResult> {
  try {
    const videoId = extractVideoId(url);
    const canonicalUrl = `https://www.youtube.com/watch?v=${videoId}`;

    const [transcriptSegments, title] = await Promise.all([
      YoutubeTranscript.fetchTranscript(videoId),
      fetchVideoTitle(videoId),
    ]);

    if (!transcriptSegments || transcriptSegments.length === 0) {
      throw new Error('No transcript available for this video');
    }

    const content = transcriptSegments
      .map((segment) => {
        const timestamp = formatTimestamp(segment.offset / 1000);
        const text = segment.text
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&#39;/g, "'")
          .replace(/&quot;/g, '"')
          .trim();
        return `[${timestamp}] ${text}`;
      })
      .join('\n');

    return {
      title,
      content,
      videoId,
      url: canonicalUrl,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to parse YouTube video: ${message}`);
  }
}
