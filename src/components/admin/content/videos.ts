/** Shared helpers for the Mediathek admin pages. */
import { getEntries, saveEntry, type Video } from '../../../lib/content';

export const SERIES = ['khutbah', 'sirah', 'aqidah', 'tazkiyah', 'quran', 'campaign', 'other'] as const;
export const VIDEO_LANGS = ['de', 'ar', 'de-ar'] as const;

/** Storage form of a video (dates as YYYY-MM-DD, empty optional fields dropped). */
export function serializeVideo(v: Video): Record<string, unknown> {
  const out: Record<string, unknown> = { ...v, date: v.date instanceof Date && !Number.isNaN(v.date.getTime()) ? v.date.toISOString().slice(0, 10) : String(v.date) };
  for (const k of ['title_ar', 'speaker']) if (!out[k]) delete out[k];
  return out;
}

/** Only one video may be featured: clears the flag on every other video. */
export function unfeatureOthers(exceptId: string, userId?: number) {
  for (const e of getEntries('videos')) {
    if (e.id !== exceptId && e.data.featured) saveEntry('videos', e.id, serializeVideo({ ...e.data, featured: false }), userId);
  }
}
