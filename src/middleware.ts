import { defineMiddleware } from 'astro:middleware';
import { contentVersion } from './lib/content';

/**
 * 1. Admin: loads the session, enforces login + 2FA, sets no-store headers.
 * 2. Public pages: in-memory cache of rendered HTML and optimized images, invalidated on every save.
 */

const PUBLIC_ADMIN = [/^\/admin\/login(\/|$)/, /^\/admin\/logout$/, /^\/admin\/setup$/, /^\/admin\/einladung\//, /^\/admin\/passwort-(vergessen|neu)/];
const ENROLL_PATH = '/admin/2fa-einrichten';

// --- Page cache ---------------------------------------------------------------------
type Cached = { version: number; day: string; status: number; headers: [string, string][]; body: ArrayBuffer };
const cache = new Map<string, Cached>();
const MAX_ENTRIES = 600;
const berlinDay = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin' }).format(new Date());

function remember(key: string, entry: Cached) {
  if (cache.size >= MAX_ENTRIES) cache.delete(cache.keys().next().value!);
  cache.set(key, entry);
}

export const onRequest = defineMiddleware(async (ctx, next) => {
  if (ctx.isPrerendered) return next();
  const { pathname } = ctx.url;

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
  const key = isImage ? pathname + ctx.url.search : pathname;
  const day = isImage ? '' : berlinDay();
  const hit = cache.get(key);
  if (hit && (isImage || (hit.version === contentVersion() && hit.day === day))) {
    return new Response(hit.body.slice(0), { status: hit.status, headers: [...hit.headers, ['X-Cache', 'HIT']] });
  }

  const res = await next();
  const type = res.headers.get('Content-Type') ?? '';
  if (res.status === 200 && (isImage || type.includes('text/html') || type.includes('application/json'))) {
    const body = await res.arrayBuffer();
    const headers: [string, string][] = [...res.headers.entries()];
    if (isImage) headers.push(['Cache-Control', 'public, max-age=31536000, immutable']);
    remember(key, { version: contentVersion(), day, status: res.status, headers, body });
    return new Response(body.slice(0), { status: res.status, headers: [...headers, ['X-Cache', 'MISS']] });
  }
  return res;
});
