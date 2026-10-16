import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { getSecret } from '../../lib/server/secrets';

export const prerender = false;

const FUNDS = {
  kauf: { de: 'Spende: Kauf der neuen Moschee', ar: 'تبرع: شراء المسجد الجديد' },
  allgemein: { de: 'Allgemeine Spende: Mohammad Al-Amien Moschee', ar: 'تبرع عام: مسجد محمد الأمين' },
  zakat: { de: 'Zakat (für Bedürftige)', ar: 'الزكاة (للمحتاجين)' },
} as const;
type Fund = keyof typeof FUNDS;

const MIN = 5;
const MAX = 50_000;

function siteUrl(request: Request) {
  return (import.meta.env.PUBLIC_SITE_URL || process.env.PUBLIC_SITE_URL || new URL(request.url).origin).replace(/\/$/, '');
}

/** Accepts the donation form (form-encoded) and redirects to Stripe Checkout. */
export const POST: APIRoute = async ({ request, redirect }) => {
  const base = siteUrl(request);
  let lang: 'de' | 'ar' = 'de';
  const back = (query: string) => redirect(`${base}${lang === 'ar' ? '/ar' : ''}/spenden?${query}#spenden-form`, 303);

  try {
    const form = await request.formData();
    lang = form.get('lang') === 'ar' ? 'ar' : 'de';
    const fund = (String(form.get('fund') ?? 'kauf') in FUNDS ? String(form.get('fund') ?? 'kauf') : 'kauf') as Fund;
    const monthly = form.get('frequency') === 'monthly';
    const custom = Number(form.get('custom'));
    let amount = custom >= 1 ? custom : Number(form.get('amount'));
    if (!Number.isFinite(amount) || amount < MIN || amount > MAX) return back('fehler=betrag');
    if (form.get('coverFees') === '1') amount = amount * 1.015 + 0.25;
    const cents = Math.round(amount * 100);
    const dedication = String(form.get('dedication') ?? '').slice(0, 120).trim();
    const receipt = form.get('receipt') === '1';

    // Key from the admin ("Zahlungen & E-Mail"), falling back to STRIPE_SECRET_KEY in the environment.
    const key = getSecret('stripe_secret_key') || import.meta.env.STRIPE_SECRET_KEY;
    if (!key) {
      console.error('[checkout] Stripe secret key is not configured');
      return back('fehler=konfiguration');
    }
    const stripe = new Stripe(key);
    const name = FUNDS[fund][lang];
    const metadata = { fund, frequency: monthly ? 'monthly' : 'once', dedication, receipt: receipt ? 'ja' : 'nein', lang, source: 'website' };
    const prefix = lang === 'ar' ? '/ar' : '';

    const session = await stripe.checkout.sessions.create({
      mode: monthly ? 'subscription' : 'payment',
      locale: lang === 'de' ? 'de' : 'auto',
      submit_type: monthly ? undefined : 'donate',
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'eur',
            unit_amount: cents,
            product_data: { name, description: dedication ? `Niyyah/Widmung: ${dedication}` : undefined },
            ...(monthly ? { recurring: { interval: 'month' as const } } : {}),
          },
        },
      ],
      billing_address_collection: receipt ? 'required' : 'auto',
      metadata,
      ...(monthly ? { subscription_data: { metadata } } : { payment_intent_data: { metadata, description: name } }),
      ...(monthly ? {} : { customer_creation: 'if_required' as const }),
      success_url: `${base}${prefix}/danke?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}${prefix}/spenden?abgebrochen=1#spenden-form`,
    });
    return redirect(session.url!, 303);
  } catch (err) {
    console.error('[checkout]', err);
    return back('fehler=stripe');
  }
};
