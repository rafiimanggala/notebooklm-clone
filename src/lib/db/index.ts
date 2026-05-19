import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { sql } from 'drizzle-orm';
import path from 'path';
import fs from 'fs';
import * as schema from './schema';
import { ensureDb } from './migrate';

const DB_PATH = path.join(process.cwd(), 'data', 'notebooklm.db');

// Ensure data directory and tables exist
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
ensureDb();

const sqlite = new Database(DB_PATH);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

export const db = drizzle(sqlite, { schema });
export { schema };

// Migration: add new columns (idempotent)
try { db.run(sql`ALTER TABLE sources ADD COLUMN enabled INTEGER NOT NULL DEFAULT 1`); } catch {}
try { db.run(sql`ALTER TABLE notebooks ADD COLUMN custom_instructions TEXT NOT NULL DEFAULT ''`); } catch {}
try { db.run(sql`ALTER TABLE notebooks ADD COLUMN chat_style TEXT NOT NULL DEFAULT 'default'`); } catch {}

// Migration: create new tables (idempotent)
try {
  db.run(sql`CREATE TABLE IF NOT EXISTS flashcard_sets (
    id TEXT PRIMARY KEY,
    notebook_id TEXT NOT NULL REFERENCES notebooks(id) ON DELETE CASCADE,
    flashcards TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )`);
} catch {}
try {
  db.run(sql`CREATE TABLE IF NOT EXISTS quiz_sets (
    id TEXT PRIMARY KEY,
    notebook_id TEXT NOT NULL REFERENCES notebooks(id) ON DELETE CASCADE,
    questions TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )`);
} catch {}
