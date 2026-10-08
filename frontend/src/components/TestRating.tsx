import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '../api/client';
import { TestsApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { TestRatingSummary } from '../types';

const emptyRating: TestRatingSummary = { average: 0, count: 0, userRating: null, canRate: false, reviews: [] };

export function TestRating({ slug }: { slug: string }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rating, setRating] = useState(emptyRating);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => { TestsApi.getRating(slug).then((res) => setRating(res.rating)).catch(() => undefined); }, [slug]);

  async function submit(value: number) {
    if (!user) { navigate('/login', { state: { from: `/tests/${slug}` } }); return; }
    if (!rating.canRate) return;
    setSaving(true); setMessage(null);
    try { const result = await TestsApi.rate(slug, value, comment); setRating(result.rating); setComment(''); setMessage('Thanks for sharing your review.'); }
    catch (error) { setMessage(error instanceof ApiError ? error.message : 'Could not save your review.'); }
    finally { setSaving(false); }
  }

  const selected = hovered || rating.userRating || 0;
  return <section className="rounded-2xl border border-[#eee5e9] bg-white p-6 shadow-sm sm:p-8">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#765c8d]">Reviews</p><h2 className="mt-2 text-xl font-semibold text-[#302447]">What people think</h2><p className="mt-1 text-sm text-slate-500">Share your experience to help others choose.</p></div><div className="text-right"><p className="text-2xl font-semibold text-[#302447]">{rating.average ? rating.average.toFixed(1) : '—'}</p><p className="text-xs text-slate-400">{rating.count} {rating.count === 1 ? 'review' : 'reviews'}</p></div></div>
    <div className="mt-5 flex items-center gap-1" onMouseLeave={() => setHovered(0)}>{[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" aria-label={`Rate ${value} out of 5`} disabled={saving || !rating.canRate} onMouseEnter={() => rating.canRate && setHovered(value)} onClick={() => submit(value)} className="rounded-md p-1 transition hover:scale-110 disabled:cursor-not-allowed disabled:opacity-50"><Star className={`h-8 w-8 ${value <= selected ? 'fill-[#e6ae55] text-[#e6ae55]' : 'text-[#d9cedc]'}`} /></button>)}<span className="ml-3 text-xs text-slate-400">{rating.userRating ? 'Your review' : !user ? 'Log in to review' : rating.canRate ? 'Choose a rating' : 'Complete the test to review'}</span></div>
    {rating.canRate && <textarea value={comment} onChange={(event) => setComment(event.target.value)} maxLength={500} placeholder="Write a review (optional)" className="mt-4 min-h-20 w-full resize-none rounded-xl border border-[#e8dfe9] px-4 py-3 text-sm text-[#302447] outline-none focus:border-[#b9a2c6]" />}
    {message && <p className="mt-3 text-sm text-[#765c8d]">{message}</p>}
    {rating.reviews.length > 0 && <div className="mt-6 space-y-3 border-t border-slate-100 pt-5">{rating.reviews.map((review) => <article key={review.id} className="rounded-xl bg-[#fcfafc] p-4"><div className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-1">{[1, 2, 3, 4, 5].map((value) => <Star key={value} className={`h-4 w-4 ${value <= review.rating ? 'fill-[#e6ae55] text-[#e6ae55]' : 'text-[#d9cedc]'}`} />)}</div><span className="text-xs text-slate-400">{review.author} · {new Date(review.createdAt).toLocaleDateString()}</span></div>{review.comment && <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">{review.comment}</p>}</article>)}</div>}
  </section>;
}
