const baseUrl = (process.env.SEO_VERIFY_BASE_URL || 'http://127.0.0.1:4173').replace(/\/$/, '');
// Vite preview serves directory index files with a trailing slash. Vercel clean URLs
// map the same generated directories to their slashless production URLs.
const routes = ['/', '/tests/', '/about/', '/terms/', '/tests/mbti-style/'];
const privateRoutes = ['/login/', '/dashboard/', '/checkout/success/', '/tests/mbti-style/checkout/'];
const fail = (message) => { throw new Error(message); };

for (const route of routes) {
  const response = await fetch(`${baseUrl}${route}`);
  if (!response.ok) fail(`${route} returned HTTP ${response.status}`);
  const html = await response.text();
  if ((html.match(/<title>/gi) ?? []).length !== 1) fail(`${route} must contain one initial title`);
  if ((html.match(/rel="canonical"/gi) ?? []).length !== 1) fail(`${route} must contain one canonical`);
  if (!/<html\s+lang="en">/i.test(html)) fail(`${route} must declare lang=en`);
  if (/Bearer |JWT|purchaseId=|email|password|referralCode/i.test(html)) fail(`${route} appears to contain private data`);
}

for (const route of privateRoutes) {
  const response = await fetch(`${baseUrl}${route}`);
  if (!response.ok) fail(`${route} returned HTTP ${response.status}`);
  const html = await response.text();
  if (/purchaseId=|Bearer |JWT/i.test(html)) fail(`${route} exposed a private token or transaction identifier`);
  if (!/<meta name="robots" content="noindex, nofollow"/i.test(html)) fail(`${route} must expose an initial noindex directive`);
}

console.log(`HTTP SEO verification passed for ${routes.length} public and ${privateRoutes.length} private routes at ${baseUrl}.`);
