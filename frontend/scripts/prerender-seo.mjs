import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { marked } from 'marked';
import * as ssr from '../dist-ssr/prerender-entry.js';

const siteUrl = (process.env.VITE_SITE_URL || 'https://my-inner.com').replace(/\/$/, '');
const distDir = new URL('../dist/', import.meta.url);
const template = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');
// Search-only overrides shared with the client (src/App.tsx): meta description + social preview image per test.
const testSeo = JSON.parse(await readFile(new URL('../src/seo/testSeo.json', import.meta.url), 'utf8'));

const staticRoutes = [
  ...['/', '/tests', '/about', '/terms', '/guides'].map((path) => ({ path, ...ssr.staticSeo[path] })),
  { path: '/blog', title: 'Articles on Personality, Emotions & Relationships | My Inner', description: 'Read My Inner articles on personality, emotions, relationships and self-reflection.' }
];

const privateRoutes = [
  { path: '/login', title: 'Log In | My Inner', description: 'Log in to your My Inner account.', noIndex: true },
  { path: '/register', title: 'Create an Account | My Inner', description: 'Create a My Inner account to access your assessments and results.', noIndex: true },
  { path: '/forgot-password', title: 'Reset Your Password | My Inner', description: 'Request a secure My Inner password reset link.', noIndex: true },
  { path: '/reset-password', title: 'Set a New Password | My Inner', description: 'Set a new password for your My Inner account.', noIndex: true },
  { path: '/dashboard', title: 'Your Dashboard | My Inner', description: 'Your private My Inner dashboard.', noIndex: true },
  { path: '/profile', title: 'Your Profile | My Inner', description: 'Your private My Inner profile.', noIndex: true },
  { path: '/checkout/success', title: 'Purchase Confirmation | My Inner', description: 'Your private My Inner purchase confirmation.', noIndex: true },
  { path: '/checkout/cancel', title: 'Checkout Cancelled | My Inner', description: 'Your private My Inner checkout status.', noIndex: true },
  { path: '/admin', title: 'Admin | My Inner', description: 'Private My Inner administration area.', noIndex: true },
  { path: '/tests/mbti-style/checkout', title: 'Checkout | My Inner', description: 'Secure checkout for a My Inner assessment.', noIndex: true }
];

// Used only when the public API is unreachable during the build. Price matches the seeded catalogue; the
// question count is deliberately omitted because it is only known from the live API.
const fallbackTests = [
  { slug: 'mbti-style', name: '16 Personality Types Test', description: 'A My Inner self-discovery assessment across four personality dimensions, leading to one of 16 personality types.' },
  { slug: 'inner-child', name: 'Inner Child Self-Reflection Test', description: 'Explore emotional and self-reflection patterns. This is not a clinical diagnosis.' },
  { slug: 'five-love-languages', name: 'Five Love Languages Test', description: 'Discover how you prefer to give and receive love.' },
  { slug: 'hidden-animal', name: 'The Hidden Animal Test', description: 'An entertainment/self-reflection personality experience, not a scientific diagnosis.' },
  { slug: 'cube-personality', name: 'Cube Personality Test', description: 'A symbolic self-reflection exercise (cube, ladder, horse, flowers, storm), not scientifically proven psychological fact.' }
].map((test) => ({ ...test, priceCents: 499, currency: 'usd' }));

