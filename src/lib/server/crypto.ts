/**
 * Cryptographic helpers built on node:crypto only (no third-party code in the auth path).
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { DATA_DIR } from './paths';

// --- Passwords (scrypt) -------------------------------------------------------
const SCRYPT = { N: 1 << 15, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const key = crypto.scryptSync(password.normalize('NFKC'), salt, 32, SCRYPT);
  return `scrypt$${SCRYPT.N}$${SCRYPT.r}$${SCRYPT.p}$${salt.toString('base64')}$${key.toString('base64')}`;
}

export function verifyPassword(password: string, stored: string | null | undefined): boolean {
  // Always do the work, so timing does not reveal whether an account exists.
  const parts = (stored ?? '').split('$');
  const valid = parts.length === 6 && parts[0] === 'scrypt';
  const [N, r, p] = valid ? parts.slice(1, 4).map(Number) : [SCRYPT.N, SCRYPT.r, SCRYPT.p];
  const salt = valid ? Buffer.from(parts[4], 'base64') : Buffer.alloc(16);
  const expected = valid ? Buffer.from(parts[5], 'base64') : Buffer.alloc(32);
  const key = crypto.scryptSync(password.normalize('NFKC'), salt, expected.length, { N, r, p, maxmem: SCRYPT.maxmem });
  return valid && crypto.timingSafeEqual(key, expected);
}

// --- Tokens ---------------------------------------------------------------------
export const randomToken = (bytes = 32) => crypto.randomBytes(bytes).toString('base64url');
export const sha256 = (value: string) => crypto.createHash('sha256').update(value).digest('hex');

export function safeEqual(a: string, b: string) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

// --- Secrets at rest (AES-256-GCM) -----------------------------------------------
let masterKey: Buffer | null = null;

/** Master key from APP_SECRET; falls back to a generated key file in DATA_DIR (development / first start). */
function getMasterKey(): Buffer {
  if (masterKey) return masterKey;
  let secret = process.env.APP_SECRET;
  if (!secret && import.meta.env.PROD && !process.env.STATIC_BUILD) {
    // A generated key would sit in the same volume (and backups) as the data it protects.
    throw new Error('APP_SECRET is not set. Add it to .env (openssl rand -base64 32) and restart.');
  }
  if (!secret) {
    const file = path.join(DATA_DIR, '.app-secret');
    if (!fs.existsSync(file)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      fs.writeFileSync(file, randomToken(32), { mode: 0o600 });
      console.warn('[security] APP_SECRET not set – generated', file, '(set APP_SECRET in .env for production)');
    }
    secret = fs.readFileSync(file, 'utf8').trim();
  }
  masterKey = crypto.createHash('sha256').update(`igh-admin:${secret}`).digest();
  return masterKey;
}

export function encrypt(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getMasterKey(), iv);
  const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return ['v1', iv.toString('base64'), cipher.getAuthTag().toString('base64'), data.toString('base64')].join('.');
}

export function decrypt(payload: string): string | null {
  try {
    const [v, iv, tag, data] = payload.split('.');
    if (v !== 'v1') return null;
    const decipher = crypto.createDecipheriv('aes-256-gcm', getMasterKey(), Buffer.from(iv, 'base64'));
    decipher.setAuthTag(Buffer.from(tag, 'base64'));
    return Buffer.concat([decipher.update(Buffer.from(data, 'base64')), decipher.final()]).toString('utf8');
  } catch {
    return null;
  }
}

// --- TOTP (RFC 6238, SHA-1, 6 digits, 30 s) ----------------------------------------
const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function base32Encode(buf: Buffer) {
  let bits = 0, value = 0, out = '';
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) { out += B32[(value >>> (bits - 5)) & 31]; bits -= 5; }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  return out;
}

export function base32Decode(str: string) {
  const clean = str.replace(/[\s=-]/g, '').toUpperCase();
  let bits = 0, value = 0;
  const out: number[] = [];
  for (const ch of clean) {
    const idx = B32.indexOf(ch);
    if (idx < 0) throw new Error('invalid base32');
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) { out.push((value >>> (bits - 8)) & 255); bits -= 8; }
  }
  return Buffer.from(out);
}

export const newTotpSecret = () => base32Encode(crypto.randomBytes(20));

export function totpCode(secret: string, step: number) {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(step));
  const hmac = crypto.createHmac('sha1', base32Decode(secret)).update(counter).digest();
  const offset = hmac[hmac.length - 1] & 15;
  const bin = ((hmac[offset] & 127) << 24) | (hmac[offset + 1] << 16) | (hmac[offset + 2] << 8) | hmac[offset + 3];
  return String(bin % 1_000_000).padStart(6, '0');
}

export const currentStep = (now = Date.now()) => Math.floor(now / 30_000);

/** Returns the matched time step (±1 step clock drift) or null. */
export function verifyTotp(secret: string, code: string, now = Date.now()): number | null {
  const clean = code.replace(/\s/g, '');
  if (!/^\d{6}$/.test(clean)) return null;
  const step = currentStep(now);
  for (const s of [step, step - 1, step + 1]) if (safeEqual(totpCode(secret, s), clean)) return s;
  return null;
}

export function otpauthUri(secret: string, account: string, issuer = 'Al-Amien Moschee') {
  const label = encodeURIComponent(`${issuer}:${account}`);
  return `otpauth://totp/${label}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}

// --- Recovery codes ------------------------------------------------------------------
export function newRecoveryCodes(n = 10) {
  return Array.from({ length: n }, () => {
    const raw = crypto.randomBytes(5).toString('hex').toUpperCase();
    return `${raw.slice(0, 5)}-${raw.slice(5)}`;
  });
}
export const normalizeRecovery = (code: string) => code.replace(/[\s-]/g, '').toUpperCase();
