import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { ensureAffiliatePartnerViaUi, seedMockMemberSession } from './helpers/mock-auth';

async function assertNoSeriousA11yViolations(
  page: import('@playwright/test').Page,
  options?: { exclude?: string[] }
) {
  let builder = new AxeBuilder({ page });
  for (const selector of options?.exclude ?? []) {
    builder = builder.exclude(selector);
  }
  const results = await builder.analyze();
  const blocking = results.violations.filter((v) =>
    ['serious', 'critical'].includes(v.impact ?? '')
  );
  expect(blocking).toEqual([]);
}

test('public affiliate program landing', async ({ page }) => {
  await page.goto('/affiliate');

  await expect(page.getByRole('heading', { level: 1 })).toContainText('Affiliate-Programm');
  await expect(
    page.getByRole('region', { name: 'Affiliate-Programm auf einen Blick' })
  ).toBeVisible();

  // TopBar inactive nav uses text-white/55 — known contrast debt sitewide, not affiliate-specific.
  await assertNoSeriousA11yViolations(page, { exclude: ['header'] });
});

test.describe('affiliate partner (MSW)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    await seedMockMemberSession(page);
    await ensureAffiliatePartnerViaUi(page);
  });

  test('overview shows earnings and activity', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Einnahmen' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Empfehlungsaktivität' })).toBeVisible();
  });

  test('partner voucher applies on EU Rep checkout', async ({ page }) => {
    await page.goto('/account/eu-rep/checkout');

    await page.getByRole('button', { name: 'Promo-Code eingeben' }).click();

    await page.getByLabel('Code eingeben').fill('LUCAS20');
    await page.getByRole('button', { name: 'Anwenden' }).click();

    await expect(page.getByRole('button', { name: 'Entfernen' })).toBeVisible();
    await expect(page.getByText('LUCAS20')).toBeVisible();
  });
});
