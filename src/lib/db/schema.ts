import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const notebooks = sqliteTable('notebooks', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  customInstructions: text('custom_instructions').notNull().default(''),
  chatStyle: text('chat_style').notNull().default('default'), // 'default' | 'analyst' | 'guide' | 'creative' | 'concise'
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const sources = sqliteTable('sources', {
  id: text('id').primaryKey(),
  notebookId: text('notebook_id')
    .notNull()
    .references(() => notebooks.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  type: text('type').notNull(), // 'pdf' | 'text' | 'url' | 'youtube'
  content: text('content').notNull(), // raw extracted text
  metadata: text('metadata').notNull().default('{}'), // JSON string
  fileSize: integer('file_size'),
  enabled: integer('enabled').notNull().default(1), // 1=enabled, 0=disabled
  createdAt: integer('created_at').notNull(),
});

export const chunks = sqliteTable('chunks', {
  id: text('id').primaryKey(),
  sourceId: text('source_id')
    .notNull()
    .references(() => sources.id, { onDelete: 'cascade' }),
  notebookId: text('notebook_id')
    .notNull()
    .references(() => notebooks.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  chunkIndex: integer('chunk_index').notNull(),
  metadata: text('metadata').notNull().default('{}'), // JSON string
});

export const messages = sqliteTable('messages', {
  id: text('id').primaryKey(),
  notebookId: text('notebook_id')
    .notNull()
    .references(() => notebooks.id, { onDelete: 'cascade' }),
  role: text('role').notNull(), // 'user' | 'assistant'
  content: text('content').notNull(),
  citations: text('citations').notNull().default('[]'), // JSON string array of Citation
  createdAt: integer('created_at').notNull(),
});

export const flashcardSets = sqliteTable('flashcard_sets', {
  id: text('id').primaryKey(),
  notebookId: text('notebook_id').notNull().references(() => notebooks.id, { onDelete: 'cascade' }),
  flashcards: text('flashcards').notNull(), // JSON array of Flashcard objects
  createdAt: integer('created_at').notNull(),
});

export const quizSets = sqliteTable('quiz_sets', {
  id: text('id').primaryKey(),
  notebookId: text('notebook_id').notNull().references(() => notebooks.id, { onDelete: 'cascade' }),
  questions: text('questions').notNull(), // JSON array of QuizQuestion objects
  createdAt: integer('created_at').notNull(),
});

export const studyAidResults = sqliteTable('study_aid_results', {
  id: text('id').primaryKey(),
  notebookId: text('notebook_id').notNull().references(() => notebooks.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // 'mind-map' | 'data-table' | 'toc' | 'slides'
  result: text('result').notNull(), // JSON string
  createdAt: integer('created_at').notNull(),
});

export const audioOverviews = sqliteTable('audio_overviews', {
  id: text('id').primaryKey(),
  notebookId: text('notebook_id')
    .notNull()
    .references(() => notebooks.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  format: text('format').notNull(), // 'deep-dive' | 'briefing' | 'study-guide' | 'custom'
  script: text('script').notNull(), // full generated script JSON
  audioUrl: text('audio_url'),
  status: text('status').notNull().default('pending'), // 'pending' | 'generating' | 'completed' | 'failed'
  createdAt: integer('created_at').notNull(),
});
