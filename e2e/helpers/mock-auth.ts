import { expect, type Page } from '@playwright/test';
import { MOCK_MEMBER_LOGIN } from '../../lib/mock-login-accounts';

export const MOCK_MEMBER_AUTH_TOKEN = `mock-email-${encodeURIComponent(MOCK_MEMBER_LOGIN.email)}`;

export async function seedMockMemberSession(page: Page) {
  await page.addInitScript((token: string) => {
    window.localStorage.setItem('dsp-auth-token', token);
  }, MOCK_MEMBER_AUTH_TOKEN);
}

/**
 * Ensures Lucas is an approved affiliate partner (MSW in the browser).
 */
export async function ensureAffiliatePartnerViaUi(page: Page) {
  await page.goto('/account?section=affiliate&tab=overview');

  const earningsHeading = page.getByRole('heading', { name: 'Einnahmen' });
  if (await earningsHeading.isVisible().catch(() => false)) {
    return;
  }

  await page.waitForFunction(() => document.readyState === 'complete');

  const bootstrapped = await page.evaluate(async (email) => {
    const token = window.localStorage.getItem('dsp-auth-token');
    if (!token) return 'no_token' as const;

    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    const dashRes = await fetch('/api/affiliate/dashboard/me', { headers });
    if (dashRes.ok) {
      const dash: unknown = await dashRes.json();
      if (dash !== null && typeof dash === 'object' && 'partner' in dash) {
        return 'partner' as const;
      }
    }

    await fetch('/api/affiliate/applications', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        email,
        websiteUrl: 'https://example.ch',
        description: 'Playwright affiliate smoke.',
      }),
    });

    const approveRes = await fetch('/api/affiliate/prototype/simulate-approval-email', {
      method: 'POST',
      headers,
    });
    if (!approveRes.ok) return 'approve_failed' as const;
    return 'approved' as const;
  }, MOCK_MEMBER_LOGIN.email);

  expect(bootstrapped).not.toBe('no_token');
  expect(bootstrapped).not.toBe('approve_failed');

  await page.reload();
  await expect(earningsHeading).toBeVisible({ timeout: 20_000 });
}
