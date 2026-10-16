import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { getSecret } from '../../lib/server/secrets';
import { recordDonation, donationFromSession, donationFromInvoice, stripeClient } from '../../lib/server/stripe';

export const prerender = false;

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

/**
 * Stripe webhook (configure in the Stripe dashboard with the events checkout.session.completed
 * and invoice.paid). Records online donations so the campaign total updates by itself.
 * Stores only amount, currency, fund and frequency – never names, e-mails or addresses.
 */
export const POST: APIRoute = async ({ request }) => {
  const secret = getSecret('stripe_webhook_secret');
  if (!secret) {
    console.error('[stripe-webhook] webhook signing secret is not configured');
    return json({ error: 'not configured' }, 503);
  }
  const signature = request.headers.get('stripe-signature');
  const body = await request.text();
  if (!signature || body.length > 512_000) return json({ error: 'bad request' }, 400);

  let event: Stripe.Event;
  try {
    event = Stripe.webhooks.constructEvent(body, signature, secret);
  } catch {
    return json({ error: 'invalid signature' }, 400);
  }

  try {
    if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
      const d = donationFromSession(event.data.object);
      if (d) recordDonation(d);
    } else if (event.type === 'invoice.paid') {
      const d = await donationFromInvoice(event.data.object, stripeClient());
      if (d) recordDonation(d);
    }
  } catch (err) {
    // Acknowledge anyway: the admin can re-sync from Stripe ("Online-Spenden jetzt abgleichen").
    console.error('[stripe-webhook]', err instanceof Error ? err.message : err);
  }
  return json({ received: true });
};
