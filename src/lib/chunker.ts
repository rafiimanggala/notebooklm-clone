interface ChunkOptions {
  maxChunkSize?: number;
  overlap?: number;
}

const DEFAULT_MAX_CHUNK_SIZE = 1000;
const DEFAULT_OVERLAP = 200;

function splitSentences(text: string): string[] {
  // Split on sentence-ending punctuation followed by whitespace
  const sentences = text.match(/[^.!?]+[.!?]+[\s]*/g);
  if (!sentences) {
    return [text];
  }

  // Check for leftover text after last sentence
  const joined = sentences.join('');
  const remainder = text.slice(joined.length).trim();
  if (remainder) {
    sentences.push(remainder);
  }

  return sentences.map((s) => s.trim()).filter(Boolean);
}

function mergeSentencesIntoChunks(
  sentences: string[],
  maxSize: number,
  overlap: number,
): string[] {
  const chunks: string[] = [];
  let current = '';
  let sentenceBuffer: string[] = [];

  for (const sentence of sentences) {
    // If a single sentence exceeds max size, hard-split it
    if (sentence.length > maxSize) {
      if (current.trim()) {
        chunks.push(current.trim());
        sentenceBuffer = [];
        current = '';
      }
      for (let i = 0; i < sentence.length; i += maxSize - overlap) {
        chunks.push(sentence.slice(i, i + maxSize).trim());
      }
      continue;
    }

    const candidate = current ? `${current} ${sentence}` : sentence;

    if (candidate.length > maxSize && current.trim()) {
      chunks.push(current.trim());

      // Build overlap from trailing sentences
      let overlapText = '';
      for (let i = sentenceBuffer.length - 1; i >= 0; i--) {
        const candidate = sentenceBuffer[i] + (overlapText ? ` ${overlapText}` : '');
        if (candidate.length > overlap) break;
        overlapText = candidate;
      }

      current = overlapText ? `${overlapText} ${sentence}` : sentence;
      sentenceBuffer = overlapText
        ? [...sentenceBuffer.slice(-sentenceBuffer.length), sentence]
        : [sentence];
    } else {
      current = candidate;
      sentenceBuffer.push(sentence);
    }
  }

  if (current.trim()) {
    chunks.push(current.trim());
  }

  return chunks;
}

export function chunkText(text: string, options?: ChunkOptions): string[] {
  const maxChunkSize = options?.maxChunkSize ?? DEFAULT_MAX_CHUNK_SIZE;
  const overlap = options?.overlap ?? DEFAULT_OVERLAP;

  if (!text.trim()) {
    return [];
  }

  // If entire text fits in one chunk, return as-is
  if (text.length <= maxChunkSize) {
    return [text.trim()];
  }

  // Split into paragraphs first
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let currentGroup = '';

  for (const paragraph of paragraphs) {
    // If paragraph itself exceeds max size, split by sentences
    if (paragraph.length > maxChunkSize) {
      // Flush current group first
      if (currentGroup.trim()) {
        chunks.push(currentGroup.trim());
        currentGroup = '';
      }

      const sentences = splitSentences(paragraph);
      const sentenceChunks = mergeSentencesIntoChunks(sentences, maxChunkSize, overlap);
      chunks.push(...sentenceChunks);
      continue;
    }

    // Try to group paragraphs together
    const candidate = currentGroup
      ? `${currentGroup}\n\n${paragraph}`
      : paragraph;

    if (candidate.length > maxChunkSize && currentGroup.trim()) {
      chunks.push(currentGroup.trim());

      // Add paragraph overlap: include end of previous group
      const prevTail = currentGroup.slice(-overlap).trim();
      currentGroup = prevTail
        ? `${prevTail}\n\n${paragraph}`
        : paragraph;

      // If overlap + new paragraph exceeds max, just use paragraph
      if (currentGroup.length > maxChunkSize) {
        currentGroup = paragraph;
      }
    } else {
      currentGroup = candidate;
    }
  }

  if (currentGroup.trim()) {
    chunks.push(currentGroup.trim());
  }

  return chunks;
}
