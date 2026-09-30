import { test, expect } from '@playwright/test';

const baseURL = 'http://localhost:5173';

test('real authentication, catalog, test details, logout, and login flow', async ({ page }) => {
  const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const username = `e2euser${suffix}`;
  const email = `e2e-${suffix}@example.test`;
  const password = 'E2E-Test-Password-123!';

  await page.goto(`${baseURL}/register`);
  await page.getByPlaceholder('Choose a username').fill(username);
  await page.getByPlaceholder('you@example.com').fill(email);
  await page.getByPlaceholder('At least 8 characters').fill(password);
  await page.getByPlaceholder('Repeat your password').fill(password);
  await page.getByRole('checkbox', { name: /Terms/i }).check();
  await page.getByRole('button', { name: 'Create account' }).click();
  await page.waitForURL('**/tests');

  await expect(page.getByRole('heading', { name: 'Find a test that feels like you.' })).toBeVisible();
  await expect(page.locator('a[href="/tests/mbti-style"]')).toBeVisible();
  await expect(page.locator('a[href="/tests/cube-personality"]')).toBeVisible();

  await page.locator('a[href="/tests/mbti-style"]').click();
  await page.waitForURL('**/tests/mbti-style');
  await page.getByRole('button', { name: /Start Test/ }).click();
  await page.waitForURL('**/tests/mbti-style/checkout');
  await expect(page.getByRole('heading', { name: 'Secure Checkout' })).toBeVisible();
  await expect(page.getByText('PayPal', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Log out' }).click();
  await page.waitForURL('**/');
  await page.goto(`${baseURL}/login`);
  await page.getByPlaceholder('you@example.com or 010...').fill(email);
  await page.getByPlaceholder('Enter your password').fill(password);
  await page.getByRole('button', { name: 'Log in' }).click();
  await page.waitForURL('**/tests');
  await expect(page.getByRole('button', { name: 'Log out' })).toBeVisible();
});

test('real invalid credentials are rejected', async ({ page }) => {
  await page.goto(`${baseURL}/login`);
  await page.getByPlaceholder('you@example.com or 010...').fill('missing-user@example.test');
  await page.getByPlaceholder('Enter your password').fill('wrong-password-123!');
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page.getByText(/invalid|incorrect|not found/i)).toBeVisible();
});
