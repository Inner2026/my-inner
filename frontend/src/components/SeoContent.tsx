import { Link } from 'react-router-dom';
import { Faq, Guide, guideBySlug, guides, homeFaqs, testContent, publicTestSlugs } from '../seo/siteContent';

// Pure presentational components (no data fetching, no browser APIs) so they can be rendered both
// in the browser and to static HTML at build time for crawlers that do not run JavaScript.

const eyebrow = 'text-xs font-semibold uppercase tracking-[0.2em] text-[#765c8d]';
const h2 = 'mt-3 font-serif text-2xl tracking-tight text-[#283452] sm:text-3xl';
const body = 'text-sm leading-7 text-[#62596c] sm:text-base';
const card = 'rounded-[1.75rem] border border-[#eee7ed] bg-white p-6 shadow-[0_14px_45px_rgba(73,57,88,0.06)] sm:p-8';

export type TestSummary = { slug: string; name: string; questionCount?: number; priceCents?: number; currency?: string };

const shortName = (slug: string, fallback = '') => testContent[slug]?.seoTitle.split(' | ')[0] ?? fallback;

export function formatPrice(priceCents?: number, currency = 'usd') {
  if (typeof priceCents !== 'number') return undefined;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase() }).format(priceCents / 100);
}

export function FaqList({ faqs, title = 'Frequently asked questions' }: { faqs: Faq[]; title?: string }) {
  return <section aria-labelledby="faq-heading" className={card}>
    <h2 id="faq-heading" className="font-serif text-2xl tracking-tight text-[#283452] sm:text-3xl">{title}</h2>
    <div className="mt-6 space-y-6">{faqs.map((faq) => <div key={faq.q}><h3 className="font-semibold text-[#302447]">{faq.q}</h3><p className={`mt-2 ${body}`}>{faq.a}</p></div>)}</div>
  </section>;
}

