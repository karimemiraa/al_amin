/**
 * Users, sessions, login protection, 2FA and audit log for the admin.
 */
import { getDb } from './db';
import { getSetting } from '../content';
import {
  hashPassword, verifyPassword, randomToken, sha256, encrypt, decrypt,
  verifyTotp, newRecoveryCodes, normalizeRecovery, safeEqual,
} from './crypto';

export type Role = 'owner' | 'editor';
export type User = {
  id: number; email: string; name: string; role: Role; lang: 'de' | 'ar';
  totpEnabled: boolean; active: boolean; hasPassword: boolean; lastLoginAt: string | null; createdAt: string;
};
export type Session = { id: string; userId: number; mfaOk: boolean; sudoUntil: number; createdAt: number; lastSeen: number; ip: string | null; userAgent: string | null };

export const SESSION_COOKIE = 'igh_admin';
const IDLE_MS = 12 * 60 * 60 * 1000;
const ABSOLUTE_MS = 7 * 24 * 60 * 60 * 1000;
export const SUDO_MS = 10 * 60 * 1000;
const MAX_FAILED = 5;
const LOCK_MS = 15 * 60 * 1000;

type UserRow = {
  id: number; email: string; name: string; role: Role; lang: string; password_hash: string | null;
  totp_secret: string | null; totp_enabled: number; totp_last_step: number; recovery_codes: string;
  active: number; failed_logins: number; locked_until: string | null; last_login_at: string | null; created_at: string;
};

const toUser = (r: UserRow): User => ({
  id: r.id, email: r.email, name: r.name, role: r.role, lang: r.lang === 'ar' ? 'ar' : 'de',
  totpEnabled: !!r.totp_enabled, active: !!r.active, hasPassword: !!r.password_hash,
  lastLoginAt: r.last_login_at, createdAt: r.created_at,
});

const row = (id: number) => getDb().prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined;

// --- Users ------------------------------------------------------------------------
export const userCount = () => (getDb().prepare('SELECT COUNT(*) AS n FROM users').get() as { n: number }).n;
export const getUser = (id: number) => { const r = row(id); return r ? toUser(r) : undefined; };
export const listUsers = () => (getDb().prepare('SELECT * FROM users ORDER BY role, name').all() as UserRow[]).map(toUser);
export const ownerEmails = () =>
  (getDb().prepare("SELECT email FROM users WHERE role = 'owner' AND active = 1").all() as { email: string }[]).map((r) => r.email);
