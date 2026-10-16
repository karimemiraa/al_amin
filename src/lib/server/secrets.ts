/**
 * Encrypted credentials (Stripe keys, SMTP password). Values set in the admin take precedence
 * over environment variables, so the server's .env works as a fallback / first-start default.
 */
import { getDb } from './db';
import { encrypt, decrypt } from './crypto';

export type SecretKey = 'stripe_secret_key' | 'stripe_webhook_secret' | 'smtp_pass' | 'anthropic_api_key';

const ENV_FALLBACK: Record<SecretKey, string> = {
  stripe_secret_key: 'STRIPE_SECRET_KEY',
  stripe_webhook_secret: 'STRIPE_WEBHOOK_SECRET',
  smtp_pass: 'SMTP_PASS',
  anthropic_api_key: 'ANTHROPIC_API_KEY',
};

export function getSecret(key: SecretKey): string | null {
  const row = getDb().prepare('SELECT value FROM secrets WHERE key = ?').get(key) as { value: string } | undefined;
  if (row) return decrypt(row.value);
  return process.env[ENV_FALLBACK[key]] || null;
}

export function setSecret(key: SecretKey, value: string) {
  getDb()
    .prepare(`INSERT INTO secrets (key, value, updated_at) VALUES (?, ?, datetime('now'))
              ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`)
    .run(key, encrypt(value));
}

export function clearSecret(key: SecretKey) {
  getDb().prepare('DELETE FROM secrets WHERE key = ?').run(key);
}

/** Where a secret comes from, for display ("im Admin gespeichert" / ".env" / none). */
export function secretSource(key: SecretKey): 'admin' | 'env' | null {
  const row = getDb().prepare('SELECT 1 FROM secrets WHERE key = ?').get(key);
  if (row) return 'admin';
  return process.env[ENV_FALLBACK[key]] ? 'env' : null;
}

/** Masked display: "sk_live_…a1B2" for API keys; passwords and unknown formats are fully hidden. */
export function maskSecret(value: string | null) {
  if (!value) return '';
  const prefix = value.match(/^(sk-ant-[a-z0-9]+-|(sk|rk|pk|whsec)_(live|test)?_?)/)?.[0];
  return prefix ? `${prefix}…${value.slice(-4)}` : '••••••••';
}
