import { readFile } from 'node:fs/promises';
const index = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const robots = await readFile(new URL('../public/robots.txt', import.meta.url), 'utf8');
const sitemap = await readFile(new URL('../public/sitemap.xml', import.meta.url), 'utf8');
const distIndex = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');

const fail = (message) => { throw new Error(message); };
if (!/<html\s+lang="en">/.test(index)) fail('index.html must declare English language');
if ((index.match(/<title>/g) ?? []).length !== 1) fail('index.html must contain exactly one title');
if (!/rel="canonical"\s+href="https:\/\/my-inner\.com\/"/.test(index)) fail('homepage canonical is missing or not absolute');
if (!/Sitemap:\s*https:\/\/my-inner\.com\/sitemap\.xml/.test(robots)) fail('robots.txt sitemap reference is missing');
if (!/<urlset[^>]+xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/.test(sitemap)) fail('sitemap XML namespace is missing');
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
if (urls.some((url) => !url.startsWith('https://my-inner.com/'))) fail('sitemap contains a non-canonical origin');
if (urls.some((url) => /\?|#|\/checkout|\/dashboard|\/admin|\/results|\/attempts/.test(url))) fail('sitemap contains a private, transactional, or parameterized URL');
if (new Set(urls).size !== urls.length) fail('sitemap contains duplicate URLs');
const expectedRoutes = ['/', '/tests', '/about', '/terms', '/tests/mbti-style', '/tests/inner-child', '/tests/five-love-languages', '/tests/hidden-animal', '/tests/cube-personality'];
for (const route of expectedRoutes) {
  const relative = route === '/' ? '../dist/index.html' : `../dist${route}/index.html`;
  const html = await readFile(new URL(relative, import.meta.url), 'utf8');
  if ((html.match(/<title>/gi) ?? []).length !== 1) fail(`${route} prerender must contain exactly one title`);
  if ((html.match(/name="description"/gi) ?? []).length !== 1) fail(`${route} prerender must contain exactly one description`);
  if ((html.match(/rel="canonical"/gi) ?? []).length !== 1) fail(`${route} prerender must contain exactly one canonical`);
  if (!/<html\s+lang="en">/.test(html)) fail(`${route} prerender must declare English language`);
}
if ((distIndex.match(/rel="canonical"/gi) ?? []).length !== 1) fail('built homepage must contain exactly one canonical');
if (/<meta name="robots" content="noindex/i.test(distIndex)) fail('built homepage must not be noindex');
for (const route of ['/login', '/register', '/dashboard', '/profile', '/checkout/success', '/admin', '/tests/mbti-style/checkout']) {
  const html = await readFile(new URL(`../dist${route}/index.html`, import.meta.url), 'utf8');
  if (!/<meta name="robots" content="noindex, nofollow"\s*\/?\s*>/i.test(html)) fail(`${route} prerender must be noindex`);
  if (/<script[^>]+src="[^"]*token|Bearer |purchaseId=|email=[^"<]+/i.test(html)) fail(`${route} prerender appears to contain private data`);
}
console.log(`SEO verification passed: ${urls.length} canonical sitemap URLs, ${expectedRoutes.length} prerendered public routes, English metadata, and robots sitemap reference verified.`);