const apiBase = (process.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const apiUsable = apiBase && !/localhost|127\.0\.0\.1/.test(apiBase);
async function apiGet(path) {
  const response = await fetch(`${apiBase}${path}`, { signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error(`API returned ${response.status}`);
  return response.json();
}

async function getPublicTests() {
  if (!apiUsable) return fallbackTests;
  try {
    const data = await apiGet('/tests');
    const tests = Array.isArray(data.tests) ? data.tests : [];
    return tests.filter((test) => test?.slug && test?.name && test?.description).map((test) => ({ slug: test.slug, name: test.name, description: test.description, questionCount: test.questionCount, priceCents: test.price?.amount, currency: test.price?.currency }));
  } catch (error) {
    console.warn(`[prerender] Public test API unavailable; using repository fallbacks (${error.message})`);
    return fallbackTests;
  }
}

async function getPublishedArticles() {
  if (!apiUsable) return [];
  try {
    const list = await apiGet('/articles');
    const articles = [];
    for (const item of Array.isArray(list.articles) ? list.articles : []) {
      try { articles.push((await apiGet(`/articles/${encodeURIComponent(item.slug)}`)).article); } catch (error) { console.warn(`[prerender] Skipping article ${item.slug}: ${error.message}`); }
    }
    return articles.filter((article) => article?.slug && article?.title);
  } catch (error) {
    console.warn(`[prerender] Articles API unavailable; no article pages generated (${error.message})`);
    return [];
  }
}

// Article Markdown is admin-authored, but the prerendered HTML is served before any client-side sanitizing,
// so raw HTML is escaped and only http(s)/relative links and images are emitted.
const safeUrl = (href) => (/^(https?:\/\/|\/|#|mailto:)/i.test(href ?? '') ? href : '');
const articleRenderer = new marked.Renderer();
articleRenderer.html = ({ text }) => escapeHtml(text);
articleRenderer.link = function ({ href, title, tokens }) { const url = safeUrl(href); const label = this.parser.parseInline(tokens); return url ? `<a href="${escapeHtml(url)}"${title ? ` title="${escapeHtml(title)}"` : ''}${/^https?:/i.test(url) ? ' rel="noopener noreferrer"' : ''}>${label}</a>` : label; };
articleRenderer.image = ({ href, text }) => { const url = safeUrl(href); return url ? `<img src="${escapeHtml(url)}" alt="${escapeHtml(text ?? '')}" loading="lazy" />` : ''; };
const renderArticleHtml = (markdown) => marked.parse(String(markdown ?? ''), { renderer: articleRenderer, async: false });

function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function replaceMeta(html, attribute, key, value) {
  const pattern = new RegExp(`<meta\\s+${attribute}="${key}"\\s+content="[^"]*"\\s*/?>`, 'i');
  return html.replace(pattern, `<meta ${attribute}="${key}" content="${escapeHtml(value)}" />`);
}

function renderRoute(route) {
  const canonical = `${siteUrl}${route.path === '/' ? '/' : route.path}`;
  let html = template.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(route.title)}</title>`);
  html = replaceMeta(html, 'name', 'description', route.description);
  html = replaceMeta(html, 'property', 'og:title', route.title);
  html = replaceMeta(html, 'property', 'og:description', route.description);
  html = replaceMeta(html, 'property', 'og:url', canonical);
  html = replaceMeta(html, 'name', 'twitter:title', route.title);
  html = replaceMeta(html, 'name', 'twitter:description', route.description);
  if (route.image) {
    const image = route.image.startsWith('http') ? route.image : `${siteUrl}${route.image}`;
    html = replaceMeta(html, 'property', 'og:image', image);
    html = replaceMeta(html, 'name', 'twitter:image', image);
  }
  html = html.replace(/<link rel="canonical" href="[^"]*"\s*\/?\s*>/i, `<link rel="canonical" href="${canonical}" />`);
  html = html.replace(/<meta name="robots" content="[^"]*"\s*\/?\s*>/i, `<meta name="robots" content="${route.noIndex ? 'noindex, nofollow' : 'index, follow'}" />`);
  if (!/<meta name="robots"/i.test(html)) html = html.replace('</head>', `    <meta name="robots" content="${route.noIndex ? 'noindex, nofollow' : 'index, follow'}" />\n  </head>`);
  if (route.body) html = html.replace('<div id="root"></div>', () => `<div id="root">${route.body}</div>`);
  const extraHead = [];
  // The homepage hero is a CSS background, which the browser discovers late; preload it to improve LCP.
  if (route.path === '/') extraHead.push('<link rel="preload" as="image" href="/hero-background.webp" type="image/webp" fetchpriority="high" />');
  // Same data-seo-jsonld marker the client Seo component uses, so React replaces it instead of duplicating it.
  if (route.jsonLd) extraHead.push(`<script type="application/ld+json" data-seo-jsonld="true">${JSON.stringify(route.jsonLd).replaceAll('<', '\\u003c')}</script>`);
  if (extraHead.length) html = html.replace('</head>', `    ${extraHead.join('\n    ')}\n  </head>`);
  return html;
}

const organization = { '@context': 'https://schema.org', '@type': 'Organization', name: 'My Inner', url: siteUrl, logo: `${siteUrl}/logo-512.png` };
const breadcrumb = (trail) => ssr.breadcrumbJsonLd(siteUrl, trail);
const today = new Date().toISOString().slice(0, 10);

function renderSitemap(entries) {
  const urls = entries.map(({ path, lastmod }) => `  <url><loc>${siteUrl}${path === '/' ? '/' : path}</loc><lastmod>${lastmod || today}</lastmod></url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
}

const tests = await getPublicTests();
const articles = await getPublishedArticles();

const testRoutes = tests.map((raw) => {
  const content = ssr.testContent[raw.slug];
  const description = content?.seoDescription ?? testSeo[raw.slug]?.description ?? raw.description;
  const title = content?.seoTitle ?? `${raw.name} | My Inner`;
  const quiz = { '@context': 'https://schema.org', '@type': 'Quiz', name: raw.name, description, url: `${siteUrl}/tests/${raw.slug}`, image: `${siteUrl}${testSeo[raw.slug]?.image ?? '/og-image.jpg'}`, isAccessibleForFree: false, provider: { '@type': 'Organization', name: 'My Inner', url: siteUrl } };
  return { path: `/tests/${raw.slug}`, title, description, image: testSeo[raw.slug]?.image, jsonLd: [quiz, breadcrumb([{ name: 'Home', path: '/' }, { name: 'Tests', path: '/tests' }, { name: raw.name, path: `/tests/${raw.slug}` }])], body: ssr.renderTest(raw, description) };
});

const guideRoutes = ssr.guides.map((guide) => ({ path: `/guides/${guide.slug}`, title: guide.seoTitle, description: guide.description, jsonLd: ssr.guideJsonLd(siteUrl, guide), body: ssr.renderGuide(guide.slug), lastmod: ssr.CONTENT_UPDATED }));

const articleRoutes = articles.map((article) => {
  const image = article.coverImageUrl ? (article.coverImageUrl.startsWith('http') ? article.coverImageUrl : `${siteUrl}${article.coverImageUrl}`) : `${siteUrl}/og-image.jpg`;
  const jsonLd = [{ '@context': 'https://schema.org', '@type': 'BlogPosting', headline: article.title, description: article.excerpt, image, datePublished: article.publishedAt ?? undefined, dateModified: article.updatedAt, mainEntityOfPage: `${siteUrl}/blog/${article.slug}`, author: { '@type': 'Organization', name: 'My Inner', url: siteUrl }, publisher: { ...organization, '@context': undefined, logo: { '@type': 'ImageObject', url: `${siteUrl}/logo-512.png` } } }, breadcrumb([{ name: 'Home', path: '/' }, { name: 'Articles', path: '/blog' }, { name: article.title, path: `/blog/${article.slug}` }])];
  const body = `<div class="min-h-[60vh] bg-[#fcfaf9] px-4 py-10 sm:px-8"><article class="mx-auto max-w-3xl"><h1 class="font-serif text-4xl leading-tight text-[#283452] sm:text-5xl">${escapeHtml(article.title)}</h1><p class="mt-4 text-lg leading-8 text-[#62596c]">${escapeHtml(article.excerpt ?? '')}</p><div class="mt-8">${renderArticleHtml(article.content)}</div></article></div>`;
  return { path: `/blog/${article.slug}`, title: `${article.title} | My Inner`, description: article.excerpt, image: article.coverImageUrl || undefined, jsonLd, body, lastmod: (article.updatedAt || article.publishedAt || '').slice(0, 10) || undefined };
});

staticRoutes[0].jsonLd = [organization, { '@context': 'https://schema.org', '@type': 'WebSite', name: 'My Inner', url: `${siteUrl}/` }];
staticRoutes[0].body = ssr.renderHome();
staticRoutes.find((route) => route.path === '/tests').body = ssr.renderTests(tests);
staticRoutes.find((route) => route.path === '/guides').body = ssr.renderGuides();
staticRoutes.find((route) => route.path === '/blog').body = `<div class="min-h-[60vh] px-4 py-12 sm:px-8"><div class="mx-auto max-w-4xl"><h1 class="font-serif text-4xl text-[#283452] sm:text-5xl">Guides for knowing yourself better.</h1><ul class="mt-8 space-y-4">${articles.map((article) => `<li><a href="/blog/${escapeHtml(article.slug)}" class="font-serif text-xl text-[#302447]">${escapeHtml(article.title)}</a><p class="text-sm text-[#737080]">${escapeHtml(article.excerpt ?? '')}</p></li>`).join('')}</ul></div></div>`;

const publicRoutes = [...staticRoutes, ...testRoutes, ...guideRoutes, ...articleRoutes];
for (const route of [...publicRoutes, ...privateRoutes]) {
  const targetDir = route.path === '/' ? new URL('../dist/', import.meta.url) : new URL(`../dist${route.path}/`, import.meta.url);
  await mkdir(targetDir, { recursive: true });
  await writeFile(new URL('index.html', targetDir), renderRoute(route), 'utf8');
}
// Regenerate the sitemap from the same public route list so new assessments, guides and articles are included automatically.
await writeFile(new URL('../dist/sitemap.xml', import.meta.url), renderSitemap(publicRoutes.filter((route) => route.path !== '/blog' || articleRoutes.length > 0).map((route) => ({ path: route.path, lastmod: route.lastmod }))), 'utf8');

if (!articleRoutes.length) console.warn('[prerender] No published articles fetched: /blog is left out of sitemap.xml. Set VITE_API_BASE_URL for the build to include articles.');
console.log(`[prerender] Generated ${publicRoutes.length} public (${tests.length} tests, ${guideRoutes.length} guides, ${articleRoutes.length} articles) and ${privateRoutes.length} private route HTML shells in ${join(distDir.pathname, '')}`);
