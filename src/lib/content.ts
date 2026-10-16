/**
 * Content access for the public site and the admin. All reads go through here, so the
 * site always shows what the admin saved. Reads are synchronous (SQLite) and cheap;
 * rendered pages are additionally cached in the middleware (see src/middleware.ts).
 */
import { getDb, tx } from './server/db';

export type Site = {
  orgName: string; mosqueName: string; mosqueNameAr: string;
  street: string; zip: string; city: string; directionsDe: string; directionsAr: string;
  phone: string; phoneContactName: string; email: string; mapsUrl: string; founded: number;
  representatives: string[]; registerCourt: string; registerNumber: string;
  taxOffice: string; taxNumber: string; exemptionNoticeDate: string;
  bank: { accountHolder: string; iban: string; bic: string; bankName: string; reference: string };
  social: { telegram: string; youtubeChannelId: string; youtubeUrl: string; whatsappChannel: string; instagram: string };
};
export type Milestone = { date: string; done: boolean; titleDe: string; titleAr: string };
export type Campaign = {
  goal: number; raised: number; donors: number; asOf: string; deadline: string;
  pricePerSqm: number; totalSqm: number; floors: number; sqmPerFloor: number; outdoorSqm: number;
  distanceToCurrentKm: number; minutesToTransit: number; milestones: Milestone[];
};
export type PrayerSettings = {
  iqamaOffsets: Record<'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha', number>;
  jumuah: { time: string; noteDe: string; noteAr: string }[];
  noticeDe: string; noticeAr: string;
};
export type ThemeId = 'wine' | 'green' | 'navy' | 'ramadan';
export type ThemeSettings = { active: ThemeId; autoRamadan: boolean; ramadanTheme: ThemeId };
export type Notice = { active: boolean; text_de: string; text_ar: string; link: string; until: string; tone: 'gold' | 'brand' };
export type SecuritySettings = { require2faForAll: boolean };
export type PaymentSettings = { stripeMode: 'test' | 'live'; autoOnlineTotal: boolean; paypalNote: string };
export type MailSettings = { host: string; port: number; user: string; from: string; to: string };

type SettingsMap = {
  site: Site; campaign: Campaign; prayer: PrayerSettings; theme: ThemeSettings; notice: Notice;
  security: SecuritySettings; payments: PaymentSettings; mail: MailSettings;
};
export type SettingKey = keyof SettingsMap;

export type Announcement = {
  date: Date; category: 'news' | 'campaign' | 'event' | 'ramadan'; eventDate?: string;
  title_de: string; title_ar?: string; text_de: string; text_ar?: string; image?: string;
  pinned: boolean; published: boolean; publishFrom?: string; publishUntil?: string;
};
export type Lesson = {
  weekday: number; after: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha' | 'time'; time?: string;
  title_de: string; title_ar: string; desc_de?: string; desc_ar?: string;
  language: 'de' | 'ar' | 'de-ar'; audience: 'all' | 'men' | 'women' | 'kids' | 'youth'; teacher?: string; active: boolean;
};
export type Video = {
  youtubeId: string; date: Date; title_de: string; title_ar?: string;
  series: 'khutbah' | 'sirah' | 'aqidah' | 'tazkiyah' | 'quran' | 'campaign' | 'other';
  language: 'de' | 'ar' | 'de-ar'; speaker?: string; featured: boolean;
};
type CollectionMap = { announcements: Announcement; program: Lesson; videos: Video };
export type CollectionKey = keyof CollectionMap;
export type Entry<K extends CollectionKey> = { id: string; data: CollectionMap[K]; updatedAt: string };

// --- Change tracking (used to invalidate the page cache) ---------------------
let version = 1;
export const contentVersion = () => version;
export const bumpVersion = () => ++version;

// --- Settings -----------------------------------------------------------------
export function getSetting<K extends SettingKey>(key: K): SettingsMap[K] {
  const row = getDb().prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined;
  return (row ? JSON.parse(row.value) : {}) as SettingsMap[K];
}

