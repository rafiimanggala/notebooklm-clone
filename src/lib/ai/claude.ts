import Anthropic from '@anthropic-ai/sdk';
import type { Citation, Flashcard, QuizQuestion, NotebookGuide, MindMapNode, DataTableResult, TOCEntry, SlideContent } from '@/types';

const MODEL = 'claude-sonnet-4-20250514';

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');
  return new Anthropic({ apiKey });
}

async function callClaude(prompt: string): Promise<string> {
  const client = getClient();
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 8192,
    messages: [{ role: 'user', content: prompt }],
  });
  const block = message.content[0];
  if (block.type !== 'text') throw new Error('Unexpected response type');
  return block.text.trim();
}

const SYSTEM_CHAT = `You are a helpful research assistant. Answer questions based ONLY on the provided sources. Cite sources using [i] notation (where i is the source number). If information is not in the sources, say so clearly. Never make up information.`;

const CHAT_STYLES: Record<string, string> = {
  default: 'Be helpful and thorough.',
  analyst: 'Analyze critically. Provide data-driven insights with pros and cons.',
  guide: 'Be encouraging and educational. Explain step by step.',
  creative: 'Think creatively and suggest novel connections between ideas.',
  concise: 'Be extremely brief. Use bullet points. No fluff.',
};

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

function buildChatPrompt(
  messages: Array<{ role: string; content: string }>,
  context: string,
  citations: Citation[],
  customInstructions?: string,
  chatStyle?: string,
  language?: string,
): string {
  const citationRef = citations
    .map((c, i) => `[${i + 1}] Source ID: ${c.sourceId}, Chunk: ${c.chunkId}`)
    .join('\n');

  const history = messages
    .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    .join('\n\n');

  const styleInstruction = CHAT_STYLES[chatStyle ?? 'default'] ?? CHAT_STYLES.default;
  const customBlock = customInstructions?.trim()
    ? `\n\nAdditional instructions from the user:\n${customInstructions.trim()}`
    : '';
  const langBlock = language && language !== 'English'
    ? `\n\nIMPORTANT: Respond entirely in ${language}.`
    : '';

  return `INSTRUCTIONS: ${SYSTEM_CHAT}

Style: ${styleInstruction}${customBlock}${langBlock}

Here are the sources you must use to answer:

${context}

Source reference mapping:
${citationRef}

CONVERSATION:
${history}

Respond to the latest user message:`;
}

export async function chatWithSources(
  messages: Array<{ role: string; content: string }>,
  context: string,
  citations: Citation[],
  customInstructions?: string,
  chatStyle?: string,
  language?: string,
): Promise<string> {
  const prompt = buildChatPrompt(messages, context, citations, customInstructions, chatStyle, language);
  return callClaude(prompt);
}

export function streamChatWithSources(
  messages: Array<{ role: string; content: string }>,
  context: string,
  citations: Citation[],
  customInstructions?: string,
  chatStyle?: string,
  language?: string,
): ReadableStream<Uint8Array> {
  const prompt = buildChatPrompt(messages, context, citations, customInstructions, chatStyle, language);
  const client = getClient();
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        const stream = client.messages.stream({
          model: MODEL,
          max_tokens: 4096,
          messages: [{ role: 'user', content: prompt }],
        });
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });
}

function langSuffix(language?: string): string {
  return language && language !== 'English'
    ? `\n\nIMPORTANT: Respond entirely in ${language}.`
    : '';
}

export async function generateStudyAid(
  type: 'faq' | 'study-guide' | 'timeline' | 'briefing',
  sourceContent: string,
  language?: string,
): Promise<string> {
  const instruction = STUDY_AID_PROMPTS[type];
  if (!instruction) {
    throw new Error(`Unknown study aid type: ${type}`);
  }

  return callClaude(`INSTRUCTIONS: You are a helpful study assistant. ${instruction}${langSuffix(language)}

Based on the following source material:

${sourceContent}`);
}

export async function generateAudioScript(
  sourceContent: string,
  format: string,
  language?: string,
): Promise<Array<{ speaker: 'host1' | 'host2'; text: string }>> {
  const tone = FORMAT_TONES[format] ?? FORMAT_TONES.custom;

  const text = await callClaude(`INSTRUCTIONS: ${PODCAST_SYSTEM}${langSuffix(language)}

Tone guidance: ${tone}

Create a podcast script discussing this material:

${sourceContent}`);

  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('Failed to parse audio script from AI response');
  }

  const parsed = JSON.parse(jsonMatch[0]) as Array<{
    speaker: 'host1' | 'host2';
    text: string;
  }>;

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
  const text = await callClaude(`Break the following query into 2-3 alternative search queries that capture different angles or synonyms. Return ONLY a JSON array of strings, nothing else.

Query: ${query}`);

  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];

  const parsed = JSON.parse(jsonMatch[0]) as string[];
  if (!Array.isArray(parsed)) return [];

  return parsed.filter((q) => typeof q === 'string' && q.trim().length > 0);
}

