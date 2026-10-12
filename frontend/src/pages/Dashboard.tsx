import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AttemptsApi, ReferralsApi, ResultsApi } from '../api/endpoints';
import { AttemptSummary, ResultSummary } from '../types';
import { TestIcon, testIconTone } from '../components/TestIcon';
import { LoadingScreen } from '../components/LoadingScreen';

type Tab = 'tests' | 'results';
type ReferralData = { referralLink: string; totalReferredUsers: number; pendingReferrals: number; successfulReferrals: number; totalReferralCreditEarnedCents: number; totalReferralCreditSpentCents: number; availableReferralCreditCents: number };

export function Dashboard() {
  const [tab, setTab] = useState<Tab>('tests');
  const [attempts, setAttempts] = useState<AttemptSummary[]>([]);
  const [results, setResults] = useState<ResultSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [referral, setReferral] = useState<ReferralData | null>(null);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [ledger, setLedger] = useState<any[]>([]);
  const [referralLoading, setReferralLoading] = useState(true);
  const [referralError, setReferralError] = useState<string | null>(null);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  useEffect(() => { Promise.all([AttemptsApi.list(), ResultsApi.list()]).then(([a, r]) => { setAttempts(a.attempts); setResults(r.results); }).finally(() => setLoading(false)); }, []);
  useEffect(() => { Promise.all([ReferralsApi.overview(), ReferralsApi.history(), ReferralsApi.ledger()]).then(([overview, history, entries]) => { setReferral(overview); setReferrals(history.referrals); setLedger(entries.entries); }).catch((error) => setReferralError(error instanceof Error ? error.message : 'Unable to load referral details.')).finally(() => setReferralLoading(false)); }, []);

  async function copyLink() {
    if (!referral?.referralLink) return;
    try { await navigator.clipboard.writeText(referral.referralLink); setCopyMessage('Referral link copied.'); } catch { setCopyMessage('Copy was unavailable. Select and copy the link manually.'); }
    window.setTimeout(() => setCopyMessage(null), 3000);
  }
  async function shareLink() {
    if (!referral?.referralLink) return;
    if (navigator.share) { try { await navigator.share({ title: 'My Inner', text: 'Explore My Inner with me.', url: referral.referralLink }); return; } catch { /* cancelled */ } }
    await copyLink();
  }

  if (loading) return <LoadingScreen message="Preparing your results..." detail="Your saved reflections are almost ready." />;
  const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;
  return <div className="dashboard-page min-h-[calc(100vh-74px)] px-4 py-10 sm:px-8"><div className="mx-auto max-w-5xl">
    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#765c8d]">Your personal space</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#302447]">{tab === 'tests' ? 'My Tests' : 'My Results'}</h1><p className="mt-2 text-sm text-slate-500">{tab === 'tests' ? 'View your purchased tests and access your results.' : 'Your completed assessments and personality insights.'}</p>
    <section className="mt-7 rounded-[1.75rem] border border-[#eadff0] bg-[#fffdfb] p-6 shadow-sm sm:p-8" aria-labelledby="invite-heading"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#765c8d]">Invite &amp; Earn</p><h2 id="invite-heading" className="mt-2 text-2xl font-semibold tracking-tight text-[#302447]">Share a little inner discovery</h2><p className="mt-2 max-w-xl text-sm leading-6 text-[#62596c]">Referral credit is added after your friend completes their first qualifying test purchase. It never expires, can be combined with eligible coupon codes, and is internal My Inner credit—not cash.</p></div>{referral && <div className="flex gap-2"><button type="button" onClick={copyLink} className="rounded-full bg-[#765c8d] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#634a78]">Copy Link</button><button type="button" onClick={shareLink} className="rounded-full border border-[#ded2df] px-4 py-2.5 text-xs font-semibold text-[#62596c] hover:bg-[#f8f2f8]">Share</button></div>}</div>
      {referralLoading ? <p className="mt-6 text-sm text-slate-400">Loading your referral details...</p> : referralError ? <p className="mt-6 rounded-xl bg-red-50 p-3 text-sm text-red-700">{referralError}</p> : referral && <><div className="mt-6 grid gap-3 sm:grid-cols-3"><Metric label="Available credit" value={money(referral.availableReferralCreditCents)} /><Metric label="Total earned" value={money(referral.totalReferralCreditEarnedCents)} /><Metric label="Total spent" value={money(referral.totalReferralCreditSpentCents)} /></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><Metric label="Successful referrals" value={String(referral.successfulReferrals)} /><Metric label="Pending referrals" value={String(referral.pendingReferrals)} /></div><div className="mt-5 rounded-xl border border-[#eee5e9] bg-white px-4 py-3"><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Your referral link</p><p className="mt-1 break-all text-sm text-[#765c8d]">{referral.referralLink}</p>{copyMessage && <p role="status" className="mt-2 text-xs font-semibold text-[#397e7c]">{copyMessage}</p>}</div><div className="mt-6 grid gap-6 lg:grid-cols-2"><History referrals={referrals} money={money} /><Ledger entries={ledger} money={money} /></div></>}
    </section>
    <div className="mt-7 flex gap-2"><button onClick={() => setTab('tests')} className={`rounded-full px-5 py-2 text-xs font-semibold transition ${tab === 'tests' ? 'bg-[#765c8d] text-white shadow-md shadow-[#765c8d]/20' : 'border border-[#e4dce8] bg-white text-slate-500'}`}>My Tests</button><button onClick={() => setTab('results')} className={`rounded-full px-5 py-2 text-xs font-semibold transition ${tab === 'results' ? 'bg-[#765c8d] text-white shadow-md shadow-[#765c8d]/20' : 'border border-[#e4dce8] bg-white text-slate-500'}`}>My Results</button></div>
    {tab === 'tests' ? <div className="mt-5 overflow-hidden rounded-2xl border border-[#eee5e9] bg-white shadow-sm">{attempts.length === 0 ? <Empty text="You have not purchased any tests yet." /> : attempts.map((attempt) => { const done = attempt.status === 'submitted'; return <div key={attempt._id} className="flex flex-col gap-4 border-b border-[#f1ebf0] p-5 last:border-0 sm:flex-row sm:items-center"><span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${testIconTone(attempt.testId.slug)}`}><TestIcon slug={attempt.testId.slug} className="h-7 w-7" /></span><div className="flex-1"><p className="font-semibold text-[#302447]">{attempt.testId.name}</p><p className={`mt-1 text-xs font-medium ${done ? 'text-[#4c9a83]' : 'text-[#bd7891]'}`}>{done ? 'Completed' : 'In Progress'} <span className="text-slate-400">· {new Date(attempt.completedAt || attempt.startedAt).toLocaleDateString()}</span></p></div>{done ? <Link to={`/results/${attempt._id}`} className="rounded-full bg-[#765c8d] px-5 py-2 text-xs font-semibold text-white">View Result</Link> : <Link to={`/attempts/${attempt._id}/instructions`} className="rounded-full bg-[#765c8d] px-5 py-2 text-xs font-semibold text-white">Continue</Link>}</div>; })}</div> : <div className="mt-5 overflow-hidden rounded-2xl border border-[#eee5e9] bg-white shadow-sm">{results.length === 0 ? <Empty text="You have not completed any tests yet." /> : results.map((result) => <Link key={result.attemptId} to={`/results/${result.attemptId}`} className="grid gap-2 border-b border-[#f1ebf0] px-5 py-4 transition last:border-0 hover:bg-[#fcf9fc] sm:grid-cols-[1fr_1fr_150px_30px] sm:items-center sm:gap-4 sm:px-6"><span className="font-semibold text-[#302447]">{result.testName}</span><span className="text-sm text-slate-500">{result.resultTitle || 'Completed assessment'}</span><span className="text-xs text-slate-400">{new Date(result.completedAt).toLocaleDateString()}</span><span className="text-[#765c8d]">→</span></Link>)}</div>}
    <p className="mt-7 text-center text-xs text-slate-400">Want to discover something new? <Link to="/tests" className="font-semibold text-[#765c8d]">Explore more tests</Link></p>
  </div></div>;
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-[#faf6fc] p-4"><p className="text-xs text-[#8b8190]">{label}</p><p className="mt-1 text-xl font-semibold text-[#302447]">{value}</p></div>; }
function History({ referrals, money }: { referrals: any[]; money: (cents: number) => string }) { return <div><h3 className="text-sm font-semibold text-[#302447]">Referral history</h3>{referrals.length === 0 ? <p className="mt-3 text-sm leading-6 text-slate-500">You haven't invited anyone yet. Share your link with a friend and earn $1 when they complete their first test purchase.</p> : <div className="mt-3 space-y-2">{referrals.map((item) => <div key={item._id} className="flex items-center justify-between gap-3 rounded-xl border border-[#eee5e9] px-3 py-3 text-sm"><div><p className="font-medium text-[#302447]">{item.referredUserId?.username ? `@${item.referredUserId.username}` : 'Invited friend'}</p><p className="text-xs text-slate-400">Joined {new Date(item.createdAt).toLocaleDateString()}</p></div><div className="text-right"><p className="font-medium capitalize text-[#765c8d]">{item.status}</p>{item.status === 'rewarded' && <p className="text-xs text-emerald-700">{money(100)} earned</p>}</div></div>)}</div>}</div>; }
function Ledger({ entries, money }: { entries: any[]; money: (cents: number) => string }) { return <div><h3 className="text-sm font-semibold text-[#302447]">Credit usage</h3>{entries.length === 0 ? <p className="mt-3 text-sm text-slate-500">Your credit activity will appear here.</p> : <div className="mt-3 space-y-2">{entries.slice(0, 8).map((entry) => <div key={entry._id} className="flex items-center justify-between rounded-xl border border-[#eee5e9] px-3 py-3 text-sm"><span className="capitalize text-[#62596c]">{entry.entryType.replaceAll('_', ' ')}</span><span className="font-medium text-[#302447]">{entry.entryType === 'referral_reward' ? '+' : '-'}{money(entry.amountCents)}</span></div>)}</div>}</div>; }
function Empty({ text }: { text: string }) { return <div className="p-10 text-center text-sm text-slate-500">{text} <Link to="/tests" className="font-semibold text-[#765c8d]">Browse tests</Link></div>; }
