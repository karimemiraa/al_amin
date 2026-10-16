import type { APIRoute } from 'astro';
import { can } from '../../../lib/server/auth';
import { youtubeId, fetchOEmbed } from '../../../components/admin/content/youtube';

export const prerender = false;

/**
 * GET /admin/api/youtube?url=… → { id, title, author } for the Mediathek "add video" form.
 * Admin only. The id is extracted server-side; title and channel come from YouTube's oEmbed
 * endpoint (fetched for the canonical watch URL only, 5 s timeout).
 */
export const GET: APIRoute = async ({ url, locals }) => {
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  if (!locals.user || !can(locals.user, 'content')) return json({ error: 'forbidden' }, 403);
  const id = youtubeId(String(url.searchParams.get('url') ?? '').slice(0, 500));
  if (!id) return json({ error: 'invalid_url' }, 400);
  const meta = await fetchOEmbed(id);
  if (!meta) return json({ id, title: '', author: '', error: 'unavailable' }, 200);
  return json({ id, title: meta.title, author: meta.author });
};
