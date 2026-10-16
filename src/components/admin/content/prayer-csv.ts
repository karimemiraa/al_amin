/**
 * Parses and validates a yearly prayer table uploaded as CSV.
 * Columns: date,fajr,sunrise,dhuhr,asr,maghrib,isha (header row optional, `;` or `,` separated).
 * Lenient about what Excel produces (BOM, quotes, CRLF, 6:25, 06:25:00, 01.02.2027) but strict
 * about the content: one complete year, well-formed times in the right order.
 */
import { PRAYERS, type DayTimes } from '../../../lib/prayer';

export type CsvError = { key: string; vars?: Record<string, string | number> };
export type CsvResult = { ok: true; year: number; data: Record<string, DayTimes> } | { ok: false; errors: CsvError[]; total: number };

export const MAX_CSV_BYTES = 200_000;
const MAX_ERRORS = 12;
const pad = (n: number) => String(n).padStart(2, '0');

function normDate(raw: string): string | null {
  let y: number, m: number, d: number;
  let match = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (match) [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
  else if ((match = raw.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/))) [d, m, y] = [Number(match[1]), Number(match[2]), Number(match[3])];
  else return null;
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
  return `${y}-${pad(m)}-${pad(d)}`;
}

function normTime(raw: string): string | null {
  const m = raw.match(/^(\d{1,2})[:.](\d{2})(?::00)?$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return `${pad(h)}:${pad(min)}`;
}

const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));

export function parsePrayerCsv(text: string, opts: { minYear: number; maxYear: number }): CsvResult {
  const errors: CsvError[] = [];
  let total = 0;
  const fail = (e: CsvError) => { total++; if (errors.length < MAX_ERRORS) errors.push(e); };

  const lines = text.replace(/^﻿/, '').split(/\r\n|\n|\r/);
  if (!lines.some((l) => l.trim())) return { ok: false, errors: [{ key: 'prayer.err.empty' }], total: 1 };

  const data: Record<string, DayTimes> = {};
  const firstLine = new Map<string, number>();
  let year: number | null = null;

  lines.forEach((rawLine, i) => {
    const line = i + 1;
    if (!rawLine.trim()) return;
    const sep = rawLine.includes(';') ? ';' : rawLine.includes('\t') ? '\t' : ',';
    const cells = rawLine.split(sep).map((c) => c.trim().replace(/^"(.*)"$/, '$1').trim());
    while (cells.length > 7 && cells.at(-1) === '') cells.pop(); // trailing separators from Excel
    if (line === 1 && /date|datum/i.test(cells[0] ?? '')) return; // header row
    if (cells.length !== 7) {
      const d = normDate(cells[0] ?? '');
      if (d && !firstLine.has(d)) firstLine.set(d, line); // reported once, not again as "missing"
      return fail({ key: 'prayer.err.columns', vars: { line, n: cells.length } });
    }

    const date = normDate(cells[0]);
    if (!date) return fail({ key: 'prayer.err.date', vars: { line, value: cells[0].slice(0, 20) } });
    const y = Number(date.slice(0, 4));
    if (year === null) {
      if (y < opts.minYear || y > opts.maxYear) {
        total++;
        errors.push({ key: 'prayer.err.yearRange', vars: { year: y, min: opts.minYear, max: opts.maxYear } });
        year = -1;
        return;
      }
      year = y;
    }
    if (year === -1) return;
    if (y !== year) return fail({ key: 'prayer.err.year', vars: { line, value: date, year } });
    if (firstLine.has(date)) return fail({ key: 'prayer.err.dupe', vars: { line, value: date, first: firstLine.get(date)! } });
    firstLine.set(date, line);

    const times = {} as DayTimes;
    let bad = false;
    PRAYERS.forEach((p, idx) => {
      const tm = normTime(cells[idx + 1]);
      if (!tm) { bad = true; fail({ key: 'prayer.err.time', vars: { line, prayer: `@${p}`, value: cells[idx + 1].slice(0, 12) } }); }
      else times[p] = tm;
    });
    if (bad) return;
    for (let k = 1; k < PRAYERS.length; k++) {
      const a = PRAYERS[k - 1];
      const b = PRAYERS[k];
      if (toMin(times[a]) >= toMin(times[b])) {
        fail({ key: 'prayer.err.order', vars: { line, a: `@${a}`, ta: times[a], b: `@${b}`, tb: times[b] } });
        return;
      }
    }
    data[date] = times;
  });

  if (year === -1) return { ok: false, errors, total };
  if (year === null) return { ok: false, errors: errors.length ? errors : [{ key: 'prayer.err.empty' }], total: Math.max(total, 1) };

  // Every day of the year must be present (rows with errors count as present, to avoid double reports).
  const missing: string[] = [];
  for (let dt = new Date(Date.UTC(year, 0, 1)); dt.getUTCFullYear() === year; dt.setUTCDate(dt.getUTCDate() + 1)) {
    const iso = dt.toISOString().slice(0, 10);
    if (!firstLine.has(iso)) missing.push(iso);
  }
  if (missing.length) {
    total++;
    errors.push({ key: 'prayer.err.missing', vars: { n: missing.length, dates: missing.slice(0, 5).join(', ') + (missing.length > 5 ? ' …' : '') } });
  }
  if (total > 0) return { ok: false, errors, total };
  return { ok: true, year, data: Object.fromEntries(Object.entries(data).sort(([a], [b]) => a.localeCompare(b))) };
}

/** CSV text for a year's table (used as a download template). */
export function prayerCsv(table: Record<string, DayTimes>) {
  const rows = Object.keys(table).sort().map((d) => [d, ...PRAYERS.map((p) => table[d][p])].join(';'));
  return ['date;fajr;sunrise;dhuhr;asr;maghrib;isha', ...rows].join('\r\n') + '\r\n';
}