export function saveSetting<K extends SettingKey>(key: K, value: SettingsMap[K], userId?: number) {
  getDb()
    .prepare(`INSERT INTO settings (key, value, updated_at, updated_by) VALUES (?, ?, datetime('now'), ?)
              ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at, updated_by = excluded.updated_by`)
    .run(key, JSON.stringify(value), userId ?? null);
  bumpVersion();
}

export const getSite = () => getSetting('site');
export const getPrayerSettings = () => getSetting('prayer');
export const getNotice = () => getSetting('notice');

/** Online donations recorded from Stripe for a fund (see /api/stripe-webhook). */
export function onlineDonations(fund = 'kauf') {
  const row = getDb()
    .prepare("SELECT COALESCE(SUM(amount_cents), 0) AS cents, COUNT(*) AS n FROM donations WHERE fund = ? AND currency = 'eur'")
    .get(fund) as { cents: number; n: number };
  return { amount: Math.round(row.cents / 100), count: row.n };
}

/** Campaign figures as shown on the site: manual (bank + cash) plus Stripe online donations. */
export function getCampaign(): Campaign & { manualRaised: number; onlineRaised: number } {
  const c = getSetting('campaign');
  const auto = getSetting('payments').autoOnlineTotal !== false;
  const online = auto ? onlineDonations('kauf') : { amount: 0, count: 0 };
  return { ...c, manualRaised: c.raised, onlineRaised: online.amount, raised: c.raised + online.amount, donors: c.donors + online.count };
}

// --- Themes -------------------------------------------------------------------
export const THEMES: { id: ThemeId; de: string; ar: string; swatch: [string, string, string] }[] = [
  { id: 'wine', de: 'Weinrot (Flyer)', ar: 'خمري (الملصق)', swatch: ['#4a1520', '#8e2c3f', '#d9c39d'] },
  { id: 'green', de: 'Grün (Logo)', ar: 'أخضر (الشعار)', swatch: ['#15391c', '#2f7d3e', '#69b86b'] },
  { id: 'navy', de: 'Nachtblau & Gold', ar: 'أزرق ليلي وذهبي', swatch: ['#0f1b33', '#24365e', '#c9a45c'] },
  { id: 'ramadan', de: 'Ramadan', ar: 'رمضان', swatch: ['#101a2e', '#3b2f63', '#e1b84f'] },
];

/** True during Ramadan and the first three days of Shawwal (Eid al-Fitr), Umm al-Qura calendar. */
export function isRamadanSeason(now = new Date()) {
  try {
    const parts = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { month: 'numeric', day: 'numeric', timeZone: 'Europe/Berlin' }).formatToParts(now);
    const month = Number(parts.find((p) => p.type === 'month')?.value);
    const day = Number(parts.find((p) => p.type === 'day')?.value);
    return month === 9 || (month === 10 && day <= 3);
  } catch {
    return false;
  }
}

export function getActiveTheme(now = new Date()): ThemeId {
  const t = getSetting('theme');
  if (import.meta.env.PUBLIC_THEME) return import.meta.env.PUBLIC_THEME as ThemeId; // static test builds
  if (t.autoRamadan && isRamadanSeason(now)) return t.ramadanTheme || 'ramadan';
  return t.active || 'wine';
}

// --- Collections ----------------------------------------------------------------
const DATE_FIELDS: Partial<Record<CollectionKey, string[]>> = { announcements: ['date'], videos: ['date'] };

function hydrate<K extends CollectionKey>(collection: K, row: { id: string; data: string; updated_at: string }): Entry<K> {
  const data = JSON.parse(row.data);
  for (const f of DATE_FIELDS[collection] ?? []) if (data[f]) data[f] = new Date(data[f]);
  const defaults: Record<CollectionKey, Record<string, unknown>> = {
    announcements: { category: 'news', pinned: false, published: true },
    program: { audience: 'all', active: true },
    videos: { series: 'other', featured: false },
  };
  return { id: row.id, data: { ...defaults[collection], ...data }, updatedAt: row.updated_at };
}

