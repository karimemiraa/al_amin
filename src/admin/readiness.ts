/**
 * Go-live checklist shown on the dashboard. Each item checks itself against the real data,
 * so it ticks off automatically once the information is entered.
 */
import { getSetting, getSite, getPublicAnnouncements } from '../lib/content';
import { getPublishedYears } from '../lib/prayer';
import { getSecret } from '../lib/server/secrets';
import { mailConfigured } from '../lib/server/mail';
import { listUsers } from '../lib/server/auth';

export type CheckItem = { key: string; done: boolean; required: boolean; href: string };

export function readiness(now = new Date()): CheckItem[] {
  const site = getSite();
  const campaign = getSetting('campaign');
  const payments = getSetting('payments');
  const security = getSetting('security');
  const owners = listUsers().filter((u) => u.role === 'owner' && u.active);
  const stripe = getSecret('stripe_secret_key');
  const daysSinceUpdate = (now.getTime() - new Date(campaign.asOf + 'T12:00:00').getTime()) / 86_400_000;
  const nextYear = now.getFullYear() + 1;

  return [
    { key: 'check.stripe', done: Boolean(stripe), required: true, href: '/admin/zahlungen' },
    { key: 'check.register', done: Boolean(site.registerNumber), required: true, href: '/admin/verein#rechtliches' },
    { key: 'check.tax', done: Boolean(site.taxOffice && site.taxNumber && site.exemptionNoticeDate), required: true, href: '/admin/verein#rechtliches' },
    { key: 'check.owner2fa', done: owners.length > 0 && owners.every((u) => u.totpEnabled), required: true, href: '/admin/benutzer' },
    { key: 'check.mail', done: mailConfigured(), required: false, href: '/admin/zahlungen#email' },
    { key: 'check.stripeLive', done: Boolean(stripe?.startsWith('sk_live_') || stripe?.startsWith('rk_live_')) && payments.stripeMode === 'live', required: false, href: '/admin/zahlungen' },
    { key: 'check.board', done: (site.representatives ?? []).filter(Boolean).length >= 2, required: false, href: '/admin/verein#rechtliches' },
    { key: 'check.raised', done: daysSinceUpdate <= 7, required: false, href: '/admin#spendenstand' },
    { key: 'check.announcement', done: getPublicAnnouncements(now).length > 0, required: false, href: '/admin/ankuendigungen/neu' },
    { key: 'check.youtube', done: Boolean(site.social?.youtubeChannelId), required: false, href: '/admin/verein#social' },
    { key: 'check.prayerNext', done: getPublishedYears().includes(nextYear), required: false, href: '/admin/gebetszeiten' },
    { key: 'check.all2fa', done: security.require2faForAll === true, required: false, href: '/admin/benutzer#sicherheit' },
  ];
}