export const activeOwnerCount = () =>
  (getDb().prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'owner' AND active = 1").get() as { n: number }).n;

export function findUserByEmail(email: string) {
  const r = getDb().prepare('SELECT * FROM users WHERE email = ?').get(email.trim()) as UserRow | undefined;
  return r ? toUser(r) : undefined;
}

export function createUser(input: { email: string; name: string; role: Role; lang?: 'de' | 'ar'; password?: string }) {
  const info = getDb()
    .prepare('INSERT INTO users (email, name, role, lang, password_hash) VALUES (?, ?, ?, ?, ?)')
    .run(input.email.trim().toLowerCase(), input.name.trim(), input.role, input.lang ?? 'de', input.password ? hashPassword(input.password) : null);
  return Number(info.lastInsertRowid);
}

export function updateUser(id: number, patch: Partial<{ name: string; email: string; role: Role; lang: 'de' | 'ar'; active: boolean }>) {
  const r = row(id);
  if (!r) return;
  getDb()
    .prepare('UPDATE users SET name = ?, email = ?, role = ?, lang = ?, active = ? WHERE id = ?')
    .run(patch.name ?? r.name, (patch.email ?? r.email).toLowerCase(), patch.role ?? r.role, patch.lang ?? r.lang, patch.active === undefined ? r.active : patch.active ? 1 : 0, id);
  if (patch.active === false) destroyUserSessions(id);
}

export function deleteUser(id: number) {
  getDb().prepare('DELETE FROM users WHERE id = ?').run(id);
}

export function setPassword(id: number, password: string) {
  getDb().prepare('UPDATE users SET password_hash = ?, failed_logins = 0, locked_until = NULL WHERE id = ?').run(hashPassword(password), id);
}

export const checkPassword = (id: number, password: string) => verifyPassword(password, row(id)?.password_hash);

/** Returns an error key if the password is too weak, otherwise null. */
export function passwordProblem(password: string, email?: string): string | null {
  if (password.length < 10) return 'pw.short';
  if (email && password.toLowerCase().includes(email.split('@')[0].toLowerCase())) return 'pw.email';
  if (/^(.)\1+$/.test(password) || ['1234567890', 'passwort123', 'password123', 'qwertzuiop'].includes(password.toLowerCase())) return 'pw.common';
  return null;
}

// --- Login protection ------------------------------------------------------------------
const ipAttempts = new Map<string, number[]>();
const IP_WINDOW = 15 * 60 * 1000;
const IP_LIMIT = 20;

export function ipBlocked(ip: string) {
  const now = Date.now();
  const recent = (ipAttempts.get(ip) ?? []).filter((t) => now - t < IP_WINDOW);
  ipAttempts.set(ip, recent);
  return recent.length >= IP_LIMIT;
}
const noteIpFailure = (ip: string) => ipAttempts.set(ip, [...(ipAttempts.get(ip) ?? []), Date.now()]);

export type LoginResult = { ok: true; user: User } | { ok: false; reason: 'invalid' | 'locked' | 'rate' | 'inactive' };

export function attemptLogin(email: string, password: string, ip: string): LoginResult {
  if (ipBlocked(ip)) return { ok: false, reason: 'rate' };
  const r = getDb().prepare('SELECT * FROM users WHERE email = ?').get(email.trim()) as UserRow | undefined;
  const passwordOk = verifyPassword(password, r?.password_hash); // runs even for unknown e-mails
  if (!r) { noteIpFailure(ip); return { ok: false, reason: 'invalid' }; }
  if (r.locked_until && new Date(r.locked_until).getTime() > Date.now()) return { ok: false, reason: 'locked' };
  if (!passwordOk) {
    noteIpFailure(ip);
    const failed = r.failed_logins + 1;
    const lock = failed >= MAX_FAILED ? new Date(Date.now() + LOCK_MS).toISOString() : null;
    getDb().prepare('UPDATE users SET failed_logins = ?, locked_until = ? WHERE id = ?').run(lock ? 0 : failed, lock, r.id);
    if (lock) audit(toUser(r), 'login.locked', r.email, { ip }, true);
    return { ok: false, reason: lock ? 'locked' : 'invalid' };
  }
  if (!r.active) return { ok: false, reason: 'inactive' };
  getDb().prepare('UPDATE users SET failed_logins = 0, locked_until = NULL WHERE id = ?').run(r.id);
  return { ok: true, user: toUser(r) };
}

export function markLogin(userId: number) {
  getDb().prepare("UPDATE users SET last_login_at = datetime('now') WHERE id = ?").run(userId);
}

// --- Sessions ---------------------------------------------------------------------------
export function createSession(userId: number, mfaOk: boolean, ip: string | null, userAgent: string | null) {
  const token = randomToken();
  const now = Date.now();
  getDb()
    .prepare('INSERT INTO sessions (id, user_id, mfa_ok, sudo_until, created_at, last_seen, ip, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run(sha256(token), userId, mfaOk ? 1 : 0, mfaOk ? now + SUDO_MS : 0, now, now, ip, (userAgent ?? '').slice(0, 200));
  return token;
}

type SessionRow = { id: string; user_id: number; mfa_ok: number; sudo_until: number; created_at: number; last_seen: number; ip: string | null; user_agent: string | null };
const toSession = (s: SessionRow): Session => ({ id: s.id, userId: s.user_id, mfaOk: !!s.mfa_ok, sudoUntil: s.sudo_until, createdAt: s.created_at, lastSeen: s.last_seen, ip: s.ip, userAgent: s.user_agent });

export function getSession(token: string | undefined): { session: Session; user: User } | null {
  if (!token) return null;
  const id = sha256(token);
  const s = getDb().prepare('SELECT * FROM sessions WHERE id = ?').get(id) as SessionRow | undefined;
  if (!s) return null;
  const now = Date.now();
  if (now - s.last_seen > IDLE_MS || now - s.created_at > ABSOLUTE_MS) { destroySessionById(id); return null; }
  const r = row(s.user_id);
  if (!r || !r.active) { destroySessionById(id); return null; }
  if (now - s.last_seen > 60_000) getDb().prepare('UPDATE sessions SET last_seen = ? WHERE id = ?').run(now, id);
  return { session: toSession(s), user: toUser(r) };
}

export const destroySessionById = (id: string) => getDb().prepare('DELETE FROM sessions WHERE id = ?').run(id);
export const destroySession = (token: string) => destroySessionById(sha256(token));
export function destroyUserSessions(userId: number, exceptId?: string) {
  getDb().prepare('DELETE FROM sessions WHERE user_id = ? AND id != ?').run(userId, exceptId ?? '');
}
export const listSessions = (userId: number) =>
  (getDb().prepare('SELECT * FROM sessions WHERE user_id = ? ORDER BY last_seen DESC').all(userId) as SessionRow[]).map(toSession);

export function markMfa(sessionId: string) {
  getDb().prepare('UPDATE sessions SET mfa_ok = 1, sudo_until = ? WHERE id = ?').run(Date.now() + SUDO_MS, sessionId);
}
export function grantSudo(sessionId: string) {
  getDb().prepare('UPDATE sessions SET sudo_until = ? WHERE id = ?').run(Date.now() + SUDO_MS, sessionId);
}
export const hasSudo = (session: Session) => session.sudoUntil > Date.now();

// --- Two-factor authentication --------------------------------------------------------------
/** 2FA is mandatory for owners, and for everyone once the owner switches the policy on. */
export function twoFactorRequired(user: User) {
  return user.role === 'owner' || getSetting('security').require2faForAll === true;
}

export function enableTotp(userId: number, secret: string, step: number) {
  const codes = newRecoveryCodes();
  getDb()
    .prepare('UPDATE users SET totp_secret = ?, totp_enabled = 1, totp_last_step = ?, recovery_codes = ? WHERE id = ?')
    .run(encrypt(secret), step, JSON.stringify(codes.map((c) => sha256(normalizeRecovery(c)))), userId);
  return codes;
}

export function disableTotp(userId: number) {
  getDb().prepare("UPDATE users SET totp_secret = NULL, totp_enabled = 0, totp_last_step = 0, recovery_codes = '[]' WHERE id = ?").run(userId);
}

export function regenerateRecoveryCodes(userId: number) {
  const codes = newRecoveryCodes();
  getDb().prepare('UPDATE users SET recovery_codes = ? WHERE id = ?').run(JSON.stringify(codes.map((c) => sha256(normalizeRecovery(c)))), userId);
  return codes;
}

export const recoveryCodesLeft = (userId: number) => (JSON.parse(row(userId)?.recovery_codes ?? '[]') as string[]).length;

/** Verifies a TOTP code (no replay) or consumes a recovery code. */
export function verifySecondFactor(userId: number, code: string): 'totp' | 'recovery' | null {
  const r = row(userId);
  if (!r?.totp_enabled || !r.totp_secret) return null;
  const secret = decrypt(r.totp_secret);
  if (secret) {
    const step = verifyTotp(secret, code);
    if (step !== null && step > r.totp_last_step) {
      getDb().prepare('UPDATE users SET totp_last_step = ? WHERE id = ?').run(step, userId);
      return 'totp';
    }
  }
  const hashes = JSON.parse(r.recovery_codes) as string[];
  const h = sha256(normalizeRecovery(code));
  const idx = hashes.findIndex((x) => safeEqual(x, h));
  if (idx >= 0) {
    hashes.splice(idx, 1);
    getDb().prepare('UPDATE users SET recovery_codes = ? WHERE id = ?').run(JSON.stringify(hashes), userId);
    return 'recovery';
  }
  return null;
}

// --- Invite / password-reset links ---------------------------------------------------------------
export function createToken(userId: number, purpose: 'invite' | 'reset', ttlMs: number) {
  const raw = randomToken(24);
  getDb().prepare('DELETE FROM tokens WHERE user_id = ? AND purpose = ?').run(userId, purpose);
  getDb().prepare('INSERT INTO tokens (id, user_id, purpose, expires_at) VALUES (?, ?, ?, ?)').run(sha256(raw), userId, purpose, Date.now() + ttlMs);
  return raw;
}

export function peekToken(raw: string, purpose: 'invite' | 'reset') {
  const t = getDb().prepare('SELECT user_id, expires_at FROM tokens WHERE id = ? AND purpose = ?').get(sha256(raw), purpose) as
    | { user_id: number; expires_at: number }
    | undefined;
  return t && t.expires_at > Date.now() ? t.user_id : null;
}

export function consumeToken(raw: string, purpose: 'invite' | 'reset') {
  const userId = peekToken(raw, purpose);
  getDb().prepare('DELETE FROM tokens WHERE id = ?').run(sha256(raw));
  return userId;
}

// --- Permissions --------------------------------------------------------------------------------
export type Area = 'content' | 'campaign' | 'org' | 'payments' | 'design' | 'users' | 'audit' | 'backup';
const EDITOR_AREAS: Area[] = ['content', 'campaign', 'audit'];
export const can = (user: User, area: Area) => user.role === 'owner' || EDITOR_AREAS.includes(area);

// --- Audit log -----------------------------------------------------------------------------------
export function audit(user: Pick<User, 'id' | 'name'> | null, action: string, target?: string, details?: unknown, sensitive = false) {
  getDb()
    .prepare('INSERT INTO audit (user_id, user_name, action, target, details, sensitive) VALUES (?, ?, ?, ?, ?, ?)')
    .run(user?.id ?? null, user?.name ?? null, action, target ?? null, details === undefined ? null : JSON.stringify(details), sensitive ? 1 : 0);
}

export type AuditRow = { id: number; at: string; user_id: number | null; user_name: string | null; action: string; target: string | null; details: string | null; sensitive: number };
export function listAudit(limit = 50, offset = 0, onlySensitive = false) {
  return getDb()
    .prepare(`SELECT * FROM audit ${onlySensitive ? 'WHERE sensitive = 1' : ''} ORDER BY id DESC LIMIT ? OFFSET ?`)
    .all(limit, offset) as AuditRow[];
}