export function getEntries<K extends CollectionKey>(collection: K): Entry<K>[] {
  const rows = getDb().prepare('SELECT id, data, updated_at FROM entries WHERE collection = ?').all(collection) as { id: string; data: string; updated_at: string }[];
  return rows.map((r) => hydrate(collection, r));
}

export function getEntry<K extends CollectionKey>(collection: K, id: string): Entry<K> | undefined {
  const row = getDb().prepare('SELECT id, data, updated_at FROM entries WHERE collection = ? AND id = ?').get(collection, id) as
    | { id: string; data: string; updated_at: string }
    | undefined;
  return row ? hydrate(collection, row) : undefined;
}

export function saveEntry<K extends CollectionKey>(collection: K, id: string, data: CollectionMap[K] | Record<string, unknown>, userId?: number) {
  const serial = JSON.stringify(data);
  getDb()
    .prepare(`INSERT INTO entries (collection, id, data, updated_by) VALUES (?, ?, ?, ?)
              ON CONFLICT(collection, id) DO UPDATE SET data = excluded.data, updated_at = datetime('now'), updated_by = excluded.updated_by`)
    .run(collection, id, serial, userId ?? null);
  bumpVersion();
}

export function deleteEntry(collection: CollectionKey, id: string) {
  getDb().prepare('DELETE FROM entries WHERE collection = ? AND id = ?').run(collection, id);
  bumpVersion();
}

export function newId(prefix: string) {
  const d = new Date().toISOString().slice(0, 10);
  return `${d}-${prefix}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Status of an announcement at a given moment. */
export function announcementStatus(a: Announcement, now = new Date()): 'draft' | 'scheduled' | 'live' | 'expired' {
  if (!a.published) return 'draft';
  if (a.publishFrom && new Date(a.publishFrom) > now) return 'scheduled';
  if (a.publishUntil && new Date(a.publishUntil) <= now) return 'expired';
  return 'live';
}

/** Announcements visible on the public site: live ones, pinned first, newest first. */
export function getPublicAnnouncements(now = new Date()) {
  return getEntries('announcements')
    .filter((e) => announcementStatus(e.data, now) === 'live')
    .sort((a, b) => Number(b.data.pinned) - Number(a.data.pinned) || b.data.date.getTime() - a.data.date.getTime());
}

export const getProgram = () => getEntries('program').filter((e) => e.data.active);
export const getVideos = () =>
  getEntries('videos').sort((a, b) => Number(b.data.featured) - Number(a.data.featured) || b.data.date.getTime() - a.data.date.getTime());

/** Active site-wide notice bar, if any. */
export function getActiveNotice(now = new Date()) {
  const n = getNotice();
  if (!n.active || !n.text_de) return null;
  if (n.until && new Date(n.until + 'T23:59:59') < now) return null;
  return n;
}

// --- Prayer tables ----------------------------------------------------------------
export function getUploadedPrayerTables(): Map<number, Record<string, Record<string, string>>> {
  const rows = getDb().prepare('SELECT year, data FROM prayer_tables').all() as { year: number; data: string }[];
  return new Map(rows.map((r) => [r.year, JSON.parse(r.data)]));
}

export function deletePrayerTable(year: number) {
  getDb().prepare('DELETE FROM prayer_tables WHERE year = ?').run(year);
  bumpVersion();
}

export function savePrayerTable(year: number, data: Record<string, Record<string, string>>) {
  getDb()
    .prepare(`INSERT INTO prayer_tables (year, data) VALUES (?, ?) ON CONFLICT(year) DO UPDATE SET data = excluded.data, updated_at = datetime('now')`)
    .run(year, JSON.stringify(data));
  bumpVersion();
}

export { tx };
