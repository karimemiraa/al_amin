/**
 * SQLite storage for all editable content, users and audit log.
 * Uses Node's built-in `node:sqlite` (no native dependency). The database lives in
 * DATA_DIR (a Docker volume in production) and is seeded from the JSON files in
 * src/content/ on first start, so a fresh install shows the same content as before.
 */
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

import { DATA_DIR, UPLOAD_DIR, BACKUP_DIR } from './paths';
export { DATA_DIR, UPLOAD_DIR, BACKUP_DIR };

// Seed content bundled into the build.
const seedSettings = import.meta.glob<Record<string, unknown>>('../../content/settings/*.json', { eager: true, import: 'default' });
const seedEntries = {
  announcements: import.meta.glob<Record<string, unknown>>('../../content/announcements/*.json', { eager: true, import: 'default' }),
  program: import.meta.glob<Record<string, unknown>>('../../content/program/*.json', { eager: true, import: 'default' }),
  videos: import.meta.glob<Record<string, unknown>>('../../content/videos/*.json', { eager: true, import: 'default' }),
};

const SCHEMA = `
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_by INTEGER
);
CREATE TABLE IF NOT EXISTS entries (
  collection TEXT NOT NULL,
  id TEXT NOT NULL,
  data TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_by INTEGER,
  PRIMARY KEY (collection, id)
);
CREATE TABLE IF NOT EXISTS secrets (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'editor')),
  password_hash TEXT,
  lang TEXT NOT NULL DEFAULT 'de',
  totp_secret TEXT,
  totp_enabled INTEGER NOT NULL DEFAULT 0,
  totp_last_step INTEGER NOT NULL DEFAULT 0,
  mfa_failed INTEGER NOT NULL DEFAULT 0,
  recovery_codes TEXT NOT NULL DEFAULT '[]',
  active INTEGER NOT NULL DEFAULT 1,
  failed_logins INTEGER NOT NULL DEFAULT 0,
  locked_until TEXT,
  last_login_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mfa_ok INTEGER NOT NULL DEFAULT 0,
  sudo_until INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  last_seen INTEGER NOT NULL,
  ip TEXT,
  user_agent TEXT
);
CREATE TABLE IF NOT EXISTS tokens (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purpose TEXT NOT NULL CHECK (purpose IN ('invite', 'reset')),
  expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  at TEXT NOT NULL DEFAULT (datetime('now')),
  user_id INTEGER,
  user_name TEXT,
  action TEXT NOT NULL,
  target TEXT,
  details TEXT,
  sensitive INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS donations (
  id TEXT PRIMARY KEY,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL,
  fund TEXT NOT NULL,
  frequency TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS prayer_tables (
  year INTEGER PRIMARY KEY,
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_audit_at ON audit(at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
`;

/** Defaults for settings that did not exist in the original JSON content. */
const DEFAULT_SETTINGS: Record<string, unknown> = {
  theme: { active: 'wine', autoRamadan: true, ramadanTheme: 'ramadan' },
  notice: { active: false, text_de: '', text_ar: '', link: '', until: '', tone: 'gold' },
  security: { require2faForAll: false },
  payments: { stripeMode: 'test', autoOnlineTotal: true, paypalNote: '' },
  mail: { host: '', port: 587, user: '', from: '', to: '' },
};

let db: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (db) return db;
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const file = path.join(DATA_DIR, 'igh.sqlite');
  db = new DatabaseSync(file);
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');
  db.exec(SCHEMA);
  migrate(db);
  seed(db);
  return db;
}

/** Additive schema changes for databases created by an earlier version. */
function migrate(d: DatabaseSync) {
  const cols = (d.prepare('PRAGMA table_info(users)').all() as { name: string }[]).map((c) => c.name);
  if (!cols.includes('mfa_failed')) d.exec('ALTER TABLE users ADD COLUMN mfa_failed INTEGER NOT NULL DEFAULT 0');
}

function seed(d: DatabaseSync) {
  const insertSetting = d.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
  for (const [file, value] of Object.entries(seedSettings)) {
    insertSetting.run(path.basename(file, '.json'), JSON.stringify(value));
  }
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) insertSetting.run(key, JSON.stringify(value));

  const hasEntries = d.prepare('SELECT COUNT(*) AS n FROM entries').get() as { n: number };
  if (hasEntries.n === 0) {
    const insert = d.prepare('INSERT INTO entries (collection, id, data) VALUES (?, ?, ?)');
    for (const [collection, files] of Object.entries(seedEntries)) {
      for (const [file, value] of Object.entries(files)) insert.run(collection, path.basename(file, '.json'), JSON.stringify(value));
    }
  }
}

/** Run a function inside a transaction. */
export function tx<T>(fn: () => T): T {
  const d = getDb();
  d.exec('BEGIN');
  try {
    const result = fn();
    d.exec('COMMIT');
    return result;
  } catch (err) {
    d.exec('ROLLBACK');
    throw err;
  }
}
