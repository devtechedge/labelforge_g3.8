import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { resolveDbPath } from '../lib/db/path.ts';

test('local default resolves to data/labelforge.db with WAL journal', () => {
  const cfg = resolveDbPath({});
  assert.equal(cfg.dbPath, resolve(process.cwd(), 'data', 'labelforge.db'));
  assert.equal(cfg.journalMode, 'WAL');
});

test('serverless environment uses ephemeral /tmp database with DELETE journal', () => {
  const cfg = resolveDbPath({ VERCEL: '1' });
  assert.equal(cfg.dbPath, resolve('/tmp', 'labelforge-demo.db'));
  assert.equal(cfg.journalMode, 'DELETE');
});

test('explicit DATABASE_PATH wins over other modes', () => {
  const cfg = resolveDbPath({ VERCEL: '1', DATABASE_PATH: '/var/lib/label.db' });
  assert.equal(cfg.dbPath, '/var/lib/label.db');
  assert.equal(cfg.journalMode, 'WAL');
});
