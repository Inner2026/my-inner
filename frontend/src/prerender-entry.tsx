// Build-time only entry (bundled with `vite build --ssr`). Renders the crawlable body of each public
// page to a static HTML string; scripts/prerender-seo.mjs injects it into the page shell.
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router';
import { GuideArticle, GuidesIndex, HomeSeoSections, HubSeoSection, TestLandingBody, TestSummary } from './components/SeoContent';
import { guideBySlug, testContent, publicTestSlugs } from './seo/siteContent';
import { Link } from 'react-router-dom';

export * from './seo/siteContent';

const wrap = (path: string, node: React.ReactNode) => renderToString(<StaticRouter location={path}>{node}</StaticRouter>);

const Shell = ({ eyebrow, title, intro, children }: { eyebrow?: string; title: string; intro?: string; children?: React.ReactNode }) => <div className="min-h-[60vh] bg-[#faf9f7] px-4 py-10 sm:px-8"><div className="mx-auto max-w-5xl">
  {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#765c8d]">{eyebrow}</p>}
  <h1 className="mt-4 font-serif text-4xl tracking-tight text-[#283452] sm:text-5xl">{title}</h1>
  {intro && <p className="mt-4 max-w-3xl text-base leading-7 text-[#62596c]">{intro}</p>}
  {children}
</div></div>;

export function renderHome(): string {
  return wrap('/', <><Shell title="Discover more about yourself." intro="Explore thoughtfully designed assessments that help you understand your personality, emotions, relationships, and the way you see yourself."><div className="mt-6"><Link to="/tests" className="rounded-full bg-[#765c8d] px-6 py-3 text-sm font-semibold text-white">Explore tests</Link></div></Shell><div className="bg-[#fbfaf8]"><HomeSeoSections /></div></>);
}

export function renderTests(tests: TestSummary[]): string {
  return wrap('/tests', <Shell eyebrow="Self-discovery tests" title="Personality and self-discovery tests" intro="Choose an assessment that helps you discover something new about yourself.">
    <ul className="mt-8 grid gap-4 sm:grid-cols-2">{tests.map((test) => <li key={test.slug}><Link to={`/tests/${test.slug}`} className="block rounded-2xl border border-[#eee5e9] bg-white p-5"><span className="font-serif text-xl text-[#302447]">{test.name}</span>{testContent[test.slug] && <span className="mt-2 block text-sm leading-6 text-[#737080]">{testContent[test.slug].seoDescription}</span>}</Link></li>)}</ul>
    <HubSeoSection />
  </Shell>);
}

export function renderTest(test: TestSummary, description: string): string | null {
  if (!testContent[test.slug]) return null;
  return wrap(`/tests/${test.slug}`, <Shell eyebrow="Self-reflection test" title={test.name.replace(' Test', '')} intro={description}><TestLandingBody test={test} /></Shell>);
}

export function renderGuides(): string { return wrap('/guides', <GuidesIndex />); }
export function renderGuide(slug: string): string | null { const guide = guideBySlug(slug); return guide ? wrap(`/guides/${slug}`, <GuideArticle guide={guide} />) : null; }
export { publicTestSlugs };
