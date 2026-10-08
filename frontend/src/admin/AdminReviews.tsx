import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { AdminApi } from '../api/adminEndpoints';

export function AdminReviews() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  function load() { setLoading(true); setError(null); AdminApi.listReviews().then((res) => setReviews(res.reviews)).catch((e) => setError(e.message)).finally(() => setLoading(false)); }
  useEffect(() => { load(); }, []);
  async function remove(review: any) { if (!window.confirm('Delete this review? It will also disappear from the public test page.')) return; try { await AdminApi.deleteReview(review._id); setReviews((current) => current.filter((item) => item._id !== review._id)); setMessage('Review deleted.'); } catch (e: any) { setError(e.message); } }
  return <div><div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-xl font-semibold text-slate-900">Reviews</h1><p className="mt-1 text-sm text-slate-500">Customer ratings and comments from completed tests.</p></div><span className="rounded-full bg-[#f1ebf5] px-3 py-1 text-xs font-semibold text-[#765c8d]">{reviews.length} reviews</span></div>{message && <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}{error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}{loading ? <p className="mt-5 text-sm text-slate-500">Loading reviews...</p> : reviews.length === 0 ? <p className="mt-5 rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">No reviews yet.</p> : <div className="admin-table-wrap mt-5"><table className="w-full text-sm"><thead><tr><th>Test</th><th>Customer</th><th>Rating</th><th>Review</th><th>Date</th><th>Actions</th></tr></thead><tbody>{reviews.map((review) => <tr key={review._id}><td className="font-semibold">{review.testId?.name || '-'}</td><td>{review.userId?.username || review.userId?.email || 'Anonymous'}</td><td><span className="inline-flex items-center gap-1">{review.rating}<Star className="h-4 w-4 fill-[#e6ae55] text-[#e6ae55]" /></span></td><td className="max-w-md whitespace-pre-line text-slate-600">{review.comment || <span className="text-slate-400">No written comment</span>}</td><td>{new Date(review.createdAt).toLocaleDateString()}</td><td><button onClick={() => remove(review)} className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600">Delete</button></td></tr>)}</tbody></table></div>}</div>;
}
