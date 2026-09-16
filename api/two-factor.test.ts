import { beforeAll, describe, expect, it } from 'vitest';
import { request } from './client';
import type { LoginIdentifyResponse, LoginResponse } from './auth';
import type { TwoFactorActivation, TwoFactorSetup, TwoFactorStatus } from './two-factor';
import { setAuthToken } from '@/lib/auth-session';
import { generateTotpCode } from '@/lib/totp';

const MEMBER_EMAIL = 'lucas.baumgartner@gmail.com';
const MEMBER_PASSWORD = 'dspmp';
const ADMIN_EMAIL = 'admin@datenschutzpartner.ch';

function login(body: Record<string, unknown>) {
  return request<LoginResponse>('/auth/login', { method: 'POST', body: JSON.stringify(body) });
}

/**
 * Walks the contract the backend has to implement: setup issues a secret,
 * activation verifies a real TOTP code and hands out single-use recovery
 * codes, and both are accepted at login.
 */
describe('two-factor contract', () => {
  let secret = '';
  let recoveryCodes: string[] = [];

  beforeAll(async () => {
    const session = await login({ email: MEMBER_EMAIL, password: MEMBER_PASSWORD });
    setAuthToken(session.token ?? '');
  });

  it('issues a secret and an otpauth URI', async () => {
    const setup = await request<TwoFactorSetup>('/account/two-factor/setup', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    secret = setup.secret;
    expect(secret).toMatch(/^[A-Z2-7]{32}$/);
    expect(setup.otpauthUri).toContain(`secret=${secret}`);
    expect(setup.accountName).toBe(MEMBER_EMAIL);
  });

  it('rejects activation with a wrong code', async () => {
    await expect(
      request('/account/two-factor/activate', {
        method: 'POST',
        body: JSON.stringify({ code: '000000' }),
      })
    ).rejects.toMatchObject({ status: 400 });
  });

  it('activates with a real code and returns recovery codes', async () => {
    const result = await request<TwoFactorActivation>('/account/two-factor/activate', {
      method: 'POST',
      body: JSON.stringify({ code: await generateTotpCode(secret) }),
    });

    recoveryCodes = result.recoveryCodes;
    expect(recoveryCodes).toHaveLength(10);
    expect(result.status.enabled).toBe(true);
    expect(result.status.recoveryCodesRemaining).toBe(10);
  });

  it('requires the authenticator code at login', async () => {
    await expect(login({ email: MEMBER_EMAIL, password: MEMBER_PASSWORD })).rejects.toMatchObject({
      status: 401,
    });

    const session = await login({
      email: MEMBER_EMAIL,
      password: MEMBER_PASSWORD,
      twoFactorCode: await generateTotpCode(secret),
    });
    expect(session.token).toBeTruthy();
  });

  it('accepts a recovery code once', async () => {
    const [code] = recoveryCodes;

    const session = await login({
      email: MEMBER_EMAIL,
      password: MEMBER_PASSWORD,
      recoveryCode: code?.toLowerCase(),
    });
    expect(session.token).toBeTruthy();

    await expect(
      login({ email: MEMBER_EMAIL, password: MEMBER_PASSWORD, recoveryCode: code })
    ).rejects.toMatchObject({ status: 401 });

    const status = await request<TwoFactorStatus>('/account/two-factor');
    expect(status.recoveryCodesRemaining).toBe(9);
  });

  it('disables only with the correct password', async () => {
    await expect(
      request('/account/two-factor/disable', {
        method: 'POST',
        body: JSON.stringify({ password: 'wrong' }),
      })
    ).rejects.toMatchObject({ status: 400 });

    const status = await request<TwoFactorStatus>('/account/two-factor/disable', {
      method: 'POST',
      body: JSON.stringify({ password: MEMBER_PASSWORD }),
    });
    expect(status.enabled).toBe(false);
    expect(status.recoveryCodesTotal).toBe(0);
  });
});

describe('admin magic-link login', () => {
  it('identifies with magic_link, rejects password login, and accepts the token', async () => {
    const identified = await request<LoginIdentifyResponse>('/auth/login/identify', {
      method: 'POST',
      body: JSON.stringify({ email: ADMIN_EMAIL }),
    });
    expect(identified.loginMethod).toBe('magic_link');
    expect(identified.prototypeMagicLinkUrl).toContain('token=');

    await expect(login({ email: ADMIN_EMAIL, password: 'anything' })).rejects.toMatchObject({
      status: 401,
    });

    expect(identified.prototypeMagicLinkUrl).toBeTruthy();
    const url = new URL(identified.prototypeMagicLinkUrl ?? '', 'http://localhost');
    const token = url.searchParams.get('token');
    expect(token).toBeTruthy();
    const session = await request<LoginResponse>('/auth/login/magic-link', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
    expect(session.token).toBeTruthy();
    expect(session.email).toBe(ADMIN_EMAIL);
  });

  it('does not reveal unknown e-mails on identify', async () => {
    const identified = await request<LoginIdentifyResponse>('/auth/login/identify', {
      method: 'POST',
      body: JSON.stringify({ email: 'nobody@example.com' }),
    });
    expect(identified.loginMethod).toBe('magic_link');
    expect(identified.prototypeMagicLinkUrl).toBeUndefined();
  });
});
