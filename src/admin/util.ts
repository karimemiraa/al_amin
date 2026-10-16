/**
 * Small helpers shared by all admin pages: forms, flash messages, guards, cookies.
 */
import type { AstroCookies } from 'astro';
import { SESSION_COOKIE, can, hasSudo, type Area, type User, type Session } from '../lib/server/auth';
import type { AdminLang } from './i18n';

type Ctx = { request: Request; url: URL; cookies: AstroCookies; locals: App.Locals; clientAddress: string; redirect: (path: string, status?: 301 | 302 | 303 | 307 | 308) => Response };

export const LANG_COOKIE = 'igh_admin_lang';
const FLASH_COOKIE = 'igh_flash';

/**
 * Client IP. Astro only trusts X-Forwarded-For when the Host was validated against
 * security.allowedDomains (i.e. the request came through Caddy), so it can't be spoofed.
 */
export function clientIp(ctx: Pick<Ctx, 'request' | 'clientAddress'>) {
  try { return ctx.clientAddress || 'unknown'; } catch { return 'unknown'; }
}

export function adminLang(ctx: Pick<Ctx, 'locals' | 'cookies' | 'request'>): AdminLang {
  if (ctx.locals.user) return ctx.locals.user.lang;
  const c = ctx.cookies.get(LANG_COOKIE)?.value;
  if (c === 'ar' || c === 'de') return c;
  return /^ar\b/i.test(ctx.request.headers.get('accept-language') ?? '') ? 'ar' : 'de';
}

const isSecure = (url: URL) => url.protocol === 'https:';

export function setSessionCookie(ctx: Pick<Ctx, 'cookies' | 'url'>, token: string) {
  ctx.cookies.set(SESSION_COOKIE, token, { path: '/', httpOnly: true, sameSite: 'strict', secure: isSecure(ctx.url), maxAge: 7 * 24 * 3600 });
}
export const clearSessionCookie = (ctx: Pick<Ctx, 'cookies'>) => ctx.cookies.delete(SESSION_COOKIE, { path: '/' });

// --- Flash messages (shown once after a redirect) ------------------------------------
export type Flash = { type: 'ok' | 'error' | 'info'; key: string; vars?: Record<string, string>; link?: string };

export function setFlash(ctx: Pick<Ctx, 'cookies' | 'url'>, flash: Flash) {
  ctx.cookies.set(FLASH_COOKIE, JSON.stringify(flash), { path: '/admin', httpOnly: true, sameSite: 'strict', secure: isSecure(ctx.url), maxAge: 60 });
}

export function takeFlash(ctx: Pick<Ctx, 'cookies'>): Flash | null {
  const raw = ctx.cookies.get(FLASH_COOKIE)?.value;
  if (!raw) return null;
  ctx.cookies.delete(FLASH_COOKIE, { path: '/admin' });
  try { return JSON.parse(raw) as Flash; } catch { return null; }
}

// --- Guards ---------------------------------------------------------------------------------
export function currentUser(ctx: Pick<Ctx, 'locals'>): { user: User; session: Session } {
  if (!ctx.locals.user || !ctx.locals.session) throw new Error('admin page rendered without session');
  return { user: ctx.locals.user, session: ctx.locals.session };
}

/** Redirects to the dashboard with a message if the user's role may not use this area. */
export function guardArea(ctx: Ctx, area: Area): Response | null {
  const { user } = currentUser(ctx);
  if (can(user, area)) return null;
  setFlash(ctx, { type: 'error', key: 'flash.forbidden' });
  return ctx.redirect('/admin', 303);
}

/** Sensitive areas need a fresh password + 2FA confirmation (valid 10 minutes). */
export function guardSudo(ctx: Ctx): Response | null {
  const { session } = currentUser(ctx);
  if (hasSudo(session)) return null;
  return ctx.redirect(`/admin/bestaetigen?next=${encodeURIComponent(ctx.url.pathname + ctx.url.search)}`, 303);
}

/** Only allow relative admin paths as redirect targets. */
export const safeNext = (next: string | null | undefined, fallback = '/admin') =>
  next && /^\/admin(\/|$|\?)/.test(next) && !next.startsWith('//') ? next : fallback;

// --- Form parsing ------------------------------------------------------------------------------
export const str = (fd: FormData, name: string, max = 5000) => String(fd.get(name) ?? '').trim().slice(0, max);
export const bool = (fd: FormData, name: string) => fd.get(name) === 'on' || fd.get(name) === '1' || fd.get(name) === 'true';
export function num(fd: FormData, name: string, fallback = 0) {
  const raw = String(fd.get(name) ?? '').replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '');
  const n = Number(raw);
  return Number.isFinite(n) && raw !== '' ? n : fallback;
}
export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
export const isTime = (v: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(v);
export const isDate = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(new Date(v).getTime());

// --- Europe/Berlin wall time <-> ISO (for <input type="datetime-local">) --------------------
function berlinOffsetMinutes(utcMs: number) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Berlin', hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
      .formatToParts(new Date(utcMs))
      .map((p) => [p.type, p.value]),
  );
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute);
  return Math.round((asUtc - Math.floor(utcMs / 60000) * 60000) / 60000);
}

/** "2026-10-19T08:00" (Hannover wall time) -> ISO string with the correct UTC instant. */
export function berlinToIso(local: string): string {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local)) return '';
  const [d, tm] = local.split('T');
  const [y, mo, da] = d.split('-').map(Number);
  const [h, mi] = tm.split(':').map(Number);
  const guess = Date.UTC(y, mo - 1, da, h, mi);
  const offset = berlinOffsetMinutes(guess - berlinOffsetMinutes(guess) * 60000);
  return new Date(guess - offset * 60000).toISOString();
}

/** ISO instant -> "2026-10-19T08:00" in Hannover wall time. */
export function isoToBerlin(iso: string | undefined): string {
  if (!iso) return '';
  const ms = new Date(iso).getTime();
  if (Number.isNaN(ms)) return '';
  return new Date(ms + berlinOffsetMinutes(ms) * 60000).toISOString().slice(0, 16);
}
