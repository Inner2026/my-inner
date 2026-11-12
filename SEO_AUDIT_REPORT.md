# My Inner SEO audit and implementation report

Date: 2026-10-20

## Audit findings

The application is a Vite 8 + React 19 + TypeScript single-page frontend using React Router 7, with a separate Express/TypeScript backend. Public routes are client-rendered after the Vite entry document loads; Vercel rewrites application routes to `index.html`. Authentication, PayPal purchases, referrals, dashboard, and admin features are protected by existing route guards and backend middleware.

Confirmed issues fixed:

- Checkout paths below `/tests/:slug/checkout` were not covered by the noindex rule.
- Client canonical URLs retained query strings and inconsistent trailing slashes.
- Route metadata used generic fallbacks and did not set all social metadata consistently.
- The initial HTML title and description did not use the approved homepage SEO proposal.
- The homepage had no structured data for the genuine brand/site entity.

Remaining limitation: because this is a client-rendered Vite SPA, route-specific metadata is not present in the initial HTML for non-home routes. The implementation updates it after JavaScript loads. Server rendering or a prerendering layer would be required to change that, and was intentionally not introduced because it would be an architecture migration.

## Changed files

- `frontend/src/components/Seo.tsx`: centralized titles, descriptions, robots, Open Graph/Twitter fields, safe JSON-LD serialization, and normalized absolute canonicals.
- `frontend/src/App.tsx`: added page-specific metadata, homepage Organization/WebSite JSON-LD, and complete private/checkout noindex matching.
- `frontend/index.html`: corrected initial homepage metadata, English language declaration, and canonical/social defaults.
- `frontend/public/robots.txt`: documented private route exclusions, checkout exclusion, API exclusion, and the canonical sitemap reference.
- `frontend/package.json`, `frontend/scripts/verify-seo.mjs`: added a repeatable static SEO verification command.

## Status

- Titles/descriptions: PASS for the homepage initial HTML and configured public routes after client render.
- Canonicals: PASS for normalized client-rendered route URLs; homepage initial HTML is canonical.
- Sitemap: PASS for the existing real public routes listed; no invented editorial URLs were added.
- robots.txt: PASS by static validation; production reachability requires deployment verification.
- Indexing rules: PASS for private, admin, result, attempt, auth, and checkout paths.
- Structured data: PASS for homepage Organization/WebSite and fetched public assessment Quiz data; no ratings, reviews, credentials, or fabricated offers were added.
- Internal links: PASS; existing semantic React Router links were preserved.
- Images: NOT TESTED for compression or responsive source generation; no visual assets were changed.
- Performance: NOT TESTED with Lighthouse or field data.
- International SEO: PASS for English `lang`; no unsupported Arabic or hreflang pages were added.
- Search Console: BLOCKED until authorized account access and production verification are available.

## Keyword and editorial recommendations

Use the homepage for self-awareness and personal growth discovery intent; use `/tests` for assessment discovery intent; use each real `/tests/:slug` page for its specific assessment intent. Avoid creating overlapping generic pages. A future resources section could cover self-awareness, self-reflection, and journaling only through reviewed, original content; no articles were auto-published.

## Verification

Run from `frontend/`:

- `npm run verify:seo` — validates initial metadata, sitemap XML markers, canonical origin, duplicate URLs, and robots sitemap reference.
- `npm run build` — validates TypeScript and the production Vite build.
- `npm run lint` — validates configured frontend lint rules.

Run from `backend/`:

- `npm test -- --runInBand` — validates backend tests where local dependencies and environment support them.

Production HTTP status, redirects, Search Console, analytics, Vercel deployment, and Core Web Vitals require access to the deployed environment and were not changed automatically.

## Manual deployment and next steps

Review the diff, run the commands above, deploy through the existing Vercel project, then verify `/`, `/robots.txt`, `/sitemap.xml`, `/tests`, `/about`, and a real `/tests/:slug` URL in the deployed environment. Add `https://my-inner.com` to Search Console, submit `https://my-inner.com/sitemap.xml`, and use URL Inspection for the homepage and public assessment URLs. Over the next 30 days, prioritize production crawl checks, Search Console indexing review, image/LCP measurement, and human review of any future wellness editorial content.

## Phase 2: prerendering and production readiness

The Vite architecture now uses a small post-build prerender step rather than a framework migration. `scripts/prerender-seo.mjs` copies the built entry document into route directories and writes route-specific initial titles, descriptions, canonical URLs, Open Graph/Twitter metadata, English language, and robots directives. It generates nine public shells matching the current public sitemap routes and ten fixed private/noindex shells. Public assessment metadata is fetched from `VITE_API_BASE_URL` during the build when available; if the public API is unavailable, the generator uses the repository's existing seeded assessment copy and logs that fallback.

