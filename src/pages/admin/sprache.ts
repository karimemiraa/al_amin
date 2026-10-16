import type { APIRoute } from 'astro';
import { updateUser } from '../../lib/server/auth';
import { safeNext, LANG_COOKIE } from '../../admin/util';

export const prerender = false;

/** Toggles the admin interface language (German ⇄ Arabic) for the signed-in user. */
export const POST: APIRoute = async (ctx) => {
  const user = ctx.locals.user!;
  const lang = user.lang === 'ar' ? 'de' : 'ar';
  updateUser(user.id, { lang });
  ctx.cookies.set(LANG_COOKIE, lang, { path: '/admin', sameSite: 'strict', maxAge: 31536000 });
  const fd = await ctx.request.formData();
  return ctx.redirect(safeNext(String(fd.get('next') ?? '')), 303);
};
