import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('contacts flow: list, create, a11y', async ({ page }) => {
  await page.goto('/contacts');

  // Seeded mock data renders (default locale: de)
  await expect(page.getByRole('heading', { name: 'Kontakte' })).toBeVisible();
  await expect(page.getByText('Anna Keller')).toBeVisible();

  // Accessibility scan on the stable loaded UI (deterministic — no transient toast).
  // Serious/critical violations fail the build.
  const results = await new AxeBuilder({ page }).analyze();
  const blocking = results.violations.filter((v) =>
    ['serious', 'critical'].includes(v.impact ?? '')
  );
  expect(blocking).toEqual([]);

  // Create a contact through the form
  await page.getByLabel('Name').fill('Nora Test');
  await page.getByLabel('E-Mail').fill('nora.test@example.ch');
  await page.getByRole('button', { name: 'Erstellen' }).click();
  await expect(page.getByText('Nora Test')).toBeVisible();
});
