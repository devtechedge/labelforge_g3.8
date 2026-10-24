// LabelForge database adapter using Node.js built-in SQLite.
import { DatabaseSync } from 'node:sqlite';
import { existsSync, mkdirSync } from 'node:fs';
import { resolveDbPath } from './path';
import { SCHEMA_DDL } from './schema';
import { seedDemoDataIfNeeded } from './seed';

const config = resolveDbPath();

if (!existsSync(config.dataDir)) {
  mkdirSync(config.dataDir, { recursive: true });
}

let _db: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (!_db) {
    _db = new DatabaseSync(config.dbPath);
    _db.exec(`PRAGMA journal_mode = ${config.journalMode};`);
    _db.exec('PRAGMA foreign_keys = ON;');
    _db.exec(SCHEMA_DDL);
    seedDemoDataIfNeeded(_db);
  }
  return _db;
}