Dynamic private paths such as `/results/:attemptId` and `/attempts/:attemptId/*` cannot safely be materialized as files. `frontend/vercel.json` therefore adds `X-Robots-Tag: noindex, nofollow` headers for private route patterns while React retains its runtime noindex behavior. No user, payment, referral, token, or admin data is prerendered.

Phase 2 verification:

- PASS — `npm.cmd run build`: TypeScript and Vite build succeeded; prerender generated 9 public and 10 private shells.
- PASS — `npm.cmd run verify:seo`: validated 9 sitemap URLs, 9 public shells, unique title/description/canonical tags, and private noindex shells.
- PASS — `npm.cmd run verify:seo:http` against a local Vite production preview: validated 5 public and 4 private route responses. The script uses trailing-slash directory URLs because Vite preview serves generated directory indexes that way; Vercel clean URLs serve the same directories at their slashless production routes.
- PASS — `npm.cmd run lint`: configured frontend lint completed with warnings only.
- PASS — backend tests remain unchanged and were previously verified at 16 suites / 84 tests; rerun if backend code or deployment configuration changes.

Known limitation: this is metadata prerendering, not full React HTML rendering. The initial body remains the SPA root and public content still hydrates from JavaScript/API data. Full content SSR/prerendering would require a larger architecture change or a reliable unauthenticated API build integration.

## Phase 3: performance, share image and indexing fixes (2026-10-20)

Observed before this phase: the live site at https://my-inner.com still served the old title ("My Inner — Discover more about yourself"), so Phases 1–2 were not yet deployed.

Changes:

- Images: 10 background images converted from PNG to WebP (15.0 MB → 0.7 MB total; homepage hero 1.8 MB → 65 KB) with no visible quality loss. All references in `src/` and `index.css` now point to the `.webp` files. The original PNGs are kept in `public/` and can be deleted after deployment is checked.
- Logo: a 256 px `my-inner-logo.webp` replaces the 654 KB 1254 px PNG wherever the logo is displayed. Added `favicon-48.png`, `apple-touch-icon.png` (180 px) and `logo-512.png` (used for Organization structured data).
- Share image: new `og-image.jpg` (1200×630, 85 KB) with the brand name and tagline, plus `og:image:width/height`. Previously the share image was a 1.8 MB text-free background.
- LCP: the homepage prerendered shell preloads `hero-background.webp` with `fetchpriority="high"` (the hero is a CSS background the browser discovers late).
- JavaScript: dashboard, profile, results, test runner, checkout (PayPal) and admin screens are lazy-loaded. JavaScript loaded by public pages fell from 544 KB to 344 KB (148 → 107 KB gzip).
- Structured data: Organization/WebSite (homepage) and Quiz (each assessment) JSON-LD is now in the initial HTML, using the same `data-seo-jsonld` marker so React replaces it rather than duplicating it.
- Sitemap: `dist/sitemap.xml` is now generated at build time from the same public route list, with `lastmod` dates, so new assessments are included automatically.
- Soft 404s: unknown URLs and unknown assessment slugs are now `noindex` with the title "Page Not Found | My Inner" (the SPA rewrite returns HTTP 200 for them).
- robots.txt: removed `Disallow` for login, register, password reset and checkout pages. These pages carry `noindex`; blocking them in robots.txt prevented Google from seeing that directive. Admin, dashboard, profile, results, attempts and API stay blocked.

Verification (Linux build of the same sources): `npm run build` PASS, `npm run verify:seo` PASS (now also checks sitemap lastmod, homepage JSON-LD, hero preload and new assets), oxlint warnings only (pre-existing), headless Chromium check of `/`, `/about`, `/login` and an unknown URL: correct titles and robots values, no failed asset requests, no JS errors.

Still required after deploy: confirm on Vercel that `/about` serves the prerendered `about/index.html` (view source must show the About title), add the site to Google Search Console, submit the sitemap, and run PageSpeed Insights on the homepage.

## Phase 4: Articles (blog) managed from the admin dashboard (2026-10-20)

The client can now write and publish articles from Admin → Articles without developer involvement.

