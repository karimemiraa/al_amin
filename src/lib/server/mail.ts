/**
 * E-mail delivery (contact form, owner alerts, invites). SMTP settings come from the admin
 * ("Zahlungen & E-Mail"), falling back to the SMTP_* environment variables.
 */
import nodemailer from 'nodemailer';
import { getSetting } from '../content';
import { getSecret } from './secrets';

export function mailConfig() {
  const m = getSetting('mail');
  return {
    host: m.host || process.env.SMTP_HOST || '',
    port: Number(m.port || process.env.SMTP_PORT || 587),
    user: m.user || process.env.SMTP_USER || '',
    pass: getSecret('smtp_pass') || '',
    from: m.from || process.env.CONTACT_FROM || '',
    to: m.to || process.env.CONTACT_TO || '',
  };
}

export const mailConfigured = () => {
  const c = mailConfig();
  return Boolean(c.host && c.from);
};

export async function sendMail(opts: { to: string | string[]; subject: string; text: string; replyTo?: string }) {
  const c = mailConfig();
  if (!c.host || !c.from) throw new Error('SMTP not configured');
  const transport = nodemailer.createTransport({
    host: c.host,
    port: c.port,
    secure: c.port === 465,
    requireTLS: c.port !== 465 && !!c.user, // never send the password over an unencrypted connection
    auth: c.user ? { user: c.user, pass: c.pass } : undefined,
  });
  await transport.sendMail({ from: c.from, to: opts.to, subject: opts.subject, text: opts.text, replyTo: opts.replyTo });
}

/** Best-effort alert to all owners about a security-relevant change. Never throws. */
export async function alertOwners(owners: string[], subject: string, text: string) {
  if (!owners.length || !mailConfigured()) return false;
  try {
    await sendMail({ to: owners, subject: `[Sicherheit] ${subject}`, text });
    return true;
  } catch (err) {
    console.error('[mail] owner alert failed', err);
    return false;
  }
}
