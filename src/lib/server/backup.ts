/**
 * SQLite backups: one-click download for owners and a nightly copy in BACKUP_DIR (14 days).
 * `VACUUM INTO` writes a consistent, compact copy of the live database without locking writers.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { getDb, BACKUP_DIR, UPLOAD_DIR } from './db';

const KEEP = 14;
const FIRST_RUN_MS = 2 * 60 * 1000;
const EVERY_MS = 24 * 60 * 60 * 1000;
/** Only these names are ever listed or served from BACKUP_DIR. */
export const BACKUP_NAME = /^igh-\d{4}-\d{2}-\d{2}\.sqlite$/;

/** Today's date in Hannover as YYYY-MM-DD. */
export const berlinDate = (d = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin' }).format(d);

/** Writes a consistent copy of the database to `target` (must not exist yet). */
export function vacuumInto(target: string) {
  getDb().prepare('VACUUM INTO ?').run(target);
}

/** Creates a temporary snapshot for a download. The caller deletes it afterwards. */
export function snapshotToTemp() {
  const file = path.join(os.tmpdir(), `igh-download-${crypto.randomBytes(8).toString('hex')}.sqlite`);
  vacuumInto(file);
  return file;
}

export type BackupFile = { name: string; size: number; date: string; mtime: number };

export function listBackups(): BackupFile[] {
  let names: string[] = [];
  try { names = fs.readdirSync(BACKUP_DIR); } catch { return []; }
  return names
    .filter((n) => BACKUP_NAME.test(n))
    .map((name) => {
      const st = fs.statSync(path.join(BACKUP_DIR, name));
      return { name, size: st.size, date: name.slice(4, 14), mtime: st.mtimeMs };
    })
    .sort((a, b) => b.name.localeCompare(a.name));
}

/** Resolves a backup file name to its path, or null if the name is not a valid backup. */
export function backupPath(name: string) {
  if (!BACKUP_NAME.test(name)) return null;
  const file = path.join(BACKUP_DIR, name);
  if (path.dirname(file) !== BACKUP_DIR || !fs.existsSync(file)) return null;
  return file;
}

/** Nightly backup: BACKUP_DIR/igh-YYYY-MM-DD.sqlite, keeps the newest 14. */
export function runBackup() {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const name = `igh-${berlinDate()}.sqlite`;
  const tmp = path.join(BACKUP_DIR, `.${name}.${process.pid}.tmp`);
  fs.rmSync(tmp, { force: true });
  vacuumInto(tmp);
  fs.renameSync(tmp, path.join(BACKUP_DIR, name));
  for (const old of listBackups().slice(KEEP)) fs.rmSync(path.join(BACKUP_DIR, old.name), { force: true });
  return name;
}

/** Starts the nightly backup timer once per process (first run 2 minutes after start). */
export function startBackupScheduler() {
  const g = globalThis as unknown as { __ighBackupScheduler?: boolean };
  if (g.__ighBackupScheduler) return;
  g.__ighBackupScheduler = true;
  const run = () => {
    try { runBackup(); } catch (err) { console.error('[backup] nightly backup failed', err); }
  };
  setTimeout(() => {
    run();
    setInterval(run, EVERY_MS).unref();
  }, FIRST_RUN_MS).unref();
}

/** Number and total size of uploaded images (for the "Bilder" note). */
export function uploadStats() {
  let count = 0, size = 0;
  const walk = (dir: string) => {
    let items: fs.Dirent[] = [];
    try { items = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const it of items) {
      const p = path.join(dir, it.name);
      if (it.isDirectory()) walk(p);
      else if (it.isFile()) { count++; size += fs.statSync(p).size; }
    }
  };
  walk(UPLOAD_DIR);
  return { count, size, dir: UPLOAD_DIR };
}
