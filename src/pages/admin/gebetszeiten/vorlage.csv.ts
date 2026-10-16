import type { APIRoute } from 'astro';
import { can } from '../../../lib/server/auth';
import { getPublishedYears, getRange, berlinToday, PRAYERS, type DayTimes } from '../../../lib/prayer';
import { prayerCsv } from '../../../components/admin/content/prayer-csv';

export const prerender = false;

/** GET /admin/gebetszeiten/vorlage.csv?jahr=2026 → the published table of that year as CSV (template for uploads). */
export const GET: APIRoute = ({ url, locals }) => {
  if (!locals.user || !can(locals.user, 'content')) return new Response('Forbidden', { status: 403 });
  const years = getPublishedYears();
  const wanted = Number(url.searchParams.get('jahr'));
  const year = years.includes(wanted) ? wanted : years.includes(berlinToday()[0]) ? berlinToday()[0] : years.at(-1)!;
  const days = new Date(Date.UTC(year, 1, 29)).getUTCMonth() === 1 ? 366 : 365;
  const table: Record<string, DayTimes> = {};
  for (const d of getRange([year, 1, 1], days)) table[d.date] = Object.fromEntries(PRAYERS.map((p) => [p, d.times[p]])) as DayTimes;
  return new Response('﻿' + prayerCsv(table), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="gebetszeiten-${year}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
};
