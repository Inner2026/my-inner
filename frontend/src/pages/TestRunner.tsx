import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AttemptsApi } from '../api/endpoints';
import { AttemptQuestion } from '../types';
import { ApiError } from '../api/client';
import { TestIcon } from '../components/TestIcon';
import { PostTestRating } from '../components/PostTestRating';
import { LoadingScreen } from '../components/LoadingScreen';

type TestTheme = { eyebrow: string; note: string; accent: string; accentText: string; accentSoft: string; page: string; panel: string; border: string; shape: string };
const themes: Record<string, TestTheme> = {
  'mbti-style': { eyebrow: 'MBTI personality test', note: 'Trust your first instinct', accent: '#75639a', accentText: '#5d4b82', accentSoft: '#f0ebf8', page: '#f7f4fb', panel: '#fffdfb', border: '#e8e0ef', shape: 'runner-shape-mbti' },
  'inner-child': { eyebrow: 'Inner child reflection', note: 'A gentle moment for you', accent: '#719b8d', accentText: '#46786b', accentSoft: '#edf5f0', page: '#f4f8f5', panel: '#fffefa', border: '#dfece4', shape: 'runner-shape-leaf' },
  'five-love-languages': { eyebrow: 'Five love languages', note: 'Answer from the heart', accent: '#bd7891', accentText: '#9d526f', accentSoft: '#fff0f3', page: '#fff7f7', panel: '#fffdfb', border: '#f0dce2', shape: 'runner-shape-heart' },
  'hidden-animal': { eyebrow: 'The hidden animal', note: 'Let your imagination lead', accent: '#c38b55', accentText: '#a36632', accentSoft: '#fff3e5', page: '#fffaf3', panel: '#fffefd', border: '#f0e2cf', shape: 'runner-shape-sun' },
  'cube-personality': { eyebrow: 'Cube personality test', note: 'See what feels most like you', accent: '#607fb2', accentText: '#3c619d', accentSoft: '#eef4ff', page: '#f5f8fd', panel: '#ffffff', border: '#dfe8f4', shape: 'runner-shape-cube' }
};
const fallbackTheme = themes['mbti-style'];

