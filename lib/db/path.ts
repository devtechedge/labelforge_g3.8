import { resolve } from 'node:path';

export type JournalMode = 'WAL' | 'DELETE';

export interface DbPathConfig {
  dataDir: string;
  dbPath: string;
  journalMode: JournalMode;
}

/**
 * Resolves where the SQLite database lives.
 *
 * - `VERCEL` set: ephemeral /tmp database, re-seeded on cold start,
 *   journal disabled to avoid extra files on read-mostly filesystems.
 * - `DATABASE_PATH` set: explicit path override (local/self-hosted only).
 * - Otherwise: `./data/labelforge.db` next to the project root, which is
 *   what local development and `npm run dev` use.
 */
export function resolveDbPath(
  env: Record<string, string | undefined> = process.env as Record<string, string | undefined>
): DbPathConfig {
  if (env.DATABASE_PATH) {
    return {
      dataDir: resolve(env.DATABASE_PATH, '..'),
      dbPath: env.DATABASE_PATH,
      journalMode: 'WAL',
    };
  }

  if (env.VERCEL) {
    return {
      dataDir: '/tmp',
      dbPath: resolve('/tmp', 'labelforge-demo.db'),
      journalMode: 'DELETE',
    };
  }

  const dataDir = resolve(process.cwd(), 'data');
  return {
    dataDir,
    dbPath: resolve(dataDir, 'labelforge.db'),
    journalMode: 'WAL',
  };
}
