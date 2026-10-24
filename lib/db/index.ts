// LabelForge database adapter using Node.js built-in SQLite.
import { DatabaseSync } from 'node:sqlite';
import { existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { SCHEMA_DDL } from './schema';
import { seedDemoDataIfNeeded } from './seed';

// Serverless environments (Vercel) get an ephemeral database under /tmp.
// It is re-seeded on every cold start, so demo state resets between instances.
const DATA_DIR = process.env.VERCEL ? '/tmp' : resolve(process.cwd(), 'data');

if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = process.env.VERCEL
  ? resolve(DATA_DIR, 'labelforge-demo.db')
  : resolve(DATA_DIR, 'labelforge.db');

let _db: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (!_db) {
    _db = new DatabaseSync(DB_PATH);
    _db.exec(
      process.env.VERCEL ? 'PRAGMA journal_mode = DELETE;' : 'PRAGMA journal_mode = WAL;'
    );
    _db.exec('PRAGMA foreign_keys = ON;');
    _db.exec(SCHEMA_DDL);
    seedDemoDataIfNeeded(_db);
  }
  return _db;
}
