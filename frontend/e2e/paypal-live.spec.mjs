import { test, expect } from '@playwright/test';

const baseURL = 'http://localhost:5173';

test('real PayPal Sandbox purchase and MBTI flow', async ({ page }) => {
  const email = process.env.MYINNER_BUYER_EMAIL;
  const password = process.env.MYINNER_BUYER_PASSWORD;
  if (!email || !password) throw new Error('Secure buyer credentials were not provided to the process.');

  const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  await page.goto(`${baseURL}/register`);
  await page.getByPlaceholder('Choose a username').fill(`paypaluser${suffix}`);
  await page.getByPlaceholder('you@example.com').fill(`paypal-${suffix}@example.test`);
  await page.getByPlaceholder('At least 8 characters').fill('E2E-Test-Password-123!');
  await page.getByPlaceholder('Repeat your password').fill('E2E-Test-Password-123!');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Create account' }).click();
  await page.waitForURL('**/tests');

  await page.locator('a[href="/tests/mbti-style"]').click();
  await page.waitForURL('**/tests/mbti-style');
  await page.getByRole('button', { name: /Start Test/ }).click();
  await page.waitForURL('**/tests/mbti-style/checkout');
  await expect(page.getByText('PayPal', { exact: true })).toBeVisible();

  const token = await page.evaluate(() => localStorage.getItem('myinner_token'));
  const purchase = await page.evaluate(async ({ token }) => {
    const response = await fetch('http://localhost:4000/api/purchases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ testSlug: 'mbti-style' })
    });
    return { status: response.status, body: await response.json() };
  }, { token });
  console.log(`PURCHASE_STATUS=${purchase.status}`);
  console.log(`PURCHASE_PROVIDER=${purchase.body.paymentProvider}`);
  console.log(`PURCHASE_ID=${purchase.body.purchaseId}`);
  console.log(`PAYPAL_ORDER_ID=${purchase.body.paypalOrderId}`);
  expect(purchase.status).toBe(201);
  expect(purchase.body.approvalUrl).toMatch(/^https:\/\/www\.sandbox\.paypal\.com\//);

  await page.screenshot({ path: 'test-results/paypal-checkout-before-approval.png', fullPage: true });
  const purchaseId = purchase.body.purchaseId;
  const paypalOrderId = purchase.body.paypalOrderId;
  await page.goto(purchase.body.approvalUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(5000);
  console.log(`APPROVAL_INITIAL_URL=${page.url()}`);
  console.log(`APPROVAL_INITIAL_TEXT=${(await page.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 1800)}`);

  const approvalPage = page;
  const popup = null;
  await approvalPage.screenshot({ path: 'test-results/paypal-approval-login.png', fullPage: true });

  const emailInput = approvalPage.locator('input[type="email"], input[name="login_email"]').first();
  await expect(emailInput).toBeVisible({ timeout: 30000 });
  await emailInput.fill(email);
  await approvalPage.getByRole('button', { name: /next|التالي/i }).click();
  const passwordInput = approvalPage.locator('input[type="password"], input[name="login_password"]').first();
  await expect(passwordInput).toBeVisible({ timeout: 30000 });
  await passwordInput.fill(password);
  await approvalPage.getByRole('button', { name: /log in|تسجيل الدخول/i }).click();

  await approvalPage.waitForTimeout(5000);
  console.log(`AFTER_LOGIN_URL=${approvalPage.url()}`);
  console.log(`AFTER_LOGIN_TEXT=${(await approvalPage.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 1800)}`);
  await approvalPage.screenshot({ path: 'test-results/paypal-after-login.png', fullPage: true });

  const bodyText = (await approvalPage.locator('body').innerText()).replace(/\s+/g, ' ');
  const approve = approvalPage.getByText(/pay now|complete purchase|استكمال الشراء|دفع الآن|موافقة/i).last();
  await expect(approve).toBeVisible({ timeout: 30000 });
  await approve.click();
  await approvalPage.waitForTimeout(5000);
  console.log(`AFTER_APPROVAL_URL=${approvalPage.url()}`);
  console.log(`AFTER_APPROVAL_TEXT=${(await approvalPage.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 1200)}`);

  await page.waitForURL('**/checkout/success**', { timeout: 60000 });
  const purchaseState = await page.evaluate(async ({ token, purchaseId }) => {
    const headers = { Authorization: `Bearer ${token}` };
    const purchase = await fetch(`http://localhost:4000/api/purchases/${purchaseId}`, { headers }).then((r) => r.json());
    const attempts = await fetch('http://localhost:4000/api/attempts', { headers }).then((r) => r.json());
    const attempt = (attempts.attempts || []).find((a) => a.testId?.slug === 'mbti-style' && a.status !== 'submitted');
    return { purchase, attempt };
  }, { token, purchaseId });
  console.log(`PURCHASE_FINAL_STATUS=${purchaseState.purchase.purchase?.status}`);
  console.log(`ATTEMPT_ID=${purchaseState.attempt?._id || ''}`);
  expect(purchaseState.purchase.purchase?.status).toBe('paid');
  expect(purchaseState.attempt?._id).toBeTruthy();
  const attemptId = purchaseState.attempt._id;

  await page.goto(`${baseURL}/attempts/${attemptId}/instructions`);
  await expect(page.getByRole('button', { name: /Start the test/ })).toBeVisible();
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
  const submit = page.getByRole('button', { name: /See my result/ });
  await expect(submit).toBeVisible();
  await submit.click();
  await expect(page.getByRole('button', { name: /Skip for now/ })).toBeVisible({ timeout: 60000 });
  await page.getByRole('button', { name: /Skip for now/ }).click();
  await page.waitForURL(`**/results/${attemptId}`);
  console.log(`QUESTIONS_ANSWERED=${answered}`);
  const resultText = (await page.locator('body').innerText()).replace(/\s+/g, ' ');
  console.log(`RESULT_TEXT=${resultText.slice(0, 1000)}`);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'INFP' })).toBeVisible();
  await page.goto(`${baseURL}/dashboard`);
  await page.getByRole('button', { name: 'My Results' }).click();
  await expect(page.getByText(/Architect|Mediator|Commander|Logician|Advocate|Debater|Protagonist|Campaigner|Defender|Virtuoso|Adventurer|Entrepreneur|Executive|Consul|Entertainer|completed/i).first()).toBeVisible({ timeout: 30000 });

  console.log(`AFTER_BUTTON_URL=${page.url()}`);
  console.log(`AFTER_BUTTON_TEXT=${(await page.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 1200)}`);
  await page.screenshot({ path: 'test-results/paypal-after-button.png', fullPage: true });
});
