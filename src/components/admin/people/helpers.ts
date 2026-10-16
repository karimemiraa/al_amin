/**
 * Shared helpers for the people & security pages (users, account, invitations, audit log).
 */
import type { AstroCookies } from 'astro';
import { encrypt, decrypt } from '../../../lib/server/crypto';
import { createToken, type User } from '../../../lib/server/auth';
import { mailConfigured, sendMail } from '../../../lib/server/mail';
import { adminT, type AdminLang } from '../../../admin/i18n';

type Ctx = { cookies: AstroCookies; url: URL };

/** One-time data shown after a redirect (invite link, recovery codes). Encrypted, httpOnly, 5 minutes. */
export function setOnce(ctx: Ctx, name: string, data: unknown, path: string) {
  ctx.cookies.set(name, encrypt(JSON.stringify(data)), { path, httpOnly: true, sameSite: 'strict', secure: ctx.url.protocol === 'https:', maxAge: 300 });
}
export function takeOnce<T>(ctx: Ctx, name: string, path: string): T | null {
  const raw = ctx.cookies.get(name)?.value;
  if (!raw) return null;
  ctx.cookies.delete(name, { path });
  try { const plain = decrypt(raw); return plain ? (JSON.parse(plain) as T) : null; } catch { return null; }
}

export const initials = (name: string | null | undefined) =>
  (name ?? '?').trim().split(/\s+/).map((p) => p[0] ?? '').slice(0, 2).join('').toUpperCase() || '?';

/** SQLite "YYYY-MM-DD HH:MM:SS" (UTC) or epoch ms -> Date. */
export const toDate = (v: string | number) => (typeof v === 'number' ? new Date(v) : new Date(v.includes('T') ? v : v.replace(' ', 'T') + 'Z'));

export function fmtDate(lang: AdminLang, v: string | number | Date, o: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) {
  const d = v instanceof Date ? v : toDate(v);
  return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-u-nu-latn' : 'de-DE', { timeZone: 'Europe/Berlin', ...o }).format(d);
}

/** "vor 5 Min." style relative time, falling back to a date after a week. */
export function relTime(lang: AdminLang, v: string | number) {
  const d = toDate(v);
  const diff = (d.getTime() - Date.now()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(lang === 'ar' ? 'ar-u-nu-latn' : 'de-DE', { numeric: 'auto' });
  const abs = Math.abs(diff);
  if (abs < 60) return rtf.format(0, 'second');
  if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), 'hour');
  if (abs < 7 * 86400) return rtf.format(Math.round(diff / 86400), 'day');
  return fmtDate(lang, d, { day: 'numeric', month: 'short', year: 'numeric' });
}

/** "Chrome auf Windows" from a user agent string. */
export function deviceName(ua: string | null, lang: AdminLang) {
  const t = adminT(lang);
  if (!ua) return t('users.unknownDevice');
  const browser = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /SamsungBrowser/.test(ua) ? 'Samsung Internet'
    : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : '';
  const os = /iPhone/.test(ua) ? 'iPhone' : /iPad/.test(ua) ? 'iPad' : /Android/.test(ua) ? 'Android' : /Windows/.test(ua) ? 'Windows'
    : /Mac OS X|Macintosh/.test(ua) ? 'macOS' : /CrOS/.test(ua) ? 'ChromeOS' : /Linux/.test(ua) ? 'Linux' : '';
  if (browser && os) return t('users.deviceOn', { browser, os });
  return browser || os || ua.slice(0, 40);
}
export const isMobileUa = (ua: string | null) => !!ua && /iPhone|Android|Mobile/.test(ua);

/** Short public reference for a session (prefix of its hashed id), used in forms. */
export const sessionRef = (id: string) => id.slice(0, 16);

export type IssuedLink = { kind: 'invite' | 'reset'; name: string; email: string; link: string; expires: number; mail: 'sent' | 'failed' | 'off' };

/**
 * Creates an invite (7 days) or reset (24 h unless given) link for a user and e-mails it when SMTP is configured.
 */
export async function issueLink(user: User, kind: 'invite' | 'reset', origin: URL, inviter: string, ttlMs = kind === 'invite' ? 7 * 86400_000 : 86400_000): Promise<IssuedLink> {
  const raw = createToken(user.id, kind, ttlMs);
  const link = new URL(`/admin/${kind === 'invite' ? 'einladung' : 'passwort-neu'}/${raw}`, origin).href;
  const expires = Date.now() + ttlMs;
  let mail: IssuedLink['mail'] = 'off';
  if (mailConfigured()) {
    const t = adminT(user.lang);
    const vars = { name: user.name, inviter, link, date: fmtDate(user.lang, expires) };
    try {
      await sendMail({ to: user.email, subject: t(`${kind}.mailSubject`), text: t(`${kind}.mailText`, vars) });
      mail = 'sent';
    } catch (err) {
      console.error('[mail] link e-mail failed', err);
      mail = 'failed';
    }
  }
  return { kind, name: user.name, email: user.email, link, expires, mail };
}

const SECRET_KEY = /pass|secret|token|hash|recovery|totp|otp|apikey|api_key|private|signing|webhook/i;
const SECRET_VALUE = /^(sk|rk|whsec|pk)_(live|test)_|^-----BEGIN/;

/** Turns an audit details JSON into readable lines; secrets are never shown. */
export function detailLines(json: string | null, hidden: string): { key: string; value: string }[] {
  if (!json) return [];
  let data: unknown;
  try { data = JSON.parse(json); } catch { return [{ key: '', value: json.slice(0, 300) }]; }
  const show = (k: string, v: unknown): string => {
    if (SECRET_KEY.test(k)) return hidden;
    if (v === null || v === undefined || v === '') return '—';
    if (typeof v === 'boolean') return v ? '✓' : '✗';
    if (typeof v === 'object') {
      const o = v as Record<string, unknown>;
      if ('from' in o || 'to' in o) return `${show(k, o.from)} → ${show(k, o.to)}`;
      return Array.isArray(v) ? v.map((x) => show(k, x)).join(', ') : JSON.stringify(v).slice(0, 200);
    }
    const s = String(v);
    return SECRET_VALUE.test(s) ? hidden : s.slice(0, 200);
  };
  if (typeof data !== 'object' || data === null || Array.isArray(data)) return [{ key: '', value: show('', data) }];
  const keys = Object.keys(data);
  if (keys.every((k) => k === 'from' || k === 'to')) return [{ key: '', value: show('', data) }];
  return Object.entries(data as Record<string, unknown>).map(([k, v]) => ({ key: k, value: show(k, v) }));
}
