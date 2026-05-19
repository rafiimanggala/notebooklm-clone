export type SourceType = 'pdf' | 'text' | 'url' | 'youtube' | 'markdown' | 'csv' | 'docx';
export type AudioFormat = 'deep-dive' | 'briefing' | 'critique' | 'debate' | 'custom';
export type MessageRole = 'user' | 'assistant';
export type StudyAidType = 'faq' | 'study-guide' | 'timeline' | 'briefing' | 'flashcard' | 'quiz' | 'mind-map' | 'data-table' | 'toc' | 'slides';

export type ChatStyle = 'default' | 'analyst' | 'guide' | 'creative' | 'concise';

export interface Notebook {
  id: string;
  title: string;
  description: string | null;
  customInstructions?: string;
  chatStyle?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Source {
  id: string;
  notebookId: string;
  title: string;
  type: SourceType;
  content: string;
  metadata: string;
  fileSize: number | null;
  createdAt: number;
  enabled?: number | boolean;
}

export interface Chunk {
  id: string;
  sourceId: string;
  notebookId: string;
  content: string;
  chunkIndex: number;
  metadata: string;
}

export interface Citation {
  sourceId: string;
  chunkId: string;
  text: string;
}

export interface Message {
  id: string;
  notebookId: string;
  role: MessageRole;
  content: string;
  citations: string;
  createdAt: number;
}

export interface AudioOverview {
  id: string;
  notebookId: string;
  title: string;
  format: AudioFormat;
  script: string;
  audioUrl: string | null;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  createdAt: number;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface NotebookGuide {
  summary: string;
  keyTopics: string[];
  suggestedQuestions: string[];
}

export interface ChatRequest {
  notebookId: string;
  message: string;
}

export interface ChatResponse {
  id: string;
  role: MessageRole;
  content: string;
  citations: Citation[];
  createdAt: number;
}

export interface SourceUploadRequest {
  notebookId: string;
  title: string;
  type: SourceType;
  content: string;
  metadata?: Record<string, unknown>;
  fileSize?: number;
}

export interface RetrievalResult {
  chunk: Chunk;
  score: number;
  source: Source;
}

export interface MindMapNode {
  id: string;
  label: string;
  children?: MindMapNode[];
  color?: string;
}

export interface DataTableResult {
  title: string;
  headers: string[];
  rows: string[][];
}

export interface TOCEntry {
  id: string;
  title: string;
  level: number; // 1, 2, or 3
  summary?: string;
}

export interface SlideContent {
  id: string;
  title: string;
  content: string; // markdown
  notes?: string;
}

export interface StudyAid {
  type: StudyAidType;
  content: string;
}
