import { describe, expect, it } from 'vitest';
import {
  hashPassword, verifyPassword, encrypt, decrypt, totpCode, verifyTotp, base32Encode, base32Decode, newRecoveryCodes, normalizeRecovery,
} from '../src/lib/server/crypto';

describe('passwords', () => {
  it('hashes with a random salt and verifies', () => {
    const a = hashPassword('Sichere Moschee 2026!');
    const b = hashPassword('Sichere Moschee 2026!');
    expect(a).not.toBe(b);
    expect(a.startsWith('scrypt$')).toBe(true);
    expect(verifyPassword('Sichere Moschee 2026!', a)).toBe(true);
    expect(verifyPassword('sichere moschee 2026!', a)).toBe(false);
  });
  it('rejects missing or malformed hashes', () => {
    expect(verifyPassword('x', null)).toBe(false);
    expect(verifyPassword('x', 'plain')).toBe(false);
  });
});

describe('secrets at rest', () => {
  it('round-trips and detects tampering', () => {
    const c = encrypt('sk_live_abc123');
    expect(c).not.toContain('sk_live');
    expect(decrypt(c)).toBe('sk_live_abc123');
    const parts = c.split('.');
    parts[3] = Buffer.from('tampered').toString('base64');
    expect(decrypt(parts.join('.'))).toBeNull();
  });
});

describe('TOTP (RFC 6238 test vectors, SHA-1)', () => {
  // RFC 6238 secret "12345678901234567890" -> 8-digit vectors; we use the last 6 digits.
  const secret = base32Encode(Buffer.from('12345678901234567890'));
  const vectors: [number, string][] = [
    [59, '287082'], [1111111109, '081804'], [1111111111, '050471'], [1234567890, '005924'], [2000000000, '279037'],
  ];
  it.each(vectors)('time %i -> %s', (t, code) => {
    expect(totpCode(secret, Math.floor(t / 30))).toBe(code);
  });
  it('base32 round-trips', () => {
    expect(base32Decode(secret).toString()).toBe('12345678901234567890');
  });
  it('accepts ±1 step drift and rejects others', () => {
    const now = 1_700_000_000_000;
    const step = Math.floor(now / 30_000);
    expect(verifyTotp(secret, totpCode(secret, step - 1), now)).toBe(step - 1);
    expect(verifyTotp(secret, totpCode(secret, step + 1), now)).toBe(step + 1);
    expect(verifyTotp(secret, totpCode(secret, step - 3), now)).toBeNull();
    expect(verifyTotp(secret, 'abcdef', now)).toBeNull();
  });
});

describe('recovery codes', () => {
  it('creates 10 distinct, normalizable codes', () => {
    const codes = newRecoveryCodes();
    expect(new Set(codes).size).toBe(10);
    expect(normalizeRecovery(codes[0].toLowerCase())).toBe(codes[0].replace('-', ''));
  });
});
