import Anthropic from '@anthropic-ai/sdk';

type ImageMediaType = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';

interface ImageResult {
  title: string;
  content: string;
}

export async function parseImage(buffer: Buffer, mimeType: string): Promise<ImageResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY required for image parsing');

  try {
    const client = new Anthropic({ apiKey });
    const base64 = buffer.toString('base64');
    const mediaType = mimeType as ImageMediaType;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: base64 },
          },
          {
            type: 'text',
            text: 'Describe this image in detail. Extract ALL visible text (OCR). Structure your response as:\n\nTITLE: [brief descriptive title]\n\nDESCRIPTION:\n[detailed description]\n\nEXTRACTED TEXT:\n[all visible text, preserving layout where possible]',
          },
        ],
      }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';

    const titleMatch = text.match(/TITLE:\s*(.+)/i);
    const title = titleMatch?.[1]?.trim().slice(0, 200) || 'Image';

    return { title, content: text };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to parse image: ${msg}`);
  }
}
