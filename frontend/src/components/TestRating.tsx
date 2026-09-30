import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '../api/client';
import { TestsApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';

export function TestRating({ slug }: { slug: string }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rating, setRating] = useState({ average: 0, count: 0, userRating: null as number | null, canRate: false });
  const [hovered, setHovered] = useState(0);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    TestsApi.getRating(slug).then((res) => setRating(res.rating)).catch(() => undefined);
  }, [slug]);

  async function submit(value: number) {
    if (!user) {
      navigate('/login', { state: { from: `/tests/${slug}` } });
      return;
    }
    if (!rating.canRate) return;
    setSaving(true);
    setMessage(null);
    try {
      const result = await TestsApi.rate(slug, value);
      setRating(result.rating);
      setMessage('Thanks for rating this test.');
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : 'Could not save your rating.');
    } finally {
      setSaving(false);
    }
  }

  const selected = hovered || rating.userRating || 0;
  return <section className="rounded-2xl border border-[#eee5e9] bg-white p-6 shadow-sm sm:p-8">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#765c8d]">Your feedback matters</p><h2 className="mt-2 text-xl font-semibold text-[#302447]">How would you rate this test?</h2><p className="mt-1 text-sm text-slate-500">Help others choose the right reflection for them.</p></div>
      <div className="text-right"><p className="text-2xl font-semibold text-[#302447]">{rating.average ? rating.average.toFixed(1) : '—'}</p><p className="text-xs text-slate-400">{rating.count} {rating.count === 1 ? 'rating' : 'ratings'}</p></div>
    </div>
    <div className="mt-5 flex items-center gap-1" onMouseLeave={() => setHovered(0)}>
      {[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" aria-label={`Rate ${value} out of 5`} disabled={saving || !rating.canRate} onMouseEnter={() => rating.canRate && setHovered(value)} onClick={() => submit(value)} className="rounded-md p-1 transition hover:scale-110 disabled:cursor-not-allowed disabled:opacity-50"><Star className={`h-8 w-8 ${value <= selected ? 'fill-[#e6ae55] text-[#e6ae55]' : 'text-[#d9cedc]'}`} /></button>)}
      <span className="ml-3 text-xs text-slate-400">{rating.userRating ? 'Your rating' : !user ? 'Log in to rate' : rating.canRate ? 'Select a rating' : 'Complete the test to rate'}</span>
    </div>
    {message && <p className="mt-3 text-sm text-[#765c8d]">{message}</p>}
  </section>;
}