function BulletList({ items }: { items: string[] }) {
  return <ul className="mt-4 space-y-3">{items.map((item) => <li key={item} className={`flex gap-3 ${body}`}><span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#bd7891]" /><span>{item}</span></li>)}</ul>;
}

/** Crawlable explanatory content shown beneath the hero on every assessment page. */
export function TestLandingBody({ test }: { test: TestSummary }) {
  const content = testContent[test.slug];
  if (!content) return null;
  const price = formatPrice(test.priceCents, test.currency);
  const facts: Array<[string, string]> = [['Format', 'Online self-assessment']];
  if (typeof test.questionCount === 'number' && test.questionCount > 0) facts.push(['Questions', String(test.questionCount)]);
  facts.push(['Time', 'About 10–25 minutes']);
  if (price) facts.push(['Price', `${price} per test`]);
  facts.push(['Result', 'Personal written result saved to your account']);
  const related = content.relatedTests.filter((slug) => slug !== test.slug && testContent[slug]);
  const relatedGuides = content.guides.map((slug) => guideBySlug(slug)).filter((guide): guide is Guide => Boolean(guide));
  return <div className="mt-8 space-y-8">
    <section aria-labelledby="about-test" className={card}>
      <p className={eyebrow}>About this test</p>
      <h2 id="about-test" className={h2}>What is the {test.name}?</h2>
      <p className={`mt-4 ${body}`}>{content.answer}</p>
      <dl className="mt-6 grid gap-4 sm:grid-cols-2">{facts.map(([label, value]) => <div key={label} className="rounded-2xl bg-[#faf6f9] px-5 py-4"><dt className="text-xs font-semibold uppercase tracking-[0.14em] text-[#765c8d]">{label}</dt><dd className="mt-1 text-sm text-[#302447]">{value}</dd></div>)}</dl>
    </section>
    <div className="grid gap-8 md:grid-cols-2">
      <section aria-labelledby="explores" className={card}><h2 id="explores" className="font-serif text-xl text-[#283452] sm:text-2xl">What it explores</h2><BulletList items={content.explores} /></section>
      <section aria-labelledby="does-not" className={card}><h2 id="does-not" className="font-serif text-xl text-[#283452] sm:text-2xl">What it does not do</h2><BulletList items={content.doesNot} /></section>
    </div>
    <section aria-labelledby="best-for" className={card}><h2 id="best-for" className="font-serif text-xl text-[#283452] sm:text-2xl">Who it is for</h2><BulletList items={content.bestFor} /></section>
    <FaqList faqs={content.faqs} title={`${test.name}: frequently asked questions`} />
    <section aria-labelledby="keep-exploring" className={card}>
      <h2 id="keep-exploring" className="font-serif text-xl text-[#283452] sm:text-2xl">Keep exploring</h2>
      <ul className="mt-4 space-y-2 text-sm">
        {relatedGuides.map((guide) => <li key={guide.slug}><Link to={`/guides/${guide.slug}`} className="font-medium text-[#765c8d] underline-offset-4 hover:underline">Guide: {guide.title}</Link></li>)}
        {related.map((slug) => <li key={slug}><Link to={`/tests/${slug}`} className="font-medium text-[#765c8d] underline-offset-4 hover:underline">Also try: {shortName(slug)}</Link></li>)}
        <li><Link to="/tests" className="font-medium text-[#765c8d] underline-offset-4 hover:underline">All My Inner tests</Link></li>
      </ul>
      <p className="mt-6 border-t border-[#eee5ed] pt-4 text-xs leading-5 text-[#8b8190]">My Inner assessments are designed for self-reflection and education. They are not diagnostic, clinical or standardized psychological instruments and are not a substitute for professional advice.</p>
    </section>
  </div>;
}

/** Crawlable overview content for the homepage, shown below the existing sections. */
export function HomeSeoSections() {
  return <div className="mx-auto max-w-6xl space-y-8 px-5 py-14">
    <section aria-labelledby="home-about" className={card}>
      <p className={eyebrow}>Online personality and self-discovery tests</p>
      <h2 id="home-about" className={h2}>Understand your personality, emotions and relationships</h2>
      <p className={`mt-4 max-w-3xl ${body}`}>My Inner offers online self-discovery assessments that help you reflect on how you think, feel and connect with others. Each test gives you a personal written result you can revisit in your account. The tests are designed for self-reflection and personal growth; they are not clinical or diagnostic tools.</p>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2">{publicTestSlugs.map((slug) => <li key={slug}><Link to={`/tests/${slug}`} className="block rounded-2xl border border-[#eee5ed] px-5 py-4 transition hover:border-[#d9cedd]"><span className="font-serif text-lg text-[#302447]">{shortName(slug)}</span><span className="mt-1 block text-sm leading-6 text-[#737080]">{testContent[slug].explores[0]}</span></Link></li>)}</ul>
    </section>
    <section aria-labelledby="home-guides" className={card}>
      <h2 id="home-guides" className="font-serif text-2xl text-[#283452] sm:text-3xl">Guides to understanding yourself</h2>
      <ul className="mt-5 grid gap-3 sm:grid-cols-2">{guides.map((guide) => <li key={guide.slug}><Link to={`/guides/${guide.slug}`} className="font-medium text-[#765c8d] underline-offset-4 hover:underline">{guide.title}</Link></li>)}</ul>
      <p className="mt-5 text-sm"><Link to="/guides" className="font-semibold text-[#765c8d]">All guides →</Link></p>
    </section>
    <FaqList faqs={homeFaqs} title="About My Inner: common questions" />
  </div>;
}

/** Extra copy for the /tests hub. */
export function HubSeoSection() {
  return <section aria-labelledby="hub-about" className={`mx-auto mt-12 max-w-4xl ${card}`}>
    <h2 id="hub-about" className="font-serif text-2xl text-[#283452] sm:text-3xl">Choosing a self-discovery test</h2>
    <p className={`mt-4 ${body}`}>Each My Inner test looks at yourself from a different angle. If you want to understand your preferences and communication style, start with the 16 Personality Types Test. To explore how you give and receive affection, try the Five Love Languages Test. For emotional reflection, the Inner Child Self-Reflection Test offers prompts about safety, self-worth and trust. The Cube and Hidden Animal tests are playful, symbolic exercises made for fun and reflection.</p>
    <p className={`mt-4 ${body}`}>All tests are self-assessments for personal growth. None is a diagnosis or a standardized psychological test. New to personality tests? Read <Link to="/guides/how-do-personality-tests-work" className="font-medium text-[#765c8d] underline-offset-4 hover:underline">how personality tests work and how accurate they are</Link>.</p>
  </section>;
}

export function GuidesIndex() {
  return <div className="px-4 py-12 sm:px-8 sm:py-16"><div className="mx-auto max-w-4xl">
    <div className="text-center"><p className={eyebrow}>Guides</p><h1 className="mt-4 font-serif text-4xl tracking-tight text-[#283452] sm:text-5xl">Guides for understanding yourself</h1><p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[#62596c]">Plain-language explanations of personality tests, relationship frameworks and self-reflection, with honest notes about what each can and cannot tell you.</p></div>
    <ul className="mt-10 space-y-4">{guides.map((guide) => <li key={guide.slug}><Link to={`/guides/${guide.slug}`} className="group block rounded-2xl border border-[#eee5e9] bg-white p-6 transition hover:border-[#d9cedd]"><h2 className="font-serif text-xl text-[#302447] group-hover:text-[#765c8d]">{guide.title}</h2><p className="mt-2 text-sm leading-6 text-[#737080]">{guide.description}</p></Link></li>)}</ul>
  </div></div>;
}

export function GuideArticle({ guide }: { guide: Guide }) {
  return <div className="bg-[#fcfaf9] px-4 py-8 sm:px-8 sm:py-12"><article className="mx-auto max-w-3xl">
    <nav aria-label="Breadcrumb" className="text-xs text-[#9a90a5]"><Link to="/" className="hover:text-[#765c8d]">Home</Link><span className="mx-2">/</span><Link to="/guides" className="hover:text-[#765c8d]">Guides</Link></nav>
    <header className="mt-6"><h1 className="font-serif text-4xl leading-tight tracking-tight text-[#283452] sm:text-5xl">{guide.title}</h1><p className="mt-4 text-sm text-[#9a90a5]">By My Inner · Updated <time dateTime="2026-11-12">12 November 2026</time></p></header>
    <p className="mt-8 rounded-2xl border border-[#eee5ed] bg-white p-6 text-base leading-8 text-[#302447]"><strong className="font-semibold">In short: </strong>{guide.summary}</p>
    {guide.sections.map((section) => <section key={section.heading} className="mt-10"><h2 className="font-serif text-2xl text-[#283452]">{section.heading}</h2>{section.paragraphs.map((paragraph) => <p key={paragraph} className={`mt-4 ${body}`}>{paragraph}</p>)}{section.bullets && <BulletList items={section.bullets} />}</section>)}
    {guide.faqs && <div className="mt-12"><FaqList faqs={guide.faqs} title="Common questions" /></div>}
    {guide.further && <section className="mt-12"><h2 className="font-serif text-xl text-[#283452]">Further reading</h2><ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-[#62596c]">{guide.further.map((item) => <li key={item}>{item}</li>)}</ul></section>}
    <aside className="mt-12 rounded-[1.75rem] border border-white bg-gradient-to-r from-[#f3e9ed] via-[#fbf5f3] to-[#f1ebf5] p-7 sm:p-9">
      <p className={eyebrow}>Try it yourself</p>
      <ul className="mt-4 space-y-2 text-sm">{guide.tests.map((slug) => <li key={slug}><Link to={`/tests/${slug}`} className="font-semibold text-[#765c8d] underline-offset-4 hover:underline">{shortName(slug)} →</Link></li>)}</ul>
      {guide.related.length > 0 && <><p className="mt-6 text-xs font-semibold uppercase tracking-[0.14em] text-[#765c8d]">Related guides</p><ul className="mt-2 space-y-2 text-sm">{guide.related.map((slug) => guideBySlug(slug)).filter((item): item is Guide => Boolean(item)).map((item) => <li key={item.slug}><Link to={`/guides/${item.slug}`} className="text-[#62596c] underline-offset-4 hover:underline">{item.title}</Link></li>)}</ul></>}
    </aside>
    <p className="mt-8 text-xs leading-5 text-[#8b8190]">This guide is for general education and self-reflection. It is not medical, psychological or relationship advice. If you are concerned about your wellbeing, speak with a qualified professional.</p>
  </article></div>;
}
