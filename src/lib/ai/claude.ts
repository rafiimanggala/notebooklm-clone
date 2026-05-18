import { anthropic } from '@ai-sdk/anthropic';
import { generateText, streamText } from 'ai';
import type { Citation, Flashcard, QuizQuestion, NotebookGuide } from '@/types';

const MODEL = 'claude-sonnet-4-20250514';

const SYSTEM_CHAT = `You are a helpful research assistant. Answer questions based ONLY on the provided sources. Cite sources using [i] notation (where i is the source number). If information is not in the sources, say so clearly. Never make up information.`;

const STUDY_AID_PROMPTS: Record<string, string> = {
  faq: 'Generate 10 frequently asked questions and detailed answers based on these sources.',
  'study-guide':
    'Create a comprehensive study guide with key concepts, definitions, and review questions.',
  timeline:
    'Create a chronological timeline of events and developments from these sources.',
  briefing:
    'Write an executive briefing document summarizing the key points, findings, and recommendations.',
};

const PODCAST_SYSTEM = `You are a podcast script writer. Create an engaging conversation between two hosts discussing the provided material. Host 1 is an enthusiastic storyteller who gets excited about key findings. Host 2 is a calm, analytical thinker who adds depth and nuance. Include natural speech patterns: occasional 'um', 'you know', 'right', brief pauses marked with '...'. Keep each line of dialogue under 100 characters for natural speech segments. Output as JSON array of {speaker, text} objects.`;

const FORMAT_TONES: Record<string, string> = {
  'deep-dive': 'Be thorough and explore every angle. Take time to discuss nuances.',
  briefing: 'Be concise and focused. Cover key points efficiently.',
  'study-guide': 'Be educational and structured. Explain concepts clearly.',
  critique: 'Evaluate strengths and weaknesses. Be constructively critical.',
  debate: 'Present opposing viewpoints. Be fair to both sides.',
  custom: 'Be natural and conversational.',
};

export async function chatWithSources(
  messages: Array<{ role: string; content: string }>,
  context: string,
  citations: Citation[],
): Promise<ReadableStream> {
  const citationRef = citations
    .map(
      (c, i) =>
        `[${i + 1}] Source ID: ${c.sourceId}, Chunk: ${c.chunkId}`,
    )
    .join('\n');

  const systemPrompt = `${SYSTEM_CHAT}

Here are the sources you must use to answer:

${context}

Source reference mapping:
${citationRef}`;

  const aiMessages = messages.map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }));

  const result = streamText({
    model: anthropic(MODEL),
    system: systemPrompt,
    messages: aiMessages,
  });

  return result.textStream;
}

export async function generateStudyAid(
  type: 'faq' | 'study-guide' | 'timeline' | 'briefing',
  sourceContent: string,
): Promise<string> {
  const prompt = STUDY_AID_PROMPTS[type];
  if (!prompt) {
    throw new Error(`Unknown study aid type: ${type}`);
  }

  const { text } = await generateText({
    model: anthropic(MODEL),
    system: `You are a helpful study assistant. ${prompt}`,
    prompt: `Based on the following source material:\n\n${sourceContent}`,
  });

  return text;
}

export async function generateAudioScript(
  sourceContent: string,
  format: string,
): Promise<Array<{ speaker: 'host1' | 'host2'; text: string }>> {
  const tone = FORMAT_TONES[format] ?? FORMAT_TONES.custom;

  const { text } = await generateText({
    model: anthropic(MODEL),
    system: `${PODCAST_SYSTEM}\n\nTone guidance: ${tone}`,
    prompt: `Create a podcast script discussing this material:\n\n${sourceContent}`,
  });

  // Extract JSON from response (handle markdown code blocks)
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('Failed to parse audio script from AI response');
  }

  const parsed = JSON.parse(jsonMatch[0]) as Array<{
    speaker: 'host1' | 'host2';
    text: string;
  }>;

  // Validate structure
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('Invalid audio script format');
  }

  for (const entry of parsed) {
    if (!entry.speaker || !entry.text) {
      throw new Error('Invalid audio script entry: missing speaker or text');
    }
  }

  return parsed;
}

export async function decomposeQuery(query: string): Promise<string[]> {
  const { text } = await generateText({
    model: anthropic(MODEL),
    system:
      'Break the following query into 2-3 alternative search queries that capture different angles or synonyms. Return ONLY a JSON array of strings, nothing else.',
    prompt: query,
  });

  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    return [];
  }

  const parsed = JSON.parse(jsonMatch[0]) as string[];

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed.filter((q) => typeof q === 'string' && q.trim().length > 0);
}

export async function generateFlashcards(
  sourceContent: string,
): Promise<Flashcard[]> {
  const { text } = await generateText({
    model: anthropic(MODEL),
    system:
      'Generate 12 flashcards from the source material. Cover key concepts, definitions, and important facts. Output as JSON array of {id, front, back, difficulty} where difficulty is "easy"|"medium"|"hard". Distribute: 4 easy, 5 medium, 3 hard.',
    prompt: `Based on the following source material:\n\n${sourceContent}`,
  });

  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('Failed to parse flashcards from AI response');
  }

  const parsed = JSON.parse(jsonMatch[0]) as Flashcard[];

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('Invalid flashcards format');
  }

  return parsed;
}

export async function generateQuiz(
  sourceContent: string,
): Promise<QuizQuestion[]> {
  const { text } = await generateText({
    model: anthropic(MODEL),
    system:
      'Generate 10 multiple-choice questions from the source material. Each question should test understanding, not just recall. Output as JSON array of {id, question, options (4 choices), correctIndex (0-3), explanation}.',
    prompt: `Based on the following source material:\n\n${sourceContent}`,
  });

  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('Failed to parse quiz from AI response');
  }

  const parsed = JSON.parse(jsonMatch[0]) as QuizQuestion[];

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('Invalid quiz format');
  }

  return parsed;
}

export async function generateNotebookGuide(
  sourceContent: string,
): Promise<NotebookGuide> {
  const { text } = await generateText({
    model: anthropic(MODEL),
    system:
      'Analyze the source material and create a notebook guide. Output as JSON: {summary: string (2-3 paragraphs overview), keyTopics: string[] (5-8 key topics), suggestedQuestions: string[] (6 insightful questions to explore)}',
    prompt: `Based on the following source material:\n\n${sourceContent}`,
  });

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse notebook guide from AI response');
  }

  const parsed = JSON.parse(jsonMatch[0]) as NotebookGuide;

  if (!parsed.summary || !parsed.keyTopics || !parsed.suggestedQuestions) {
    throw new Error('Invalid notebook guide format');
  }

  return parsed;
}
