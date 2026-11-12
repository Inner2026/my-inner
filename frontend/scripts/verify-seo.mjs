import { readFile } from 'node:fs/promises';
const index = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const robots = await readFile(new URL('../public/robots.txt', import.meta.url), 'utf8');
const sitemap = await readFile(new URL('../dist/sitemap.xml', import.meta.url), 'utf8');
const distIndex = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');

const fail = (message) => { throw new Error(message); };
if (!/<html\s+lang="en">/.test(index)) fail('index.html must declare English language');
if ((index.match(/<title>/g) ?? []).length !== 1) fail('index.html must contain exactly one title');
if (!/rel="canonical"\s+href="https:\/\/www\.my-inner\.com\/"/.test(index)) fail('homepage canonical is missing or not absolute');
if (!/Sitemap:\s*https:\/\/www\.my-inner\.com\/sitemap\.xml/.test(robots)) fail('robots.txt sitemap reference is missing');
if (!/<urlset[^>]+xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/.test(sitemap)) fail('sitemap XML namespace is missing');
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
if (urls.some((url) => !url.startsWith('https://www.my-inner.com/'))) fail('sitemap contains a non-canonical origin');
if (urls.some((url) => /\?|#|\/checkout|\/dashboard|\/admin|\/results|\/attempts/.test(url))) fail('sitemap contains a private, transactional, or parameterized URL');
if (new Set(urls).size !== urls.length) fail('sitemap contains duplicate URLs');
if ((sitemap.match(/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/g) ?? []).length !== urls.length) fail('every sitemap URL must have a lastmod date');
if (!/application\/ld\+json" data-seo-jsonld="true">[^<]*"Organization"/.test(distIndex)) fail('built homepage must contain Organization JSON-LD');
if (!/rel="preload" as="image" href="\/hero-background\.webp"/.test(distIndex)) fail('built homepage must preload the hero image');
for (const asset of ['og-image.jpg', 'logo-512.png', 'favicon-48.png', 'apple-touch-icon.png', 'hero-background.webp']) await readFile(new URL(`../dist/${asset}`, import.meta.url)).catch(() => fail(`missing public asset ${asset}`));
const expectedRoutes = ['/', '/tests', '/about', '/terms', '/blog', '/guides', '/guides/how-do-personality-tests-work', '/guides/sixteen-personality-types-vs-big-five', '/guides/the-five-love-languages-explained', '/guides/what-is-the-inner-child-concept', '/guides/symbolic-personality-tests-for-reflection', '/tests/mbti-style', '/tests/inner-child', '/tests/five-love-languages', '/tests/hidden-animal', '/tests/cube-personality'];
for (const route of expectedRoutes) {
  const relative = route === '/' ? '../dist/index.html' : `../dist${route}/index.html`;
  const html = await readFile(new URL(relative, import.meta.url), 'utf8');
  if ((html.match(/<title>/gi) ?? []).length !== 1) fail(`${route} prerender must contain exactly one title`);
  if ((html.match(/name="description"/gi) ?? []).length !== 1) fail(`${route} prerender must contain exactly one description`);
  if ((html.match(/rel="canonical"/gi) ?? []).length !== 1) fail(`${route} prerender must contain exactly one canonical`);
  if (!/<html\s+lang="en">/.test(html)) fail(`${route} prerender must declare English language`);
}
// Crawlable body content: key pages must ship real text in the initial HTML, not an empty SPA root.
const wordsIn = (html) => { const root = html.slice(html.indexOf('<div id="root">')); return root.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length; };
const minWords = { '/': 250, '/tests': 100, '/guides': 60, '/tests/mbti-style': 350, '/tests/inner-child': 350, '/tests/five-love-languages': 350, '/tests/hidden-animal': 300, '/tests/cube-personality': 300 };
for (const route of expectedRoutes.filter((r) => r.startsWith('/guides/'))) minWords[route] = 400;
for (const [route, min] of Object.entries(minWords)) {
  const html = await readFile(new URL(route === '/' ? '../dist/index.html' : `../dist${route}/index.html`, import.meta.url), 'utf8');
  if (wordsIn(html) < min) fail(`${route} prerender has too little crawlable text (${wordsIn(html)} < ${min} words)`);
  if ((html.match(/<h1[\s>]/gi) ?? []).length !== 1) fail(`${route} prerender must contain exactly one h1`);
}
// Search crawlers must not be blocked from public content; private areas must stay disallowed.
if (/User-agent:\s*OAI-SearchBot[\s\S]*?Disallow:\s*\/\s*$/m.test(robots.replace(/Disallow:\s*\/\w[^\n]*\n?/g, ''))) fail('robots.txt must not block OAI-SearchBot from the whole site');
for (const privatePath of ['/admin', '/dashboard', '/profile', '/results', '/attempts', '/api/']) if (!robots.includes(`Disallow: ${privatePath}`)) fail(`robots.txt must disallow ${privatePath}`);
if ((distIndex.match(/rel="canonical"/gi) ?? []).length !== 1) fail('built homepage must contain exactly one canonical');
if (/<meta name="robots" content="noindex/i.test(distIndex)) fail('built homepage must not be noindex');
for (const route of ['/login', '/register', '/dashboard', '/profile', '/checkout/success', '/admin', '/tests/mbti-style/checkout']) {
  const html = await readFile(new URL(`../dist${route}/index.html`, import.meta.url), 'utf8');
  if (!/<meta name="robots" content="noindex, nofollow"\s*\/?\s*>/i.test(html)) fail(`${route} prerender must be noindex`);
  if (/<script[^>]+src="[^"]*token|Bearer |purchaseId=|email=[^"<]+/i.test(html)) fail(`${route} prerender appears to contain private data`);
}
console.log(`SEO verification passed: ${urls.length} canonical sitemap URLs, ${expectedRoutes.length} prerendered public routes, English metadata, and robots sitemap reference verified.`);
