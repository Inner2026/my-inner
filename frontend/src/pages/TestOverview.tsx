import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TestsApi } from '../api/endpoints';
import { PublicTest } from '../types';
import { TestIcon } from '../components/TestIcon';
import { LoadingScreen } from '../components/LoadingScreen';

const backgrounds: Record<string, string> = {
  'mbti-style': '/test-backgrounds/mbti-style.png',
  'inner-child': '/test-backgrounds/inner-child.png',
  'five-love-languages': '/test-backgrounds/five-love-languages.png',
  'hidden-animal': '/test-backgrounds/hidden-animal.png',
  'cube-personality': '/test-backgrounds/cube-personality.png'
};

const wideBackgrounds = new Set(['mbti-style', 'cube-personality']);

const labels: Record<string, string> = {
  'mbti-style': 'Personality Test',
  'inner-child': 'Healing Test',
  'five-love-languages': 'Relationship Test',
  'hidden-animal': 'Personality Test',
  'cube-personality': 'Personality Test'
};

const discoveries: Record<string, string[]> = {
  'mbti-style': ['Your natural personality type', 'How you think, feel, and make decisions', 'How you relate to others and the world'],
  'inner-child': ['Your inner child’s core needs', 'Unresolved emotions and patterns', 'Ways to heal and give yourself what you needed'],
  'five-love-languages': ['Your primary love language', 'How you give and receive love', 'Tips for stronger, healthier relationships'],
  'hidden-animal': ['Your hidden animal', 'Key personality traits and strengths', 'How you handle challenges and change'],
  'cube-personality': ['Your symbolic cube type', 'Your emotional and creative perspective', 'How you see yourself and your inner world']
};

export function TestOverview() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [test, setTest] = useState<PublicTest | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) TestsApi.getBySlug(slug).then((res) => setTest(res.test)).catch((err) => setError(err.message));
  }, [slug]);

  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;
  if (!test) return <LoadingScreen message="Opening your assessment..." detail="We’re bringing the details into focus." />;

  const items = discoveries[test.slug] ?? discoveries['mbti-style'];
  return <div className="min-h-[calc(100vh-74px)] bg-[#faf9f7] px-4 py-6 sm:px-8 sm:py-10">
    <div className="mx-auto max-w-6xl"><button onClick={() => navigate('/tests')} className="text-xs font-medium text-[#765c8d]">← Back to Tests</button>
      <section className={`test-overview-hero relative mt-5 overflow-hidden rounded-[1.75rem] border border-white bg-[#fffdfb] shadow-[0_18px_60px_rgba(73,57,88,0.08)] sm:rounded-[2rem] ${wideBackgrounds.has(test.slug) ? 'aspect-[4/5] sm:aspect-[8/3]' : 'aspect-[4/5] sm:aspect-[16/9]'}`} style={{ backgroundImage: `url(${test.imageUrl || backgrounds[test.slug] || backgrounds['mbti-style']})`, backgroundRepeat: 'no-repeat' }}>
        <div className="test-overview-overlay absolute inset-0 bg-gradient-to-r from-white/55 via-transparent to-transparent" />
        <div className="test-overview-content relative flex h-full max-w-[90%] flex-col justify-center p-6 sm:max-w-[48%] sm:p-12">
          <div className="flex w-fit items-center gap-2 rounded-full border border-[#e8dfed] bg-white/75 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#765c8d] shadow-sm"><TestIcon slug={test.slug} className="h-3.5 w-3.5" /> {labels[test.slug] ?? 'Self-Reflection Test'}</div>
          <h1 className="mt-5 max-w-md font-serif text-4xl leading-[0.98] tracking-tight text-[#283452] sm:text-6xl">{test.name.replace(' Test', '')}</h1>
          <p className="mt-5 max-w-md text-sm leading-6 text-[#566078] sm:text-base">{test.description}</p>
          <div className="mt-6 flex flex-wrap gap-3 text-xs font-medium text-[#667083]"><span className="rounded-full bg-white/75 px-3 py-2 shadow-sm">◷ 10–25 minutes</span><span className="rounded-full bg-white/75 px-3 py-2 shadow-sm">☷ {test.questionCount} questions</span><span className="rounded-full bg-white/75 px-3 py-2 shadow-sm">✦ Self-assessment</span></div>
          <button onClick={() => navigate(`/tests/${test.slug}/checkout`)} disabled={!test.available} className="mt-8 w-fit rounded-full bg-[#354579] px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#354579]/20 transition hover:-translate-y-0.5 hover:bg-[#283760] disabled:cursor-not-allowed disabled:opacity-50">{test.available ? 'Start Test  →' : 'Coming Soon'}</button>
        </div>
      </section>
      <section className="mt-8 rounded-[2rem] border border-[#eee7ed] bg-white p-7 shadow-[0_14px_45px_rgba(73,57,88,0.06)] sm:p-10"><div className="grid gap-8 md:grid-cols-[1fr_.7fr]"><div><h2 className="font-serif text-2xl text-[#283452] sm:text-3xl">What You’ll Discover</h2><div className="mt-6 space-y-4">{items.map((item) => <p key={item} className="flex items-center gap-3 text-sm text-[#687184]"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f5eaf2] text-[#bd7891]">♡</span>{item}</p>)}</div></div><div className="flex items-center border-l border-[#eee5ed] px-5 text-center md:justify-center"><p className="max-w-xs font-serif text-lg leading-7 text-[#69728c]">Take a moment to look within.<br /><span className="text-[#bd7891]">Your answers are uniquely yours.</span></p></div></div></section>
    </div>
  </div>;
}
