import type { APIRoute } from 'astro';
import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';
import { getSecret } from '../../../lib/server/secrets';
import { can } from '../../../lib/server/auth';
import { rateLimited } from '../../../lib/server/ratelimit';

export const prerender = false;

const Translation = z.object({ title: z.string(), text: z.string() });

const SYSTEM = `You translate announcements of the Mohammad Al-Amien mosque in Hannover (Germany) from German into Modern Standard Arabic for the mosque's Arabic-speaking community.
- Natural, warm, dignified Arabic as used by mosques; not a word-for-word rendering.
- Keep Islamic terms in their established Arabic form (e.g. صلاة الجمعة، التراويح، صدقة جارية) and the ﷺ after the Prophet's name.
- Keep Markdown formatting (**bold**, links, paragraphs), numbers, times, dates, amounts and proper names (street names, "Mohammad Al-Amien Moschee") intact.
- Translate only; do not add or omit information.`;

/** Suggests an Arabic translation for an announcement (admin only, needs an Anthropic API key). */
export const POST: APIRoute = async ({ request, locals }) => {
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
  if (!locals.user || !can(locals.user, 'content')) return json({ error: 'forbidden' }, 403);
  const apiKey = getSecret('anthropic_api_key');
  if (!apiKey) return json({ error: 'not_configured' }, 400);
  // Each call costs money: max. 60 translations per hour per person.
  if (rateLimited('translate', String(locals.user.id), 60, 60 * 60_000)) return json({ error: 'rate' }, 429);

  const body = (await request.json().catch(() => ({}))) as { title?: unknown; text?: unknown };
  const title = String(body.title ?? '').slice(0, 300);
  const text = String(body.text ?? '').slice(0, 6000);
  if (!title && !text) return json({ error: 'empty' }, 400);

  const client = new Anthropic({ apiKey });
  try {
    const response = await client.beta.messages.parse({
      model: 'claude-opus-5-5',
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'low', format: betaZodOutputFormat(Translation) },
      system: SYSTEM,
      messages: [{ role: 'user', content: `Titel:\n${title}\n\nText:\n${text}` }],
    });
    if (response.stop_reason === 'refusal' || !response.parsed_output) return json({ error: 'refused' }, 422);
    return json(response.parsed_output);
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) return json({ error: 'invalid_key' }, 400);
    if (err instanceof Anthropic.RateLimitError) return json({ error: 'rate_limited' }, 429);
    console.error('[translate]', err instanceof Anthropic.APIError ? `${err.status} ${err.message}` : err);
    return json({ error: 'failed' }, 502);
  }
};
