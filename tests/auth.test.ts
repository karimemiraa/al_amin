import { beforeAll, describe, expect, it } from 'vitest';
import {
  createUser, attemptLogin, createSession, getSession, destroySession, enableTotp, verifySecondFactor, createToken,
  consumeToken, peekToken, can, getUser, passwordProblem, twoFactorRequired, updateUser,
} from '../src/lib/server/auth';
import { totpCode, newTotpSecret, currentStep } from '../src/lib/server/crypto';
import { saveSetting, getSetting } from '../src/lib/content';

let ownerId: number;
let editorId: number;

beforeAll(() => {
  ownerId = createUser({ email: 'owner@test.de', name: 'Owner', role: 'owner', password: 'Langes Passwort 123' });
  editorId = createUser({ email: 'editor@test.de', name: 'Editor', role: 'editor', password: 'Anderes Passwort 456' });
});

describe('login', () => {
  it('accepts correct credentials (case-insensitive e-mail)', () => {
    const r = attemptLogin('OWNER@test.de', 'Langes Passwort 123', '10.0.0.1');
    expect(r.ok).toBe(true);
  });
  it('locks the account after 5 wrong passwords', () => {
    for (let i = 0; i < 5; i++) attemptLogin('editor@test.de', 'falsch', '10.0.0.2');
    const r = attemptLogin('editor@test.de', 'Anderes Passwort 456', '10.0.0.2');
    expect(r).toEqual({ ok: false, reason: 'locked' });
  });
  it('rate-limits an IP after many failures', () => {
    for (let i = 0; i < 20; i++) attemptLogin(`nobody${i}@test.de`, 'x', '10.0.0.3');
    expect(attemptLogin('owner@test.de', 'Langes Passwort 123', '10.0.0.3')).toEqual({ ok: false, reason: 'rate' });
  });
  it('rejects deactivated users', () => {
    const id = createUser({ email: 'gone@test.de', name: 'Gone', role: 'editor', password: 'Irgendein Passwort 1' });
    updateUser(id, { active: false });
    expect(attemptLogin('gone@test.de', 'Irgendein Passwort 1', '10.0.0.4')).toEqual({ ok: false, reason: 'inactive' });
  });
});

describe('sessions', () => {
  it('creates, resolves and destroys sessions; tokens are stored hashed', () => {
    const token = createSession(ownerId, true, '1.2.3.4', 'test');
    const s = getSession(token);
    expect(s?.user.id).toBe(ownerId);
    expect(s?.session.id).not.toBe(token);
    destroySession(token);
    expect(getSession(token)).toBeNull();
  });
});

describe('2FA', () => {
  it('verifies TOTP once (no replay) and consumes recovery codes', () => {
    const secret = newTotpSecret();
    const step = currentStep() - 1;
    const codes = enableTotp(ownerId, secret, step);
    const code = totpCode(secret, currentStep());
    expect(verifySecondFactor(ownerId, code)).toBe('totp');
    expect(verifySecondFactor(ownerId, code)).toBeNull(); // replay
    expect(verifySecondFactor(ownerId, codes[0])).toBe('recovery');
    expect(verifySecondFactor(ownerId, codes[0])).toBeNull(); // used up
  });
  it('is required for owners always and for editors when the policy is on', () => {
    expect(twoFactorRequired(getUser(ownerId)!)).toBe(true);
    expect(twoFactorRequired(getUser(editorId)!)).toBe(false);
    saveSetting('security', { ...getSetting('security'), require2faForAll: true });
    expect(twoFactorRequired(getUser(editorId)!)).toBe(true);
    saveSetting('security', { ...getSetting('security'), require2faForAll: false });
  });
});

describe('tokens and permissions', () => {
  it('invite tokens are single-use and expire', () => {
    const raw = createToken(editorId, 'invite', 60_000);
    expect(peekToken(raw, 'reset')).toBeNull();
    expect(consumeToken(raw, 'invite')).toBe(editorId);
    expect(consumeToken(raw, 'invite')).toBeNull();
    const expired = createToken(editorId, 'reset', -1);
    expect(peekToken(expired, 'reset')).toBeNull();
  });
  it('editors cannot reach owner areas', () => {
    const editor = getUser(editorId)!;
    expect(can(editor, 'content')).toBe(true);
    expect(can(editor, 'campaign')).toBe(true);
    for (const area of ['payments', 'users', 'design', 'org', 'backup'] as const) expect(can(editor, area)).toBe(false);
  });
  it('rejects weak passwords', () => {
    expect(passwordProblem('kurz')).toBe('pw.short');
    expect(passwordProblem('karim-2026-langes', 'karim@x.de')).toBe('pw.email');
    expect(passwordProblem('aaaaaaaaaaaa')).toBe('pw.common');
    expect(passwordProblem('Ein langer sicherer Satz')).toBeNull();
  });
});
