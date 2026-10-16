import { describe, expect, it } from 'vitest';
import { announcementStatus, getCampaign, saveSetting, getSetting, getActiveTheme, isRamadanSeason, saveEntry, getEntry, deleteEntry, contentVersion, type Announcement } from '../src/lib/content';
import { epcPayload } from '../src/lib/girocode';
import { getDay } from '../src/lib/prayer';

const base: Announcement = { date: new Date('2026-10-01'), category: 'news', title_de: 'T', text_de: 'x', pinned: false, published: true };

describe('announcements', () => {
  const now = new Date('2026-10-16T12:00:00Z');
  it('computes status from publish window', () => {
    expect(announcementStatus({ ...base, published: false }, now)).toBe('draft');
    expect(announcementStatus({ ...base, publishFrom: '2026-10-20T06:00:00Z' }, now)).toBe('scheduled');
    expect(announcementStatus({ ...base, publishUntil: '2026-10-10T06:00:00Z' }, now)).toBe('expired');
    expect(announcementStatus(base, now)).toBe('live');
  });
  it('saving content bumps the cache version', () => {
    const v = contentVersion();
    saveEntry('announcements', 'test-x', { ...base, date: '2026-10-01' });
    expect(contentVersion()).toBeGreaterThan(v);
    expect(getEntry('announcements', 'test-x')?.data.date).toBeInstanceOf(Date);
    deleteEntry('announcements', 'test-x');
    expect(getEntry('announcements', 'test-x')).toBeUndefined();
  });
});

describe('campaign', () => {
  it('adds recorded online donations to the manual total', () => {
    const c = getSetting('campaign');
    saveSetting('campaign', { ...c, raised: 1000, donors: 3 });
    const shown = getCampaign();
    expect(shown.manualRaised).toBe(1000);
    expect(shown.raised).toBe(1000 + shown.onlineRaised);
  });
});

describe('themes', () => {
  it('detects Ramadan 1448 (around Feb 2027) and switches automatically', () => {
    expect(isRamadanSeason(new Date('2027-02-20T12:00:00Z'))).toBe(true);
    expect(isRamadanSeason(new Date('2026-10-16T12:00:00Z'))).toBe(false);
    saveSetting('theme', { active: 'green', autoRamadan: true, ramadanTheme: 'ramadan' });
    expect(getActiveTheme(new Date('2027-02-20T12:00:00Z'))).toBe('ramadan');
    expect(getActiveTheme(new Date('2026-10-16T12:00:00Z'))).toBe('green');
  });
});

describe('GiroCode', () => {
  it('builds a valid EPC payload', () => {
    const p = epcPayload(100).split('\n');
    expect(p.slice(0, 4)).toEqual(['BCD', '002', '1', 'SCT']);
    expect(p[6]).toMatch(/^DE\d{20}$/);
    expect(p[7]).toBe('EUR100.00');
    expect(epcPayload().endsWith('\n')).toBe(false);
  });
});

describe('prayer times', () => {
  it('reads the 2026 table and computes Iqama', () => {
    const d = getDay(2026, 10, 13);
    expect(d.times.fajr).toBe('05:49');
    expect(d.provisional).toBe(false);
    expect(d.iqama.fajr).toBe('06:19');
  });
  it('derives provisional 2027 times with the right DST shift', () => {
    const d = getDay(2027, 7, 1);
    expect(d.provisional).toBe(true);
    expect(d.times.dhuhr).toBe(getDay(2026, 7, 1).times.dhuhr);
  });
});
