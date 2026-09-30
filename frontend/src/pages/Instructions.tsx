import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AttemptsApi } from '../api/endpoints';
import { TestIcon } from '../components/TestIcon';
import { LoadingScreen } from '../components/LoadingScreen';

const tones: Record<string, { accent: string; soft: string; page: string; label: string }> = {
  'mbti-style': { accent: '#75639a', soft: '#f0ebf8', page: '#f7f4fb', label: 'MBTI personality test' },
  'inner-child': { accent: '#719b8d', soft: '#edf5f0', page: '#f4f8f5', label: 'Inner child reflection' },
  'five-love-languages': { accent: '#bd7891', soft: '#fff0f3', page: '#fff7f7', label: 'Five love languages' },
  'hidden-animal': { accent: '#c38b55', soft: '#fff3e5', page: '#fffaf3', label: 'The hidden animal' },
  'cube-personality': { accent: '#607fb2', soft: '#eef4ff', page: '#f5f8fd', label: 'Cube personality test' }
};

export function Instructions() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const [name, setName] = useState('Your assessment');
  const [slug, setSlug] = useState('mbti-style');
  const [questions, setQuestions] = useState(0);
  const [loading, setLoading] = useState(true);
  const tone = tones[slug] ?? tones['mbti-style'];

  useEffect(() => {
    if (!attemptId) return;
    Promise.all([AttemptsApi.get(attemptId), AttemptsApi.questions(attemptId)]).then(([attempt, questionSet]) => {
      const test = attempt.attempt?.testId;
      if (typeof test === 'object' && test) { setName(test.name || 'Your assessment'); setSlug(test.slug || 'mbti-style'); }
      setQuestions(questionSet.questions.length);
    }).finally(() => setLoading(false));
  }, [attemptId]);

  if (loading) return <LoadingScreen message="Preparing your assessment..." detail="Take a breath. Your questions are on their way." />;
  return <div className="instructions-page min-h-[calc(100vh-74px)] px-4 py-10 sm:py-16" style={{ backgroundColor: tone.page }}>
    <div className="mx-auto max-w-4xl"><button onClick={() => navigate('/dashboard')} className="text-sm font-medium" style={{ color: tone.accent }}>← Back to My Tests</button>
      <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_280px]">
        <main className="rounded-[2rem] border border-white/80 bg-white p-7 shadow-[0_20px_60px_rgba(73,57,88,0.08)] sm:p-11"><div className="flex h-16 w-16 items-center justify-center rounded-2xl" style={{ backgroundColor: tone.soft, color: tone.accent }}><TestIcon slug={slug} className="h-9 w-9" /></div><p className="mt-8 text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: tone.accent }}>{tone.label}</p><h1 className="mt-3 text-4xl font-semibold tracking-tight text-[#302447] sm:text-5xl">Before you begin</h1><p className="mt-4 max-w-xl text-base leading-7 text-slate-500">Take a quiet moment to answer honestly. This is a space for self-reflection, with no right or wrong answers.</p>
          <div className="mt-9 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl p-4" style={{ backgroundColor: tone.soft }}><p className="text-2xl font-semibold" style={{ color: tone.accent }}>{questions || '—'}</p><p className="mt-1 text-xs text-slate-500">Questions</p></div><div className="rounded-2xl bg-[#faf8f7] p-4"><p className="text-2xl font-semibold text-[#302447]">5–25</p><p className="mt-1 text-xs text-slate-500">Minutes</p></div><div className="rounded-2xl bg-[#faf8f7] p-4"><p className="text-2xl font-semibold text-[#302447]">Free</p><p className="mt-1 text-xs text-slate-500">Retakes</p></div></div>
          <button onClick={() => navigate(`/attempts/${attemptId}/run`)} className="mt-9 w-full rounded-xl py-3.5 text-sm font-semibold text-white shadow-lg transition hover:brightness-95" style={{ backgroundColor: tone.accent }}>Start the test →</button>
        </main>
        <aside className="rounded-[2rem] border border-white/80 bg-white/70 p-7"><p className="text-sm font-semibold text-[#302447]">A few things to know</p><div className="mt-6 space-y-5 text-sm leading-6 text-slate-500"><p><span className="mr-3" style={{ color: tone.accent }}>01</span>Answer every question before submitting.</p><p><span className="mr-3" style={{ color: tone.accent }}>02</span>Choose the answer that feels most like you.</p><p><span className="mr-3" style={{ color: tone.accent }}>03</span>Your result is saved privately to your account.</p><p><span className="mr-3" style={{ color: tone.accent }}>04</span>This is for self-reflection, not a clinical diagnosis.</p></div><div className="mt-10 rounded-2xl p-4 text-xs leading-5" style={{ backgroundColor: tone.soft, color: tone.accent }}>You can take your time. Your first instinct is often a helpful guide.</div></aside>
      </div><p className="mt-6 text-center text-xs text-slate-400">{name} · Your answers are private and secure</p>
    </div>
  </div>;
}