export function TestRunner() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<AttemptQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [index, setIndex] = useState(0);
  const [testSlug, setTestSlug] = useState('mbti-style');
  const [testName, setTestName] = useState('Personality assessment');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const draftKey = attemptId ? `myinner-attempt-${attemptId}` : null;

  useEffect(() => {
    if (!draftKey) return;
    const saved = localStorage.getItem(draftKey);
    if (saved) {
      try { setAnswers(JSON.parse(saved) as Record<string, string>); } catch { localStorage.removeItem(draftKey); }
    }
  }, [draftKey]);

  useEffect(() => {
    if (draftKey && Object.keys(answers).length > 0) localStorage.setItem(draftKey, JSON.stringify(answers));
  }, [answers, draftKey]);

  useEffect(() => {
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      if (questions.length > 0 && Object.keys(answers).length > 0) { event.preventDefault(); event.returnValue = ''; }
    };
    window.addEventListener('beforeunload', warnBeforeLeaving);
    return () => window.removeEventListener('beforeunload', warnBeforeLeaving);
  }, [answers, questions.length]);

  useEffect(() => {
    if (!attemptId) return;
    Promise.all([AttemptsApi.questions(attemptId), AttemptsApi.get(attemptId)]).then(([questionRes, attemptRes]) => {
      setQuestions(questionRes.questions);
      const test = attemptRes.attempt?.testId;
      if (typeof test === 'object' && test) { setTestSlug(test.slug || 'mbti-style'); setTestName(test.name || 'Personality assessment'); }
    }).catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, [attemptId]);

  const theme = themes[testSlug] ?? fallbackTheme;
  const current = questions[index];
  const progress = useMemo(() => questions.length ? Math.round(((index + 1) / questions.length) * 100) : 0, [index, questions.length]);
  const allAnswered = questions.length > 0 && questions.every((q) => answers[q.id]);

  async function handleSubmit() {
    if (!attemptId || !allAnswered) return;
    setSubmitting(true); setError(null);
    try { await AttemptsApi.submit(attemptId, questions.map((q) => ({ questionId: q.id, answerOptionId: answers[q.id] }))); if (draftKey) localStorage.removeItem(draftKey); setShowRating(true); }
    catch (err) { setError(err instanceof ApiError ? err.message : 'Could not submit your answers.'); }
    finally { setSubmitting(false); }
  }

  if (loading) return <LoadingScreen message="Loading your questions..." detail="Your reflection is about to begin." />;
  if (error && questions.length === 0) return <div className="p-8 text-center text-red-600">{error}</div>;
  if (!current) return null;

  return <div className="runner-page relative min-h-[calc(100vh-74px)] overflow-hidden px-4 py-7 sm:py-12" style={{ backgroundColor: theme.page }}>
    {showRating && <PostTestRating slug={testSlug} testName={testName} accent={theme.accent} onComplete={() => navigate(`/results/${attemptId}`)} onSkip={() => navigate(`/results/${attemptId}`)} />}
    <div className={`runner-shape ${theme.shape}`} style={{ backgroundColor: theme.accentSoft }} />
    <div className="relative mx-auto max-w-5xl">
      <div className="mb-5 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: theme.accentText }}><span>My Inner / {theme.eyebrow}</span><span>{progress}% complete</span></div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/75"><div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, backgroundColor: theme.accent }} /></div>
      <div className="mt-7 grid gap-5 lg:grid-cols-[220px_1fr]">
        <aside className="relative hidden min-h-[510px] overflow-hidden rounded-[1.75rem] border p-6 lg:flex lg:flex-col" style={{ backgroundColor: theme.panel, borderColor: theme.border }}>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: theme.accentSoft, color: theme.accent }}><TestIcon slug={testSlug} className="h-8 w-8" /></div>
          <p className="mt-7 text-lg font-semibold leading-6 text-slate-800">{testName}</p><p className="mt-2 text-sm text-slate-400">{questions.length} questions</p>
          <div className="mt-12 space-y-4 text-sm text-slate-400"><p className="flex items-center gap-3"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: theme.accent }} />Stay curious</p><p className="flex items-center gap-3"><span className="h-2 w-2 rounded-full bg-slate-200" />Be honest with yourself</p><p className="flex items-center gap-3"><span className="h-2 w-2 rounded-full bg-slate-200" />No wrong answers</p></div>
          <div className="runner-side-art" style={{ borderColor: theme.accent, color: theme.accent }}><span /><span /><span /></div>
        </aside>
        <main className="relative rounded-[1.75rem] border p-6 shadow-[0_20px_60px_rgba(73,57,88,0.08)] sm:p-10" style={{ backgroundColor: theme.panel, borderColor: theme.border }}>
          <div className="flex items-center justify-between text-sm text-slate-400"><span>Question {index + 1} of {questions.length}</span><span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: theme.accentSoft, color: theme.accentText }}>{theme.note}</span></div>
          <h1 className="mt-10 max-w-3xl text-2xl font-semibold leading-[1.18] tracking-tight text-slate-900 sm:text-[2.65rem]">{current.questionText}</h1>
          <div className="mt-9 grid gap-3">{current.answerOptions.slice().sort((a, b) => a.order - b.order).map((opt) => { const selected = answers[current.id] === opt.id; return <button key={opt.id} onClick={() => setAnswers((prev) => ({ ...prev, [current.id]: opt.id }))} className="group flex w-full items-center justify-between rounded-xl border px-5 py-4 text-left text-[15px] transition hover:-translate-y-0.5" style={{ borderColor: selected ? theme.accent : theme.border, backgroundColor: selected ? theme.accentSoft : 'transparent', color: selected ? theme.accentText : '#475569' }}><span>{opt.text}</span><span className="ml-4 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs" style={{ borderColor: selected ? theme.accent : '#d6dce4', backgroundColor: selected ? theme.accent : 'transparent', color: selected ? '#fff' : 'transparent' }}>✓</span></button>; })}</div>
          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
          <div className="mt-9 flex items-center justify-between border-t pt-6" style={{ borderColor: theme.border }}><button onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0} className="rounded-full px-5 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-50 disabled:opacity-30">← Back</button>{index < questions.length - 1 ? <button onClick={() => setIndex((i) => i + 1)} disabled={!answers[current.id]} className="rounded-full px-7 py-3 text-sm font-semibold text-white transition hover:brightness-95 disabled:opacity-40" style={{ backgroundColor: theme.accent }}>Next →</button> : <button onClick={handleSubmit} disabled={!allAnswered || submitting} className="rounded-full px-7 py-3 text-sm font-semibold text-white transition hover:brightness-95 disabled:opacity-40" style={{ backgroundColor: theme.accent }}>{submitting ? 'Submitting...' : 'See my result →'}</button>}</div>
        </main>
      </div>
    </div>
  </div>;
}
