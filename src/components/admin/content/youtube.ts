/**
 * YouTube helpers for the Mediathek admin: extract the 11-character video id from any common
 * link form and fetch title/channel via oEmbed (server-side, no API key needed).
 */
export const YT_ID = /^[A-Za-z0-9_-]{11}$/;

/** Returns the video id for watch?v=, youtu.be/, /live/, /shorts/, /embed/ links or a bare id. */
export function youtubeId(input: string): string | null {
  const raw = input.trim();
  if (YT_ID.test(raw)) return raw;
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return null;
  }
  const host = url.hostname.toLowerCase().replace(/^(www|m|music)\./, '');
  let id: string | null = null;
  if (host === 'youtu.be') id = url.pathname.split('/')[1] ?? null;
  else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    if (url.pathname === '/watch') id = url.searchParams.get('v');
    else {
      const m = url.pathname.match(/^\/(?:live|shorts|embed|v)\/([^/?#]+)/);
      id = m?.[1] ?? null;
    }
  }
  return id && YT_ID.test(id) ? id : null;
}

export type OEmbed = { title: string; author: string };

/** Title and channel name from YouTube's oEmbed endpoint (5 s timeout). Null on any failure. */
export async function fetchOEmbed(id: string): Promise<OEmbed | null> {
  if (!YT_ID.test(id)) return null;
  const target = `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}&format=json`;
  try {
    const res = await fetch(target, { signal: AbortSignal.timeout(5000), headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    const data = (await res.json()) as { title?: unknown; author_name?: unknown };
    return { title: String(data.title ?? '').slice(0, 200), author: String(data.author_name ?? '').slice(0, 120) };
  } catch {
    return null;
  }
}
