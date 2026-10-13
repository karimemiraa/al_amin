import type { APIRoute } from 'astro';
import { getRange, publishedYears } from '../lib/prayer';

// Static JSON with every day of the published years plus one provisional year,
// fetched by the prayer widget when its inline window does not cover "today".
export const GET: APIRoute = () => {
  const first = publishedYears[0];
  const last = publishedYears.at(-1)! + 1;
  const days = (Date.UTC(last + 1, 0, 1) - Date.UTC(first, 0, 1)) / 86_400_000;
  const data = Object.fromEntries(getRange([first, 1, 1], days).map((d) => [d.date, [d.times, d.iqama, d.provisional ? 1 : 0]]));
  return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
};
