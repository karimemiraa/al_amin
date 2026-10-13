import prayerSettings from '../content/settings/prayer.json';

export const PRAYERS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;
export type PrayerKey = (typeof PRAYERS)[number];
export type DayTimes = Record<PrayerKey, string>;
export type ResolvedDay = { date: string; times: DayTimes; iqama: Partial<Record<PrayerKey, string>>; provisional: boolean };

// Yearly tables published by the mosque (src/data/prayer-times/<year>.json).
const tables = import.meta.glob<Record<string, DayTimes>>('../data/prayer-times/*.json', { eager: true, import: 'default' });
const byYear = new Map<number, Record<string, DayTimes>>(
  Object.entries(tables).map(([path, data]) => [Number(path.match(/(\d{4})\.json$/)![1]), data]),
);
const years = [...byYear.keys()].sort();

const pad = (n: number) => String(n).padStart(2, '0');
export const isoDate = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;

function lastSunday(year: number, month: number) {
  const last = new Date(Date.UTC(year, month, 0));
  return last.getUTCDate() - last.getUTCDay();
}

/** Central European Summer Time is active (for whole calendar days). */
export function isSummerTime(y: number, m: number, d: number) {
  if (m < 3 || m > 10) return false;
  if (m > 3 && m < 10) return true;
  return m === 3 ? d >= lastSunday(y, 3) : d < lastSunday(y, 10);
}

const toMin = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};
const toTime = (min: number) => `${pad(Math.floor((((min % 1440) + 1440) % 1440) / 60))}:${pad((((min % 1440) + 1440) % 1440) % 60)}`;

/**
 * Times for a calendar day. If the mosque has not yet published the table for that year,
 * the same day of the latest published year is used, corrected for the different
 * daylight-saving switch dates (accurate to about one minute) and flagged as provisional.
 */
export function getDay(y: number, m: number, d: number): ResolvedDay {
  const date = isoDate(y, m, d);
  const exact = byYear.get(y)?.[date];
  let times: DayTimes;
  let provisional = false;
  if (exact) {
    times = exact;
  } else {
    provisional = true;
    const srcYear = years.filter((yr) => yr < y).at(-1) ?? years.at(-1)!;
    const srcDay = Math.min(d, new Date(Date.UTC(srcYear, m, 0)).getUTCDate());
    const src = byYear.get(srcYear)![isoDate(srcYear, m, srcDay)];
    const shift = (isSummerTime(y, m, d) ? 60 : 0) - (isSummerTime(srcYear, m, srcDay) ? 60 : 0);
    times = Object.fromEntries(PRAYERS.map((p) => [p, toTime(toMin(src[p]) + shift)])) as DayTimes;
  }
  const offsets = prayerSettings.iqamaOffsets as Record<string, number>;
  const iqama = Object.fromEntries(
    Object.entries(offsets).map(([p, off]) => [p, toTime(toMin(times[p as PrayerKey]) + off)]),
  ) as Partial<Record<PrayerKey, string>>;
  return { date, times, iqama, provisional };
}

/** Today's date in Hannover as [y, m, d]. */
export function berlinToday(now = new Date()): [number, number, number] {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  const [y, m, d] = parts.split('-').map(Number);
  return [y, m, d];
}

/** Consecutive days starting at the given date (used to ship a small window of times to the browser). */
export function getRange(start: [number, number, number], days: number): ResolvedDay[] {
  const out: ResolvedDay[] = [];
  const cur = new Date(Date.UTC(start[0], start[1] - 1, start[2]));
  for (let i = 0; i < days; i++) {
    out.push(getDay(cur.getUTCFullYear(), cur.getUTCMonth() + 1, cur.getUTCDate()));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return out;
}

export function getMonth(y: number, m: number): ResolvedDay[] {
  return getRange([y, m, 1], new Date(Date.UTC(y, m, 0)).getUTCDate());
}

export const publishedYears = years;
export const jumuah = prayerSettings.jumuah;
export const iqamaOffsets = prayerSettings.iqamaOffsets;
