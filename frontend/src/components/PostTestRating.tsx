import { useState } from 'react';
import { Star } from 'lucide-react';
import { ApiError } from '../api/client';
import { TestsApi } from '../api/endpoints';

type Props = { slug: string; testName: string; accent: string; onComplete: () => void; onSkip: () => void };

export function PostTestRating({ slug, testName, accent, onComplete, onSkip }: Props) {
  const [selected, setSelected] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!selected) return;
    setSaving(true); setError(null);
    try { await TestsApi.rate(slug, selected, comment); onComplete(); }
    catch (err) { setError(err instanceof ApiError ? err.message : 'Could not save your feedback.'); setSaving(false); }
  }

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#302447]/35 px-4 py-6 backdrop-blur-sm">
    <div className="relative w-full max-w-lg overflow-hidden rounded-[2rem] border border-white/80 bg-[#fffdfb] p-7 shadow-[0_30px_90px_rgba(48,36,71,0.2)] sm:p-10">
      <div className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full opacity-40" style={{ backgroundColor: accent }} />
      <div className="relative text-center">
        <div className="mx-auto flex h-16 w-16 animate-pulse items-center justify-center rounded-full" style={{ backgroundColor: `${accent}18`, color: accent }}><span className="text-3xl">✦</span></div>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: accent }}>One last reflection</p>
        <h2 className="mt-2 font-serif text-3xl text-[#302447]">How was {testName}?</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">Your feedback helps us make every reflection more meaningful.</p>
        <div className="mt-6 flex justify-center gap-2" onMouseLeave={() => setHovered(0)}>
          {[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" aria-label={`Rate ${value} out of 5`} onMouseEnter={() => setHovered(value)} onClick={() => setSelected(value)} className="rounded-lg p-1 transition hover:-translate-y-1"><Star className={`h-9 w-9 ${value <= (hovered || selected) ? 'fill-[#e6ae55] text-[#e6ae55]' : 'text-[#d9cedc]'}`} /></button>)}
        </div>
        <textarea value={comment} onChange={(event) => setComment(event.target.value)} maxLength={500} placeholder="Tell us what you thought (optional)" className="mt-6 min-h-24 w-full resize-none rounded-2xl border border-[#e8dfe9] bg-white px-4 py-3 text-sm text-[#302447] outline-none transition placeholder:text-slate-400 focus:border-[#b9a2c6]" />
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center"><button type="button" onClick={onSkip} className="rounded-full px-5 py-3 text-sm font-semibold text-slate-500 transition hover:bg-slate-50">Skip for now</button><button type="button" onClick={submit} disabled={!selected || saving} className="rounded-full px-6 py-3 text-sm font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40" style={{ backgroundColor: accent }}>{saving ? 'Saving...' : 'Continue to my result'}</button></div>
      </div>
    </div>
  </div>;
}
