import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

async function assertNoSeriousA11yViolations(page: import('@playwright/test').Page) {
  const results = await new AxeBuilder({ page }).analyze();
  const blocking = results.violations.filter((v) =>
    ['serious', 'critical'].includes(v.impact ?? '')
  );
  expect(blocking).toEqual([]);
}

test('landing page: hero, scan form, a11y', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1 })).toContainText('Prüfe Deine Website');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('auf Datenschutzrisiken');
  await expect(page.getByLabel('Website-URL')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Scannen' })).toBeVisible();

  await assertNoSeriousA11yViolations(page);
});

test('contact page: form and a11y', async ({ page }) => {
  await page.goto('/contact');

  await expect(page.getByRole('heading', { name: 'Kontakt', level: 1 })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Kontaktformular' })).toBeVisible();
  await expect(page.getByLabel('Vorname und Name')).toBeVisible();

  await assertNoSeriousA11yViolations(page);
});
