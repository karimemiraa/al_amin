import { defineMiddleware } from 'astro:middleware';
import { contentVersion } from './lib/content';
import { startBackupScheduler } from './lib/server/backup';

/**
 * 1. Admin: loads the session, enforces login + 2FA, sets no-store headers.
 * 2. Public pages: in-memory cache of rendered HTML and optimized images, invalidated on every save.
 */

const PUBLIC_ADMIN = [/^\/admin\/login(\/|$)/, /^\/admin\/logout$/, /^\/admin\/setup$/, /^\/admin\/einladung\//, /^\/admin\/passwort-vergessen$/, /^\/admin\/passwort-neu\/[^/]+$/];
const ENROLL_PATH = '/admin/2fa-einrichten';
let warnedSecret = false;

// --- Page cache ---------------------------------------------------------------------
type Cached = { version: number; day: string; at: number; status: number; headers: [string, string][]; body: ArrayBuffer };
// HTML is re-rendered at least every 5 minutes so scheduled announcements and notices appear on time.
const HTML_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, Cached>();
const MAX_ENTRIES = 600;
const berlinDay = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin' }).format(new Date());

const MAX_BYTES = 200 * 1024 * 1024;
let cachedBytes = 0;

function remember(key: string, entry: Cached) {
  const old = cache.get(key);
  if (old) { cachedBytes -= old.body.byteLength; cache.delete(key); }
  while (cache.size && (cache.size >= MAX_ENTRIES || cachedBytes + entry.body.byteLength > MAX_BYTES)) {
    const oldest = cache.keys().next().value!;
    cachedBytes -= cache.get(oldest)!.body.byteLength;
    cache.delete(oldest);
  }
  cache.set(key, entry);
  cachedBytes += entry.body.byteLength;
}

// --- Image transforms ------------------------------------------------------------------
// /_image can resize any bundled image to any size, which costs CPU and memory. Only the
// transforms our own pages reference (collected from rendered HTML) are cached; anything else
// is validated, served uncached and rate-limited per IP.
const IMAGE_PARAMS = new Set(['href', 'w', 'h', 'q', 'f', 'fit', 'position', 'background']);
const issuedImages = new Set<string>();
const imageHits = new Map<string, number[]>();

function imageKey(url: URL): string | null {
  const params = [...url.searchParams.entries()];
  if (!params.length || params.some(([k]) => !IMAGE_PARAMS.has(k))) return null;
  const p = url.searchParams;
  if (p.get('f') && !/^(webp|avif|jpe?g|png)$/.test(p.get('f')!)) return null;
  for (const dim of ['w', 'h']) if (p.get(dim) && !(Number(p.get(dim)) >= 1 && Number(p.get(dim)) <= 2400)) return null;
  return '/_image?' + params.sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
}

function harvestImages(html: string) {
  for (const m of html.matchAll(/\/_image\?[^"'\s)<>,]+/g)) {
    if (issuedImages.size >= 5000) return;
    const key = imageKey(new URL(m[0].replace(/&amp;/g, '&'), 'http://x'));
    if (key) issuedImages.add(key);
  }
}

function imageRateLimited(ip: string) {
  const now = Date.now();
  const recent = (imageHits.get(ip) ?? []).filter((t) => now - t < 60_000);
  recent.push(now);
  imageHits.set(ip, recent);
  if (imageHits.size > 10_000) imageHits.clear();
  return recent.length > 60;
}

export const onRequest = defineMiddleware(async (ctx, next) => {
  if (ctx.isPrerendered) return next();
  startBackupScheduler(); // once per process: first backup 2 min after start, then every 24 h
  if (import.meta.env.PROD && !process.env.APP_SECRET && !warnedSecret) {
    warnedSecret = true;
    console.error('[security] APP_SECRET is not set – saving credentials and 2FA will fail. Add it to .env and restart.');
  }
  const { pathname } = ctx.url;

  // trailingSlash is 'never': send hand-typed or old links like /admin/ or /spenden/ to the canonical URL.
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return ctx.redirect(pathname.replace(/\/+$/, '').replace(/^\/+/, '/') + ctx.url.search, 301); // never '//host'
  }

  // --- Admin ---------------------------------------------------------------------------
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    const { getSession, userCount, twoFactorRequired, SESSION_COOKIE } = await import('./lib/server/auth');
    const auth = getSession(ctx.cookies.get(SESSION_COOKIE)?.value);
    ctx.locals.user = auth?.user ?? null;
    ctx.locals.session = auth?.session ?? null;
    ctx.locals.flash = null;
    if (ctx.request.method === 'GET') {
      const { takeFlash } = await import('./admin/util');
      ctx.locals.flash = takeFlash(ctx);
    }

    const finish = (res: Response) => {
      res.headers.set('Cache-Control', 'no-store');
      res.headers.set('X-Robots-Tag', 'noindex, nofollow');
      res.headers.set('X-Frame-Options', 'DENY');
      res.headers.set('Referrer-Policy', 'same-origin');
      return res;
    };
    const isApi = pathname.startsWith('/admin/api/');
    const deny = (to: string) => finish(isApi ? new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } }) : ctx.redirect(to, 302));

    if (PUBLIC_ADMIN.some((re) => re.test(pathname))) {
      if (pathname !== '/admin/setup' && userCount() === 0) return finish(ctx.redirect('/admin/setup', 302));
      return finish(await next());
    }
    if (userCount() === 0) return deny('/admin/setup');
    if (!auth) return deny(`/admin/login?next=${encodeURIComponent(pathname + ctx.url.search)}`);

    const { user, session } = auth;
    const allowedWhilePending = pathname === ENROLL_PATH || pathname === '/admin/logout';
    if (user.totpEnabled && !session.mfaOk) return deny('/admin/login/2fa');
    if (!user.totpEnabled && twoFactorRequired(user) && !allowedWhilePending) return deny(ENROLL_PATH);
    return finish(await next());
  }

  // --- Public cache -----------------------------------------------------------------------
  const cacheable =
    ctx.request.method === 'GET' &&
    !pathname.startsWith('/api/') &&
    !pathname.startsWith('/uploads/') &&
    !pathname.startsWith('/danke') &&
    !pathname.startsWith('/ar/danke');
  if (!cacheable) return next();

  const isImage = pathname.startsWith('/_image');
  let key = pathname;
  if (isImage) {
    const k = imageKey(ctx.url);
    if (!k) return new Response('Bad image request', { status: 400 });
    if (!issuedImages.has(k)) {
      const { clientIp } = await import('./admin/util');
      if (imageRateLimited(clientIp(ctx))) return new Response('Too many requests', { status: 429, headers: { 'Retry-After': '60' } });
      return next(); // valid but not used by any page: render, don't cache
    }
    key = k;
  }
  const day = isImage ? '' : berlinDay();
  const hit = cache.get(key);
  if (hit && (isImage || (hit.version === contentVersion() && hit.day === day && Date.now() - hit.at < HTML_TTL_MS))) {
    return new Response(hit.body.slice(0), { status: hit.status, headers: [...hit.headers, ['X-Cache', 'HIT']] });
  }

  const res = await next();
  const type = res.headers.get('Content-Type') ?? '';
  if (res.status === 200 && (isImage || type.includes('text/html') || type.includes('application/json'))) {
    const body = await res.arrayBuffer();
    if (!isImage) harvestImages(new TextDecoder().decode(body));
    const headers: [string, string][] = [...res.headers.entries()];
    if (isImage) headers.push(['Cache-Control', 'public, max-age=31536000, immutable']);
    remember(key, { version: contentVersion(), day, at: Date.now(), status: res.status, headers, body });
    return new Response(body.slice(0), { status: res.status, headers: [...headers, ['X-Cache', 'MISS']] });
  }
  return res;
});
