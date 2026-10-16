import type { APIRoute } from 'astro';
import { mailConfig, sendMail } from '../../lib/server/mail';

export const prerender = false;

/** Subject options of the contact form (value → German label used in the e-mail). */
const SUBJECTS = {
  allgemein: 'Allgemeine Anfrage',
  spende: 'Spende & Zuwendungsbestätigung',
  fuehrung: 'Moscheeführung',
  presse: 'Presse',
  sonstiges: 'Sonstiges',
} as const;
type Subject = keyof typeof SUBJECTS;

/** Submissions faster than this after page load are treated as bots. */
const MIN_FILL_MS = 3000;
const EMAIL_RE = /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[^\s@<>()",;:]{2,}$/;

/** Single-line text: strip control characters and line breaks (no header injection). */
const oneLine = (v: FormDataEntryValue | null, max: number) =>
  String(v ?? '').replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);

/**
 * Receives the contact form (form-encoded POST, works without JavaScript), sends it by e-mail
 * and redirects back to /kontakt (or /ar/kontakt) with ?gesendet=1 or ?fehler=…
 */
export const POST: APIRoute = async ({ request, redirect }) => {
  let lang: 'de' | 'ar' = 'de';
  // Relative Location header: works behind any reverse proxy without trusting the Host header.
  const back = (query: string) => redirect(`${lang === 'ar' ? '/ar' : ''}/kontakt?${query}#formular`, 303);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return back('fehler=1');
  }
  lang = form.get('lang') === 'ar' ? 'ar' : 'de';

  // Spam protection: honeypot filled or form submitted implausibly fast → pretend success.
  if (String(form.get('website') ?? '').trim() !== '') return back('gesendet=1');
  const ts = Number(form.get('ts'));
  if (Number.isFinite(ts) && ts > 0 && Date.now() - ts < MIN_FILL_MS) return back('gesendet=1');

  const name = oneLine(form.get('name'), 120);
  const email = oneLine(form.get('email'), 200);
  const subjectKey = (String(form.get('betreff') ?? '') in SUBJECTS ? String(form.get('betreff')) : 'allgemein') as Subject;
  const message = String(form.get('nachricht') ?? '').replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '').trim().slice(0, 5000);
  const privacy = form.get('datenschutz') === '1';

  if (!name || !EMAIL_RE.test(email) || message.length < 2 || !privacy) return back('fehler=eingabe');

  // SMTP settings from the admin ("Zahlungen & E-Mail"), falling back to SMTP_* / CONTACT_* env vars.
  const { host, to, from } = mailConfig();
  if (!host || !to || !from) {
    console.error('[contact] SMTP is not configured (host, sender and recipient are required)');
    return back('fehler=1');
  }

  const subjectLabel = SUBJECTS[subjectKey];
  const sentAt = new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Berlin' }).format(new Date());

  try {
    await sendMail({
      to,
      // Quoted display name (quotes/backslashes removed) so commas in names cannot add recipients.
      replyTo: `"${name.replace(/["\\]/g, '')}" <${email}>`,
      subject: `[Kontaktformular] ${subjectLabel}: ${name}`,
      text: [
        `Neue Nachricht über das Kontaktformular der Website (${lang === 'ar' ? 'arabische' : 'deutsche'} Seite).`,
        '',
        `Name:    ${name}`,
        `E-Mail:  ${email}`,
        `Betreff: ${subjectLabel}`,
        `Gesendet: ${sentAt}`,
        '',
        '--- Nachricht ---',
        message,
        '',
        '--',
        'Antworten Sie direkt auf diese E-Mail, um der absendenden Person zu antworten.',
      ].join('\n'),
    });
    return back('gesendet=1');
  } catch (err) {
    console.error('[contact] sending failed:', err instanceof Error ? err.message : err);
    return back('fehler=1');
  }
};

/** A GET on the endpoint (e.g. a reload after redirect) just goes back to the form. */
export const GET: APIRoute = ({ redirect }) => redirect('/kontakt', 303);
