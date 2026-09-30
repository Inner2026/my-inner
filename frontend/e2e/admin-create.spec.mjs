import { test, expect } from '@playwright/test';

test('admin can create a draft test with an uploaded image', async ({ page }) => {
  const suffix = Date.now();
  const name = `Admin E2E Test ${suffix}`;
  await page.goto('http://localhost:5173/login');
  await page.getByPlaceholder('you@example.com or 010...').fill('admin@myinner.local');
  await page.getByPlaceholder('Enter your password').fill('Admin@12345');
  await page.getByRole('button', { name: 'Log in' }).click();
  await page.waitForURL('**/tests');
  await page.goto('http://localhost:5173/admin/tests/new');
  await expect(page.getByRole('heading', { name: 'Create a complete test' })).toBeVisible();
  await page.getByLabel('Test name').fill(name);
  await page.getByLabel('Slug').fill(`admin-e2e-${suffix}`);
  await page.getByLabel('Description').fill('Browser-created draft for admin workflow verification.');
  await page.getByLabel('Price in cents').fill('499');
  await page.getByLabel('Version label').fill('1.0');
  await page.getByLabel('Expected question count').fill('1');
  await page.getByLabel('Categories').fill('A | Example category');
  await page.getByLabel('Scoring config JSON').fill('{}');
  await page.locator('input[type="file"]').setInputFiles({ name: 'animal.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64') });
  await expect(page.getByText('Uploading image...')).toBeHidden({ timeout: 30000 });
  await expect(page.getByLabel('Test image URL')).toHaveValue(/\/uploads\//);
  await page.getByRole('button', { name: 'Create test and continue' }).click();
  await expect(page.getByText('Build and publish this version')).toBeVisible({ timeout: 30000 });
  await expect(page.getByText('Manage questions')).toBeVisible();
});
