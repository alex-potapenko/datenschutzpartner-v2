import { describe, expect, it } from 'vitest';
import { loginForgotPasswordHref, loginHrefWithPreservedEmail } from './login-routes';

describe('login-routes', () => {
  it('builds forgot-password href with normalized email', () => {
    expect(loginForgotPasswordHref('  User@Example.com  ')).toBe(
      '/login/forgot-password?email=user%40example.com'
    );
  });

  it('builds login back href with email and returnTo', () => {
    expect(loginHrefWithPreservedEmail('a@b.ch', '/account')).toBe(
      '/login?email=a%40b.ch&returnTo=%2Faccount'
    );
  });
});
