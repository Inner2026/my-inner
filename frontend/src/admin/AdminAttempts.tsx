import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminApi } from '../api/adminEndpoints';

export function AdminAttempts() {
  const [attempts, setAttempts] = useState<any[]>([]);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 25, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    AdminApi.listAttempts({ status, page, pageSize: 25 })
      .then((res) => { setAttempts(res.attempts); setPagination(res.pagination); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [status, page]);

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-slate-900">Attempts</h1>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="admin-input w-full sm:w-auto">
          <option value="">All statuses</option>
          <option value="in_progress">In progress</option>
          <option value="scoring">Scoring</option>
          <option value="submitted">Submitted</option>
        </select>
      </div>
      {error && <p className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      {loading ? <p className="mt-4 text-sm text-slate-500">Loading attempts...</p> : attempts.length === 0 ? <p className="mt-4 rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">No attempts found.</p> : <>
        <div className="admin-table-wrap mt-4 hidden md:block"><table className="w-full text-sm"><thead><tr className="border-b border-slate-200 text-left text-slate-500"><th className="py-2">User</th><th>Test</th><th>Status</th><th>Result key</th><th>Started</th><th>Completed</th><th /></tr></thead><tbody>{attempts.map((a) => <tr key={a._id} className="border-b border-slate-100"><td className="py-2 break-all">{a.userId?.email || a.userId?.username || '-'}</td><td>{a.testId?.name || '-'}</td><td><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${a.status === 'submitted' ? 'bg-emerald-50 text-emerald-700' : a.status === 'scoring' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'}`}>{a.status === 'in_progress' ? 'In progress' : a.status === 'submitted' ? 'Submitted' : 'Scoring'}</span></td><td>{a.result?.resultKey ?? '-'}</td><td>{new Date(a.startedAt).toLocaleString()}</td><td>{a.completedAt ? new Date(a.completedAt).toLocaleString() : '-'}</td><td><Link to={`/admin/attempts/${a._id}`} className="font-semibold text-[#765c8d]">Details</Link></td></tr>)}</tbody></table></div>
        <div className="mt-4 grid gap-3 md:hidden">{attempts.map((a) => <article key={a._id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="break-all font-semibold text-slate-900">{a.userId?.email || a.userId?.username || '-'}</p><p className="mt-1 break-words text-sm text-slate-500">{a.testId?.name || '-'}</p></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${a.status === 'submitted' ? 'bg-emerald-50 text-emerald-700' : a.status === 'scoring' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'}`}>{a.status === 'in_progress' ? 'In progress' : a.status === 'submitted' ? 'Submitted' : 'Scoring'}</span></div><dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2"><div><dt className="text-xs text-slate-400">Result key</dt><dd className="mt-1 break-words text-slate-700">{a.result?.resultKey ?? '-'}</dd></div><div><dt className="text-xs text-slate-400">Started</dt><dd className="mt-1 break-words text-slate-700">{new Date(a.startedAt).toLocaleString()}</dd></div><div><dt className="text-xs text-slate-400">Completed</dt><dd className="mt-1 break-words text-slate-700">{a.completedAt ? new Date(a.completedAt).toLocaleString() : '-'}</dd></div></dl><div className="mt-4 border-t border-slate-100 pt-3"><Link to={`/admin/attempts/${a._id}`} className="font-semibold text-[#765c8d]">View details</Link></div></article>)}</div>
      </>}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500"><span>{pagination.total} attempts</span><div className="flex max-w-full items-center gap-2"><button disabled={page <= 1} onClick={() => setPage((current) => current - 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-40">Previous</button><span className="whitespace-nowrap px-1 py-1.5">Page {pagination.page} of {Math.max(1, pagination.pages)}</span><button disabled={page >= pagination.pages} onClick={() => setPage((current) => current + 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-40">Next</button></div></div>
    </div>
  );
}
