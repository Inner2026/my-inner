import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const siteUrl = (process.env.VITE_SITE_URL || 'https://my-inner.com').replace(/\/$/, '');
const distDir = new URL('../dist/', import.meta.url);
const template = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');

const staticRoutes = [
  { path: '/', title: 'My Inner | Self-Awareness & Personal Growth', description: 'Explore My Inner for self-reflection, personal growth, and emotional wellness resources designed to support your journey toward greater self-awareness.' },
  { path: '/tests', title: 'Self-Discovery Tests | My Inner', description: 'Explore self-discovery assessments from My Inner for personality, emotions, relationships, and personal reflection.' },
  { path: '/about', title: 'About My Inner | Self-Discovery & Personal Growth', description: 'Learn about My Inner and our approach to self-discovery, personal growth, and thoughtful assessments.' },
  { path: '/terms', title: 'Terms of Service | My Inner', description: 'Read the My Inner terms of service for using our self-discovery assessment platform.' }
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

const fallbackTests = [
  { slug: 'mbti-style', name: 'MBTI-style Personality Test', description: 'A My Inner MBTI-style self-discovery assessment across four dichotomies. This is an original, self-discovery assessment inspired by well-known personality frameworks -- it is not the official proprietary MBTI instrument.' },
  { slug: 'inner-child', name: 'Inner Child Self-Reflection Test', description: 'Explore emotional and self-reflection patterns. This is not a clinical diagnosis.' },
  { slug: 'five-love-languages', name: 'Five Love Languages Test', description: 'Discover how you prefer to give and receive love.' },
  { slug: 'hidden-animal', name: 'The Hidden Animal Test', description: 'An entertainment/self-reflection personality experience -- not a scientific diagnosis.' },
  { slug: 'cube-personality', name: 'Cube Personality Test', description: 'A symbolic self-reflection exercise (cube, ladder, horse, flowers, storm). Framed as symbolic/self-reflection content, not scientifically proven psychological fact.' }
];

async function getPublicTests() {
  const apiBase = (process.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
  if (!apiBase || /localhost|127\.0\.0\.1/.test(apiBase)) return fallbackTests;
  try {
    const response = await fetch(`${apiBase}/tests`, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error(`API returned ${response.status}`);
    const data = await response.json();
    const tests = Array.isArray(data.tests) ? data.tests : [];
    return tests.filter((test) => test?.slug && test?.name && test?.description).map((test) => ({ slug: test.slug, name: test.name, description: test.description }));
  } catch (error) {
    console.warn(`[prerender] Public test API unavailable; using repository fallbacks (${error.message})`);
    return fallbackTests;
  }
}

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
  html = html.replace(/<link rel="canonical" href="[^"]*"\s*\/?\s*>/i, `<link rel="canonical" href="${canonical}" />`);
  html = html.replace(/<meta name="robots" content="[^"]*"\s*\/?\s*>/i, `<meta name="robots" content="${route.noIndex ? 'noindex, nofollow' : 'index, follow'}" />`);
  if (!/<meta name="robots"/i.test(html)) html = html.replace('</head>', `    <meta name="robots" content="${route.noIndex ? 'noindex, nofollow' : 'index, follow'}" />\n  </head>`);
  const extraHead = [];
  // The homepage hero is a CSS background, which the browser discovers late; preload it to improve LCP.
  if (route.path === '/') extraHead.push('<link rel="preload" as="image" href="/hero-background.webp" type="image/webp" fetchpriority="high" />');
  // Same data-seo-jsonld marker the client Seo component uses, so React replaces it instead of duplicating it.
  if (route.jsonLd) extraHead.push(`<script type="application/ld+json" data-seo-jsonld="true">${JSON.stringify(route.jsonLd).replaceAll('<', '\\u003c')}</script>`);
  if (extraHead.length) html = html.replace('</head>', `    ${extraHead.join('\n    ')}\n  </head>`);
  return html;
}

const organization = { '@context': 'https://schema.org', '@type': 'Organization', name: 'My Inner', url: siteUrl, logo: `${siteUrl}/logo-512.png` };
staticRoutes[0].jsonLd = [organization, { '@context': 'https://schema.org', '@type': 'WebSite', name: 'My Inner', url: `${siteUrl}/` }];
const testJsonLd = (test) => ({ '@context': 'https://schema.org', '@type': 'Quiz', name: test.name, description: test.description, url: `${siteUrl}/tests/${test.slug}`, image: `${siteUrl}/og-image.jpg`, isAccessibleForFree: false, provider: { '@type': 'Organization', name: 'My Inner', url: siteUrl } });

function renderSitemap(paths) {
  const lastmod = new Date().toISOString().slice(0, 10);
  const urls = paths.map((path) => `  <url><loc>${siteUrl}${path === '/' ? '/' : path}</loc><lastmod>${lastmod}</lastmod></url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
}

const tests = await getPublicTests();
const testRoutes = tests.map((test) => ({ path: `/tests/${test.slug}`, title: `${test.name} | My Inner`, description: test.description, jsonLd: testJsonLd(test) }));
for (const route of [...staticRoutes, ...testRoutes, ...privateRoutes]) {
  const targetDir = route.path === '/' ? new URL('../dist/', import.meta.url) : new URL(`../dist${route.path}/`, import.meta.url);
  await mkdir(targetDir, { recursive: true });
  await writeFile(new URL('index.html', targetDir), renderRoute(route), 'utf8');
}
// Regenerate the sitemap from the same public route list so new assessments are included automatically.
await writeFile(new URL('../dist/sitemap.xml', import.meta.url), renderSitemap([...staticRoutes, ...testRoutes].map((route) => route.path)), 'utf8');

console.log(`[prerender] Generated ${staticRoutes.length + tests.length} public and ${privateRoutes.length} private route HTML shells in ${join(distDir.pathname, '')}`);
