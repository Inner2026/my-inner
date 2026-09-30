import { test, expect } from '@playwright/test';

test('completed result can start a free retake', async ({ page }) => {
  await page.goto('http://localhost:5173/login');
  await page.getByPlaceholder('you@example.com or 010...').fill('cube-1790522967286164@example.test');
  await page.getByPlaceholder('Enter your password').fill('E2E-Test-Password-123!');
  await page.getByRole('button', { name: 'Log in' }).click();
  await page.waitForURL('**/tests');
  await page.goto('http://localhost:5173/dashboard');
  await page.getByRole('button', { name: 'My Results' }).click();
  await page.getByText('Cube Personality Test', { exact: true }).click();
  await page.waitForURL('**/results/**');
  await page.getByRole('button', { name: /Retake this test/ }).click();
  await page.waitForURL('**/attempts/**/instructions', { timeout: 30000 });
  await expect(page.getByRole('button', { name: /Start the test/ })).toBeVisible();
});
