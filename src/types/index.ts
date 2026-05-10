export type SourceType = 'pdf' | 'text' | 'url' | 'youtube';
export type AudioFormat = 'deep-dive' | 'briefing' | 'study-guide' | 'custom';
export type MessageRole = 'user' | 'assistant';

export interface Notebook {
  id: string;
  title: string;
  description: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface Source {
  id: string;
  notebookId: string;
  title: string;
  type: SourceType;
  content: string;
  metadata: string; // JSON string
  fileSize: number | null;
  createdAt: number;
}

export interface Chunk {
  id: string;
  sourceId: string;
  notebookId: string;
  content: string;
  chunkIndex: number;
  metadata: string; // JSON string
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
  citations: string; // JSON string array of Citation
  createdAt: number;
}

export interface AudioOverview {
  id: string;
  notebookId: string;
  title: string;
  format: AudioFormat;
  script: string; // JSON string
  audioUrl: string | null;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  createdAt: number;
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

export interface StudyAid {
  type: 'faq' | 'study-guide' | 'timeline' | 'briefing';
  content: string;
}