export async function generateFlashcards(
  sourceContent: string,
  language?: string,
): Promise<Flashcard[]> {
  const text = await callClaude(`INSTRUCTIONS: Generate 12 flashcards from the source material. Cover key concepts, definitions, and important facts. Output as JSON array of {id, front, back, difficulty} where difficulty is "easy"|"medium"|"hard". Distribute: 4 easy, 5 medium, 3 hard. Output ONLY the JSON array, nothing else.${langSuffix(language)}

Based on the following source material:

${sourceContent}`);

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
  language?: string,
): Promise<QuizQuestion[]> {
  const text = await callClaude(`INSTRUCTIONS: Generate 10 multiple-choice questions from the source material. Each question should test understanding, not just recall. Output as JSON array of {id, question, options (4 choices), correctIndex (0-3), explanation}. Output ONLY the JSON array, nothing else.${langSuffix(language)}

Based on the following source material:

${sourceContent}`);

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

export async function generateMindMap(
  sourceContent: string,
  language?: string,
): Promise<MindMapNode> {
  const text = await callClaude(`INSTRUCTIONS: Analyze the source material and create a hierarchical mind map. The central node should be the main topic. Output as JSON: {id, label, children: [{id, label, children: [...]}]}. Create 4-6 main branches with 2-4 sub-nodes each. Use descriptive but concise labels (3-8 words). Output ONLY the JSON object.${langSuffix(language)}

Based on the following source material:

${sourceContent}`);

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse mind map from AI response');
  }

  const parsed = JSON.parse(jsonMatch[0]) as MindMapNode;

  if (!parsed.id || !parsed.label) {
    throw new Error('Invalid mind map format');
  }

  return parsed;
}

export async function generateDataTable(
  sourceContent: string,
  language?: string,
): Promise<DataTableResult[]> {
  const text = await callClaude(`INSTRUCTIONS: Extract structured data from the sources into 1-3 tables. Each table should organize related facts, comparisons, or data points. Output as JSON array: [{title, headers: string[], rows: string[][]}]. Keep tables focused — max 8 columns, max 20 rows per table. Output ONLY the JSON array.${langSuffix(language)}

Based on the following source material:

${sourceContent}`);

  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('Failed to parse data tables from AI response');
  }

  const parsed = JSON.parse(jsonMatch[0]) as DataTableResult[];

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('Invalid data table format');
  }

  return parsed;
}

export async function generateTOC(
  sourceContent: string,
  language?: string,
): Promise<TOCEntry[]> {
  const text = await callClaude(`INSTRUCTIONS: Create a detailed table of contents for the source material. Include main topics (level 1), subtopics (level 2), and key details (level 3). Each entry should have a brief summary. Output as JSON array: [{id, title, level, summary}]. Include 10-20 entries total. Output ONLY the JSON array.${langSuffix(language)}

Based on the following source material:

${sourceContent}`);

  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('Failed to parse table of contents from AI response');
  }

  const parsed = JSON.parse(jsonMatch[0]) as TOCEntry[];

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('Invalid table of contents format');
  }

  return parsed;
}

export async function generateSlides(
  sourceContent: string,
  language?: string,
): Promise<SlideContent[]> {
  const text = await callClaude(`INSTRUCTIONS: Create a presentation with 8-12 slides from the source material. Each slide has a title and content (use markdown: headers, bullet points, bold for emphasis). Include a title slide, content slides, and a summary slide. Output as JSON array: [{id, title, content, notes}]. Output ONLY the JSON array.${langSuffix(language)}

Based on the following source material:

${sourceContent}`);

  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('Failed to parse slides from AI response');
  }

  const parsed = JSON.parse(jsonMatch[0]) as SlideContent[];

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('Invalid slides format');
  }

  return parsed;
}

export async function generateNotebookGuide(
  sourceContent: string,
  language?: string,
): Promise<NotebookGuide> {
  const text = await callClaude(`INSTRUCTIONS: Analyze the source material and create a notebook guide. Output as JSON: {summary: string (2-3 paragraphs overview), keyTopics: string[] (5-8 key topics), suggestedQuestions: string[] (6 insightful questions to explore)}. Output ONLY the JSON object, nothing else.${langSuffix(language)}

Based on the following source material:

${sourceContent}`);

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
