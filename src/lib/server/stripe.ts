/**
 * Stripe helpers: client from the stored secret key, connection test, recording online donations
 * (webhook + manual sync). Only amounts, currency, fund and frequency are stored – no personal data.
 */
import Stripe from 'stripe';
import { getDb } from './db';
import { getSecret } from './secrets';
import { bumpVersion } from '../content';

export const FUNDS = ['kauf', 'allgemein', 'zakat'] as const;
export type Fund = (typeof FUNDS)[number];
const toFund = (v: unknown): Fund => (FUNDS.includes(v as Fund) ? (v as Fund) : 'allgemein');

/** Stripe client with the key from the admin (or STRIPE_SECRET_KEY), or null if none is set. */
export function stripeClient(key = getSecret('stripe_secret_key')) {
  return key ? new Stripe(key) : null;
}

/** 'live' | 'test' from a key prefix (sk_live_…, rk_test_…), or null if unknown. */
export function keyMode(key: string | null | undefined): 'live' | 'test' | null {
  const m = key?.match(/^(?:sk|rk)_(live|test)_/);
  return m ? (m[1] as 'live' | 'test') : null;
}

export type Donation = { id: string; amountCents: number; currency: string; fund: string; frequency: string; createdAt: string };

/** Stores a donation once (idempotent by Stripe object id). Returns true if it was new. */
export function recordDonation(d: Donation): boolean {
  if (!d.id || !Number.isFinite(d.amountCents) || d.amountCents <= 0) return false;
  const res = getDb()
    .prepare('INSERT OR IGNORE INTO donations (id, amount_cents, currency, fund, frequency, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .run(d.id, Math.round(d.amountCents), d.currency.toLowerCase(), toFund(d.fund), d.frequency === 'monthly' ? 'monthly' : 'once', d.createdAt);
  const added = Number(res.changes) > 0;
  if (added) bumpVersion();
  return added;
}

const iso = (unix: number) => new Date(unix * 1000).toISOString();

/** Donation from a paid Checkout Session created by the website's donation form. */
export function donationFromSession(s: Stripe.Checkout.Session): Donation | null {
  if (s.payment_status !== 'paid' || s.metadata?.source !== 'website' || !s.amount_total) return null;
  return {
    id: s.id,
    amountCents: s.amount_total,
    currency: s.currency ?? 'eur',
    fund: s.metadata.fund ?? '',
    frequency: s.metadata.frequency === 'monthly' ? 'monthly' : 'once',
    createdAt: iso(s.created),
  };
}

/**
 * Donation from a paid subscription renewal invoice. The first invoice of a subscription is skipped,
 * because the Checkout Session already counted it.
 */
export async function donationFromInvoice(inv: Stripe.Invoice, stripe: Stripe | null = null): Promise<Donation | null> {
  if (inv.billing_reason === 'subscription_create' || !inv.amount_paid || !inv.id) return null;
  const sub = inv.parent?.subscription_details;
  if (!sub) return null;
  let meta: Record<string, string> = sub.metadata ?? {};
  if (!meta.source && stripe) {
    // Older invoices may not carry the metadata snapshot – read it from the subscription.
    try {
      const s = typeof sub.subscription === 'string' ? await stripe.subscriptions.retrieve(sub.subscription) : sub.subscription;
      meta = s.metadata ?? {};
    } catch { /* keep empty */ }
  }
  if (meta.source !== 'website') return null;
  return { id: inv.id, amountCents: inv.amount_paid, currency: inv.currency ?? 'eur', fund: meta.fund ?? '', frequency: 'monthly', createdAt: iso(inv.created) };
}

/** Totals of the recorded online donations per fund (all time). */
export function donationTotals() {
  return getDb()
    .prepare("SELECT fund, COUNT(*) AS n, COALESCE(SUM(amount_cents), 0) AS cents FROM donations WHERE currency = 'eur' GROUP BY fund ORDER BY cents DESC")
    .all() as { fund: string; n: number; cents: number }[];
}

export type SyncResult = { checked: number; added: number; byFund: Record<string, { n: number; cents: number }> };

/**
 * Re-reads paid donations of the last `days` days from Stripe (Checkout Sessions created by the
 * website plus subscription renewals) and adds the missing ones. Safe to run any time.
 */
export async function syncDonations(days = 90): Promise<SyncResult> {
  const stripe = stripeClient();
  if (!stripe) throw new Error('Stripe secret key is not configured');
  const since = Math.floor(Date.now() / 1000) - days * 86_400;
  const result: SyncResult = { checked: 0, added: 0, byFund: {} };
  const take = (d: Donation | null) => {
    if (!d) return;
    result.checked++;
    if (recordDonation(d)) {
      result.added++;
      const f = (result.byFund[toFund(d.fund)] ??= { n: 0, cents: 0 });
      f.n++;
      f.cents += d.amountCents;
    }
  };
  for await (const s of stripe.checkout.sessions.list({ created: { gte: since }, status: 'complete', limit: 100 })) take(donationFromSession(s));
  for await (const inv of stripe.invoices.list({ created: { gte: since }, status: 'paid', limit: 100 })) take(await donationFromInvoice(inv, stripe));
  return result;
}

/** Calls the Stripe API with a key and reports whether it works. */
export async function testStripeKey(key: string): Promise<{ ok: true; livemode: boolean } | { ok: false; error: string }> {
  try {
    const balance = await new Stripe(key, { maxNetworkRetries: 0, timeout: 15_000 }).balance.retrieve();
    return { ok: true, livemode: balance.livemode };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // Never echo a key back (Stripe's error text contains a masked one; strip anything key-like anyway).
    return { ok: false, error: msg.replace(/\b(sk|rk|pk)_(live|test)_[A-Za-z0-9*]+/g, '$1_$2_…').slice(0, 180) };
  }
}
