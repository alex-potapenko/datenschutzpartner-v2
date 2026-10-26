import { beforeAll, describe, expect, it } from 'vitest';
import { request } from './client';
import type { LoginIdentifyResponse, LoginResponse } from './auth';
import type { TwoFactorActivation, TwoFactorSetup, TwoFactorStatus } from './two-factor';
import { setAuthToken } from '@/lib/auth-session';
import { generateTotpCode } from '@/lib/totp';

const MEMBER_EMAIL = 'lucas.baumgartner@gmail.com';
const MEMBER_PASSWORD = 'mpdsp';
const ADMIN_EMAIL = 'admin@datenschutzpartner.ch';
const ADMIN_PASSWORD = 'dspmp';

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
    const pending = await login({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
    if (pending.token) {
      setAuthToken(pending.token);
      return;
    }

    expect(pending.setupToken).toBeTruthy();
    const setupToken = pending.setupToken as string;
    const initialSetup = await request<TwoFactorSetup>('/account/two-factor/setup', {
      method: 'POST',
      body: JSON.stringify({ setupToken }),
    });
    await request<TwoFactorActivation>('/account/two-factor/activate', {
      method: 'POST',
      body: JSON.stringify({
        setupToken,
        code: await generateTotpCode(initialSetup.secret),
      }),
    });
    const authed = await login({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      twoFactorCode: await generateTotpCode(initialSetup.secret),
    });
    setAuthToken(authed.token ?? '');
  });

  it('issues a secret and an otpauth URI', async () => {
    const setup = await request<TwoFactorSetup>('/account/two-factor/setup', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    secret = setup.secret;
    expect(secret).toMatch(/^[A-Z2-7]{32}$/);
    expect(setup.otpauthUri).toContain(`secret=${secret}`);
    expect(setup.accountName).toBe(ADMIN_EMAIL);
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
    await expect(login({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })).rejects.toMatchObject({
      status: 401,
    });

    const session = await login({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      twoFactorCode: await generateTotpCode(secret),
    });
    expect(session.token).toBeTruthy();
  });

  it('accepts a recovery code once', async () => {
    const [code] = recoveryCodes;

    const session = await login({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      recoveryCode: code?.toLowerCase(),
    });
    expect(session.token).toBeTruthy();

    await expect(
      login({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD, recoveryCode: code })
    ).rejects.toMatchObject({ status: 401 });

    const status = await request<TwoFactorStatus>('/account/two-factor');
    expect(status.recoveryCodesRemaining).toBe(9);
  });

  it('regenerates recovery codes after a valid authenticator code', async () => {
    const result = await request<TwoFactorActivation>('/account/two-factor/recovery-codes', {
      method: 'POST',
      body: JSON.stringify({ code: await generateTotpCode(secret) }),
    });
    expect(result.recoveryCodes).toHaveLength(10);
    expect(result.status.recoveryCodesTotal).toBe(10);
  });

  it('does not allow disabling an active authenticator', async () => {
    await expect(
      request('/account/two-factor/disable', {
        method: 'POST',
        body: JSON.stringify({ password: ADMIN_PASSWORD }),
      })
    ).rejects.toMatchObject({ status: 403 });
  });
});

describe('member login', () => {
  it('defaults to magic link on identify, accepts password login, and exchanges the token', async () => {
    const identified = await request<LoginIdentifyResponse>('/auth/login/identify', {
      method: 'POST',
      body: JSON.stringify({ email: MEMBER_EMAIL }),
    });
    expect(identified.loginMethod).toBe('magic_link');
    expect(identified.prototypeMagicLinkUrl).toContain('token=');

    const passwordSession = await login({ email: MEMBER_EMAIL, password: MEMBER_PASSWORD });
    expect(passwordSession.token).toBeTruthy();
    expect(passwordSession.email).toBe(MEMBER_EMAIL);

    expect(identified.prototypeMagicLinkUrl).toBeTruthy();
    const url = new URL(identified.prototypeMagicLinkUrl ?? '', 'http://localhost');
    const token = url.searchParams.get('token');
    expect(token).toBeTruthy();
    const session = await request<LoginResponse>('/auth/login/magic-link', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
    expect(session.token).toBeTruthy();
    expect(session.email).toBe(MEMBER_EMAIL);
  });

  it('does not reveal unknown e-mails on identify', async () => {
    const identified = await request<LoginIdentifyResponse>('/auth/login/identify', {
      method: 'POST',
      body: JSON.stringify({ email: 'nobody@example.com' }),
    });
    expect(identified.loginMethod).toBe('magic_link');
    expect(identified.prototypeMagicLinkUrl).toBeUndefined();
  });

  it('requires 2FA setup before a session for password-mode Lucas', async () => {
    await request('/dev/set-member-sign-in-method', {
      method: 'POST',
      body: JSON.stringify({ method: 'password' }),
    });

    const pending = await login({ email: MEMBER_EMAIL, password: MEMBER_PASSWORD });
    expect(pending.token).toBeUndefined();
    expect(pending.twoFactorSetupRequired).toBe(true);
    expect(pending.setupToken).toBeTruthy();
  });

  it('accepts Lucas TOTP at login after activation in account settings', async () => {
    await request('/dev/set-member-sign-in-method', {
      method: 'POST',
      body: JSON.stringify({ method: 'password' }),
    });

    const pending = await login({ email: MEMBER_EMAIL, password: MEMBER_PASSWORD });
    const setupAuthBody = pending.setupToken ? { setupToken: pending.setupToken } : {};
    if (pending.token) {
      setAuthToken(pending.token);
    }

    const setup = await request<TwoFactorSetup>('/account/two-factor/setup', {
      method: 'POST',
      body: JSON.stringify(setupAuthBody),
    });

    await request<TwoFactorActivation>('/account/two-factor/activate', {
      method: 'POST',
      body: JSON.stringify({
        ...setupAuthBody,
        code: await generateTotpCode(setup.secret),
      }),
    });

    setAuthToken('');

    const identified = await request<LoginIdentifyResponse>('/auth/login/identify', {
      method: 'POST',
      body: JSON.stringify({ email: MEMBER_EMAIL }),
    });
    expect(identified.loginMethod).toBe('password');
    expect(identified.requiresTwoFactor).toBe(true);

    await expect(login({ email: MEMBER_EMAIL, password: MEMBER_PASSWORD })).rejects.toMatchObject({
      status: 401,
    });

    const authed = await login({
      email: MEMBER_EMAIL,
      password: MEMBER_PASSWORD,
      twoFactorCode: await generateTotpCode(setup.secret),
    });
    expect(authed.token).toBeTruthy();
  });
});
