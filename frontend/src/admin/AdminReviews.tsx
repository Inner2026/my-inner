import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { AdminApi } from '../api/adminEndpoints';
import { useAdminFeedback } from './AdminFeedback';

export function AdminReviews() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showSuccess, showError, askConfirmation } = useAdminFeedback();

  function load() {
    setLoading(true);
    setError(null);
    AdminApi.listReviews().then((res) => setReviews(res.reviews)).catch((e) => { setError(e.message); showError(e.message); }).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function remove(review: any) {
    const confirmed = await askConfirmation({ title: 'Delete review?', message: 'This review will also disappear from the public test page.', confirmLabel: 'Delete review', danger: true });
    if (!confirmed) return;
    try {
      await AdminApi.deleteReview(review._id);
      setReviews((current) => current.filter((item) => item._id !== review._id));
      showSuccess('Review deleted successfully.');
    } catch (e: any) { setError(e.message); showError(e.message); }
  }

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-xl font-semibold text-slate-900">Reviews</h1><p className="mt-1 text-sm text-slate-500">Customer ratings and comments from completed tests.</p></div>
        <span className="rounded-full bg-[#f1ebf5] px-3 py-1 text-xs font-semibold text-[#765c8d]">{reviews.length} reviews</span>
      </div>
      {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {loading ? <p className="mt-5 text-sm text-slate-500">Loading reviews...</p> : reviews.length === 0 ? <p className="mt-5 rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">No reviews yet.</p> : <>
        <div className="admin-table-wrap mt-5 hidden md:block"><table className="w-full text-sm"><thead><tr><th>Test</th><th>Customer</th><th>Rating</th><th>Review</th><th>Date</th><th>Actions</th></tr></thead><tbody>{reviews.map((review) => <tr key={review._id}><td className="font-semibold">{review.testId?.name || '-'}</td><td>{review.userId?.username || review.userId?.email || 'Anonymous'}</td><td><span className="inline-flex items-center gap-1">{review.rating}<Star className="h-4 w-4 fill-[#e6ae55] text-[#e6ae55]" /></span></td><td className="max-w-md whitespace-pre-line text-slate-600">{review.comment || <span className="text-slate-400">No written comment</span>}</td><td>{new Date(review.createdAt).toLocaleDateString()}</td><td><button onClick={() => remove(review)} className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600">Delete</button></td></tr>)}</tbody></table></div>
        <div className="mt-5 grid gap-3 md:hidden">{reviews.map((review) => <article key={review._id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h2 className="truncate font-semibold text-slate-900">{review.testId?.name || '-'}</h2><p className="mt-1 break-words text-sm text-slate-500">{review.userId?.username || review.userId?.email || 'Anonymous'}</p></div><span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-sm font-semibold text-amber-700">{review.rating}<Star className="h-4 w-4 fill-[#e6ae55] text-[#e6ae55]" /></span></div><p className="mt-3 break-words text-sm leading-6 text-slate-600">{review.comment || <span className="text-slate-400">No written comment</span>}</p><div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3"><span className="text-xs text-slate-500">{new Date(review.createdAt).toLocaleDateString()}</span><button onClick={() => remove(review)} className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600">Delete</button></div></article>)}</div>
      </>}
    </div>
  );
}