- Public pages: `/blog` (article list) and `/blog/:slug` (article with breadcrumb, reading time, a "Take the test" box for the related test, and "More to read" links). "Articles" was added to the header, mobile menu and footer.
- Admin: list, create, edit, publish, unpublish and delete. The editor has a formatting toolbar (headings, bold, lists, quote, link), a live preview, a Google result preview, character counters for title and summary, cover image upload with alt text, a related-test selector and short SEO writing tips.
- Content is stored as Markdown and sanitized with DOMPurify before rendering, so scripts and unsafe attributes in article text never execute.
- SEO: each article gets its own title, description, canonical URL, cover image for sharing, and BlogPosting + BreadcrumbList structured data. Unknown or unpublished article URLs are `noindex`.
- Build: `prerender-seo.mjs` fetches published articles from the API and writes a prerendered HTML page per article, and adds `/blog` and every article (with its last-edited date) to `sitemap.xml`.
- Automatic rebuild (optional): when `VERCEL_DEPLOY_HOOK_URL` is set on the backend, publishing, editing a live article, unpublishing or deleting triggers a frontend rebuild, so the prerendered page and sitemap update within about 2 minutes. Without it, articles are still live immediately; only the prerendered page waits for the next deploy.

Backend: new `Article` model, `GET /api/articles`, `GET /api/articles/:slug`, and admin CRUD under `/api/admin/articles` (protected by the existing admin auth and audit log). Validation enforces a 50–170 character summary, at least 300 characters of body text, a clean URL slug, and safe image URLs.

Verification: backend `tsc` PASS and `jest` 97/97 PASS (13 new tests for validation and publish logic). Frontend build, `verify:seo` and oxlint PASS (warnings only, same patterns as existing code). Headless Chromium end-to-end run against a mock API following the same contract: create → preview → publish → list → public page → related test box → unpublish → delete, plus SEO tags, sanitization of injected script/onerror, external link `rel`, 404 + noindex for a missing article, and mobile layout. Not run against a real MongoDB in this environment.

Deployment steps: deploy backend and frontend as usual; optionally create a Deploy Hook in the Vercel frontend project (Settings → Git → Deploy Hooks) and set it as `VERCEL_DEPLOY_HOOK_URL` in the backend project's environment variables.

## Phase 5: crawlable content, guides and AEO/GEO foundation (2026-11-12)

Implements the "My Inner Global SEO, AEO & GEO Master Brief" against the real stack (Vite + React SPA, Express API, Vercel).

Findings from the audit of `main`:

- Pages shipped an empty `<div id="root">`: titles/meta were prerendered, but no body text reached crawlers that do not run JavaScript (Bing, most AI crawlers). Test pages also had very little indexable copy (a description and three bullets).
- The blog was half-wired: `Blog.tsx`/`ArticlePage.tsx` and the admin API existed, but `/blog` and `/blog/:slug` had no routes (the nav link showed the 404 page) and the public `/api/articles` router was not mounted. The Phase 4 prerender/sitemap code for articles was also missing from `scripts/prerender-seo.mjs`, so `npm run verify:seo` was already failing on `main`.

Changes:

- `src/seo/siteContent.ts` (new): single source of truth for per-test landing copy (direct answer, what it explores, what it does not do, who it is for, FAQs), five guides, titles/descriptions, BreadcrumbList and Article JSON-LD helpers. No invented studies, ratings or credentials; non-clinical limits stated on every page.
- `src/components/SeoContent.tsx` (new): shared presentational components used in the browser and at build time.
- `src/prerender-entry.tsx` + `scripts/prerender-seo.mjs`: the build now also bundles an SSR entry (`vite build --ssr`) and injects the real page body into each prerendered shell (home, tests hub, five tests, guides hub, five guides, blog index, published articles). React replaces it on load. Question count and price are read from the API at build time and omitted if the API is unreachable (price falls back to the seeded $4.99).
- New public routes `/guides` and `/guides/:slug`; `/blog` and `/blog/:slug` restored; `Guides` link in the footer; keyword-aligned titles/descriptions; Quiz + BreadcrumbList on tests, Article + BreadcrumbList on guides, BlogPosting + BreadcrumbList on articles.
- `backend/src/app.ts`: mounts the existing public `articlesRouter` at `/api/articles`.
- `public/robots.txt`: explicit `OAI-SearchBot` group (private-area rules repeated, because a named group overrides `*`); `GPTBot` deliberately left unset.
- `scripts/verify-seo.mjs`: now also checks minimum crawlable word count and a single H1 per key page, guide routes, and robots private-area rules.
- Sitemap now includes guides and (when the API is reachable at build time) the blog and every published article.

Verification: `npm run build` PASS, `npm run verify:seo` PASS (15 sitemap URLs, 16 prerendered public routes), `tsc` PASS, backend `tsc` + 22 suites / 124 tests PASS, headless Chromium check against a mocked API (metadata, noindex on unknown test/guide URLs, no console errors, no mobile overflow).

Not verified (no access from this environment): live production behaviour, www/apex redirect, Search Console/Bing status, Core Web Vitals, real MongoDB data.

Owner decisions and actions are listed in the pull request / hand-off message.
