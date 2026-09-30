import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TestsApi } from '../api/endpoints';
import { PublicTest } from '../types';
import { TestIcon } from '../components/TestIcon';

function LineIcon({ type }: { type: 'lock' | 'spark' | 'shield' | 'search' | 'pen' }) {
  const paths = { lock: <><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /><path d="M12 14v3" /></>, spark: <><path d="m12 2 1.7 6.3L20 10l-6.3 1.7L12 18l-1.7-6.3L4 10l6.3-1.7Z" /><path d="m19 17 .7 2.3L22 20l-2.3.7L19 23l-.7-2.3L16 20l2.3-.7Z" /></>, shield: <><path d="M12 3 20 6v5c0 5-3.4 8.2-8 10-4.6-1.8-8-5-8-10V6Z" /><path d="m8.5 12 2.2 2.2 4.8-5" /></>, search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 5 5" /></>, pen: <><path d="m4 20 3.8-.8L19 8a2.1 2.1 0 0 0-3-3L4.8 16.2Z" /><path d="m14.5 6.5 3 3" /></> };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-6 w-6" aria-hidden="true">{paths[type]}</svg>;
}

const testColors = ['bg-[#f4edf7]', 'bg-[#f0f4f0]', 'bg-[#fbf0f0]', 'bg-[#eff1f8]', 'bg-[#fff5e9]', 'bg-[#f2eff8]', 'bg-[#edf5f2]'];
const testSymbols = [
  <TestIcon key="mbti" slug="mbti-style" className="h-6 w-6" />,
  <TestIcon key="inner-child" slug="inner-child" className="h-6 w-6" />,
  <TestIcon key="love" slug="five-love-languages" className="h-6 w-6" />,
  <TestIcon key="cube" slug="cube-personality" className="h-6 w-6" />,
  <TestIcon key="animal" slug="hidden-animal" className="h-6 w-6" />
];

export function Landing() {
  const [tests, setTests] = useState<PublicTest[]>([]);
  useEffect(() => { TestsApi.list().then((res) => setTests(res.tests)).catch(() => undefined); }, []);

  return <div className="landing-page bg-[#fbfaf8] text-[#302447]">
    <section className="landing-hero relative overflow-hidden border-b border-[#ebe4e8] bg-[#fbf4f4] bg-cover bg-center px-5 pb-14 pt-14 sm:pb-20 sm:pt-20" style={{ backgroundImage: "url('/hero-background.png')" }}>
      <div className="absolute inset-0 bg-white/10" />
      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="max-w-xl"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#765c8d]">A space to look within</p><h1 className="mt-5 max-w-xl font-serif text-5xl leading-[1.02] tracking-tight text-[#283452] sm:text-7xl">Discover more<br />about yourself.</h1><p className="mt-6 max-w-lg text-lg leading-8 text-[#5e6170]">Explore thoughtfully designed assessments that help you understand your personality, emotions, relationships, and the way you see yourself.</p><div className="mt-8 flex flex-wrap gap-3"><Link to="/tests" className="rounded-full bg-[#765c8d] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#765c8d]/20 transition hover:-translate-y-0.5 hover:bg-[#634a78]">Explore Tests <span className="ml-2">→</span></Link><a href="#how-it-works" className="rounded-full border border-[#bcaec5] px-6 py-3.5 text-sm font-semibold text-[#4d4162] transition hover:bg-white/80">How It Works</a></div></div>
      </div>
    </section>

    <section className="border-y border-[#ebe4e8] bg-white/65"><div className="mx-auto grid max-w-6xl gap-6 px-5 py-7 sm:grid-cols-3 sm:gap-0"><div className="flex items-start gap-4 border-[#ebe4e8] sm:border-r sm:px-7 first:sm:pl-0"><span className="rounded-full bg-[#f1eaf4] p-3 text-[#5c4772]"><LineIcon type="lock" /></span><div><h2 className="font-semibold">Private & Personal</h2><p className="mt-1 text-sm leading-5 text-[#737080]">Your results are saved securely to your account.</p></div></div><div className="flex items-start gap-4 border-[#ebe4e8] sm:border-r sm:px-7"><span className="rounded-full bg-[#f1eaf4] p-3 text-[#5c4772]"><LineIcon type="spark" /></span><div><h2 className="font-semibold">Thoughtfully Designed</h2><p className="mt-1 text-sm leading-5 text-[#737080]">Assessments built around structured questions and scoring.</p></div></div><div className="flex items-start gap-4 sm:pl-7"><span className="rounded-full bg-[#f1eaf4] p-3 text-[#5c4772]"><LineIcon type="shield" /></span><div><h2 className="font-semibold">Clear Results</h2><p className="mt-1 text-sm leading-5 text-[#737080]">Understand your result through a focused personal report.</p></div></div></div></section>

    <section className="mx-auto max-w-6xl px-5 py-16 sm:py-20"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#765c8d]">Explore our tests</p><h2 className="mt-3 font-serif text-4xl tracking-tight text-[#283452]">Explore Your Inner World</h2><p className="mt-3 text-[#737080]">Choose an assessment that helps you discover something new about yourself.</p><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{tests.map((test, index) => <Link key={test.id} to={`/tests/${test.slug}`} className={`group rounded-2xl border border-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${testColors[index % testColors.length]}`}><span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/75 font-serif text-2xl text-[#765c8d]">{testSymbols[index % testSymbols.length]}</span><h3 className="mt-5 min-h-12 font-serif text-lg leading-5">{test.name}</h3><p className="mt-2 line-clamp-2 text-sm leading-5 text-[#686778]">{test.description}</p><p className="mt-4 text-sm font-semibold">${(test.price.amount / 100).toFixed(2)} <span className="font-normal text-[#8a8792]">USD</span></p><span className="mt-4 inline-flex rounded-full bg-[#765c8d] px-4 py-2 text-xs font-semibold text-white transition group-hover:bg-[#634a78]">Explore Test →</span></Link>)}</div>{tests.length === 0 && <p className="mt-8 text-sm text-[#737080]">Loading assessments...</p>}</section>

    <section id="how-it-works" className="border-y border-[#ebe4e8] bg-white/65"><div className="mx-auto max-w-6xl px-5 py-16 sm:py-20"><h2 className="font-serif text-3xl tracking-tight text-[#283452]">How My Inner Works</h2><div className="mt-10 grid gap-8 md:grid-cols-3">{[['01', 'Choose Your Test', 'Explore assessments designed to help you understand different parts of yourself.', 'search'], ['02', 'Answer Honestly', 'Move through thoughtfully structured questions at your own pace.', 'pen'], ['03', 'Discover Your Result', 'Receive a clear, personalized result based on your answers.', 'spark']].map(([number, title, copy, icon], index) => <div key={number} className="relative flex gap-4 md:block"><div className="flex items-center gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f1eaf4] font-serif text-lg text-[#765c8d]">{number}</span><span className="rounded-full bg-white p-3 text-[#765c8d] shadow-sm"><LineIcon type={icon as 'search' | 'pen' | 'spark'} /></span></div><h3 className="mt-4 font-serif text-lg">{title}</h3><p className="mt-2 max-w-xs text-sm leading-6 text-[#737080]">{copy}</p>{index < 2 && <span className="absolute right-4 top-6 hidden text-2xl text-[#bcaec5] md:block">→</span>}</div>)}</div></div></section>

    <section className="mx-auto max-w-6xl px-5 py-12"><div className="grid items-center overflow-hidden rounded-3xl border border-white bg-gradient-to-r from-[#f3e9ed] via-[#fbf5f3] to-[#f1ebf5] shadow-sm md:grid-cols-2"><div className="hidden h-48 bg-[radial-gradient(circle_at_30%_40%,#d7c3dd_0_8%,transparent_9%),linear-gradient(135deg,#dce5df,#f7e9ed)] md:block" /><div className="px-7 py-9 sm:px-12"><h2 className="font-serif text-3xl leading-tight text-[#283452]">There is more to discover<br />within you.</h2><p className="mt-3 max-w-md text-sm leading-6 text-[#686778]">Each test offers a unique perspective, helping you uncover new insights and embrace your true self.</p><Link to="/tests" className="mt-5 inline-block rounded-full bg-[#765c8d] px-5 py-2.5 text-xs font-semibold text-white">Explore All Tests →</Link></div></div></section>

    <section className="border-y border-[#ebe4e8] bg-[#f5edf1] px-5 py-14 text-center"><h2 className="font-serif text-3xl text-[#283452]">Ready to discover more about yourself?</h2><p className="mt-2 text-sm text-[#737080]">Start with an assessment and take a closer look within.</p><Link to="/tests" className="mt-5 inline-block rounded-full bg-[#765c8d] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#765c8d]/20">Explore Tests →</Link></section>

    <footer className="mx-auto flex max-w-6xl flex-col gap-5 px-5 py-8 text-sm text-[#737080] sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-2 font-serif text-lg text-[#302447]"><img src="/my-inner-logo.png" alt="" className="h-10 w-10 object-contain object-top" />My Inner</div><p>Self-discovery. Understanding. Growth.</p><p className="text-xs">© 2026 My Inner. All rights reserved.</p></footer>
  </div>;
}
