import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AttemptsApi, ResultsApi } from '../api/endpoints';
import { AttemptSummary, ResultSummary } from '../types';
import { TestIcon, testIconTone } from '../components/TestIcon';
import { LoadingScreen } from '../components/LoadingScreen';

type Tab = 'tests' | 'results';

export function Dashboard() {
  const [tab, setTab] = useState<Tab>('tests');
  const [attempts, setAttempts] = useState<AttemptSummary[]>([]);
  const [results, setResults] = useState<ResultSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { Promise.all([AttemptsApi.list(), ResultsApi.list()]).then(([a, r]) => { setAttempts(a.attempts); setResults(r.results); }).finally(() => setLoading(false)); }, []);
  const uniqueTests = attempts;

  if (loading) return <LoadingScreen message="Preparing your results..." detail="Your saved reflections are almost ready." />;
  return <div className="dashboard-page min-h-[calc(100vh-74px)] px-4 py-10 sm:px-8"><div className="mx-auto max-w-5xl">
    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#765c8d]">Your personal space</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#302447]">{tab === 'tests' ? 'My Tests' : 'My Results'}</h1><p className="mt-2 text-sm text-slate-500">{tab === 'tests' ? 'View your purchased tests and access your results.' : 'Your completed assessments and personality insights.'}</p>
    <div className="mt-7 flex gap-2"><button onClick={() => setTab('tests')} className={`rounded-full px-5 py-2 text-xs font-semibold transition ${tab === 'tests' ? 'bg-[#765c8d] text-white shadow-md shadow-[#765c8d]/20' : 'border border-[#e4dce8] bg-white text-slate-500'}`}>My Tests</button><button onClick={() => setTab('results')} className={`rounded-full px-5 py-2 text-xs font-semibold transition ${tab === 'results' ? 'bg-[#765c8d] text-white shadow-md shadow-[#765c8d]/20' : 'border border-[#e4dce8] bg-white text-slate-500'}`}>My Results</button></div>
    {tab === 'tests' ? <div className="mt-5 overflow-hidden rounded-2xl border border-[#eee5e9] bg-white shadow-sm">{uniqueTests.length === 0 ? <Empty text="You have not purchased any tests yet." /> : uniqueTests.map((attempt) => { const done = attempt.status === 'submitted'; return <div key={attempt._id} className="flex flex-col gap-4 border-b border-[#f1ebf0] p-5 last:border-0 sm:flex-row sm:items-center"><span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${testIconTone(attempt.testId.slug)}`}><TestIcon slug={attempt.testId.slug} className="h-7 w-7" /></span><div className="flex-1"><p className="font-semibold text-[#302447]">{attempt.testId.name}</p><p className={`mt-1 text-xs font-medium ${done ? 'text-[#4c9a83]' : 'text-[#bd7891]'}`}>{done ? 'Completed' : 'In Progress'} <span className="text-slate-400">· {new Date(attempt.completedAt || attempt.startedAt).toLocaleDateString()}</span></p></div>{done ? <Link to={`/results/${attempt._id}`} className="rounded-full bg-[#765c8d] px-5 py-2 text-xs font-semibold text-white">View Result</Link> : <Link to={`/attempts/${attempt._id}/instructions`} className="rounded-full bg-[#765c8d] px-5 py-2 text-xs font-semibold text-white">Continue</Link>}</div>; })}</div> : <div className="mt-5 overflow-hidden rounded-2xl border border-[#eee5e9] bg-white shadow-sm"><div className="hidden grid-cols-[1fr_1fr_150px_30px] gap-4 border-b border-[#f1ebf0] px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400 sm:grid"><span>Test</span><span>Result</span><span>Date</span><span /></div>{results.length === 0 ? <Empty text="You have not completed any tests yet." /> : results.map((result) => <Link key={result.attemptId} to={`/results/${result.attemptId}`} className="grid gap-2 border-b border-[#f1ebf0] px-5 py-4 transition last:border-0 hover:bg-[#fcf9fc] sm:grid-cols-[1fr_1fr_150px_30px] sm:items-center sm:gap-4 sm:px-6"><span className="font-semibold text-[#302447]">{result.testName}</span><span className="text-sm text-slate-500">{result.resultTitle || 'Completed assessment'}</span><span className="text-xs text-slate-400">{new Date(result.completedAt).toLocaleDateString()}</span><span className="text-[#765c8d]">→</span></Link>)}</div>}
    <p className="mt-7 text-center text-xs text-slate-400">Want to discover something new? <Link to="/tests" className="font-semibold text-[#765c8d]">Explore more tests</Link></p>
  </div></div>;
}

function Empty({ text }: { text: string }) { return <div className="p-10 text-center text-sm text-slate-500">{text} <Link to="/tests" className="font-semibold text-[#765c8d]">Browse tests</Link></div>; }
