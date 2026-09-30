import { test, expect } from '@playwright/test';

const baseURL = 'http://localhost:5173';

test('real PayPal Sandbox purchase and Cube flow', async ({ page }) => {
  const email = process.env.MYINNER_BUYER_EMAIL;
  const password = process.env.MYINNER_BUYER_PASSWORD;
  if (!email || !password) throw new Error('Secure buyer credentials were not provided.');
  const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  await page.goto(`${baseURL}/register`);
  await page.getByPlaceholder('Choose a username').fill(`cubeuser${suffix}`);
  await page.getByPlaceholder('you@example.com').fill(`cube-${suffix}@example.test`);
  await page.getByPlaceholder('At least 8 characters').fill('E2E-Test-Password-123!');
  await page.getByPlaceholder('Repeat your password').fill('E2E-Test-Password-123!');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Create account' }).click();
  await page.waitForURL('**/tests');
  await page.locator('a[href="/tests/cube-personality"]').click();
  await page.waitForURL('**/tests/cube-personality');
  await page.getByRole('button', { name: /Start Test/ }).click();
  await page.waitForURL('**/tests/cube-personality/checkout');
  const token = await page.evaluate(() => localStorage.getItem('myinner_token'));
  const purchase = await page.evaluate(async ({ token }) => { const r = await fetch('http://localhost:4000/api/purchases', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ testSlug: 'cube-personality' }) }); return { status: r.status, body: await r.json() }; }, { token });
  expect(purchase.status).toBe(201);
  const { purchaseId, paypalOrderId, approvalUrl } = purchase.body;
  await page.goto(approvalUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
  const emailInput = page.locator('input[type="email"], input[name="login_email"]').first();
  await expect(emailInput).toBeVisible({ timeout: 30000 });
  await emailInput.fill(email);
  await page.getByRole('button', { name: /next|التالي/i }).click();
  const passwordInput = page.locator('input[type="password"], input[name="login_password"]').first();
  await expect(passwordInput).toBeVisible({ timeout: 30000 });
  await passwordInput.fill(password);
  await page.getByRole('button', { name: /log in|تسجيل الدخول/i }).click();
  await page.waitForTimeout(4000);
  const approve = page.getByText(/pay now|complete purchase|استكمال الشراء|دفع الآن|موافقة/i).last();
  await expect(approve).toBeVisible({ timeout: 30000 });
  await approve.click();
  await page.waitForURL('**/checkout/success**', { timeout: 60000 });
  const state = await page.evaluate(async ({ token, purchaseId, paypalOrderId }) => {
    const h = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
    let p;
    for (let i = 0; i < 30; i += 1) {
      p = await fetch(`http://localhost:4000/api/purchases/${purchaseId}`, { headers: h }).then(r => r.json());
      if (p.purchase?.status === 'paid') break;
      if (p.purchase?.status === 'pending') await fetch(`http://localhost:4000/api/purchases/${purchaseId}/capture`, { method: 'POST', headers: h, body: JSON.stringify({ orderId: paypalOrderId }) }).catch(() => undefined);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    const a = await fetch('http://localhost:4000/api/attempts', { headers: h }).then(r => r.json());
    return { purchase: p, attempt: (a.attempts || []).find(x => x.testId?.slug === 'cube-personality' && x.status !== 'submitted') };
  }, { token, purchaseId, paypalOrderId });
  expect(state.purchase.purchase.status).toBe('paid');
  let attempt = state.attempt;
  if (!attempt) {
    const created = await page.evaluate(async ({ token, purchaseId }) => fetch('http://localhost:4000/api/attempts', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ purchaseId }) }).then(r => r.json()), { token, purchaseId });
    attempt = created.attempt;
  }
  expect(attempt?._id).toBeTruthy();
  const attemptId = attempt._id;
  await page.goto(`${baseURL}/attempts/${attemptId}/instructions`);
  await page.getByRole('button', { name: /Start the test/ }).click();
  await page.waitForURL(`**/attempts/${attemptId}/run`);
  await expect(page.getByText(/Question 1 of/)).toBeVisible({ timeout: 30000 });
  let answered = 0;
  while (true) {
    await page.locator('main button').filter({ hasNotText: /Back|Next|See my result/ }).first().click();
    answered += 1;
    const next = page.getByRole('button', { name: /Next/ });
    if (!(await next.count())) break;
    await next.click();
  }
  await page.getByRole('button', { name: /See my result/ }).click();
  await page.getByRole('button', { name: /Skip for now/ }).click();
  await page.waitForURL(`**/results/${attemptId}`);
  const result = (await page.locator('body').innerText()).replace(/\s+/g, ' ');
  console.log(`CUBE_PURCHASE=${state.purchase.purchase.status}`);
  console.log(`CUBE_QUESTIONS_ANSWERED=${answered}`);
  console.log(`CUBE_RESULT=${result.slice(0, 900)}`);
  await page.reload();
  await expect(page.locator('h1').first()).toBeVisible();
  await page.goto(`${baseURL}/dashboard`);
  await page.getByRole('button', { name: 'My Results' }).click();
  await expect(page.getByText(/Cube Personality|completed/i).first()).toBeVisible({ timeout: 30000 });
});
