import type { APIRoute } from 'astro';
import { destroySession, SESSION_COOKIE, audit } from '../../lib/server/auth';
import { clearSessionCookie } from '../../admin/util';

export const prerender = false;

export const POST: APIRoute = (ctx) => {
  const token = ctx.cookies.get(SESSION_COOKIE)?.value;
  if (token) destroySession(token);
  if (ctx.locals.user) audit(ctx.locals.user, 'logout', ctx.locals.user.email);
  clearSessionCookie(ctx);
  return ctx.redirect('/admin/login?abgemeldet=1', 303);
};
