import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AdminApi } from '../api/adminEndpoints';

export function AdminUserDetail() {
  const { userId } = useParams<{ userId: string }>();
  const [data, setData] = useState<{ user: any; purchases: any[]; attempts: any[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (userId) AdminApi.getUserActivity(userId).then(setData).catch((e) => setError(e.message)); }, [userId]);
  if (error) return <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>;
  if (!data) return <p className="text-sm text-slate-500">Loading user activity...</p>;
  const { user, purchases, attempts } = data;

  return <div><Link to="/admin/users" className="text-xs font-semibold text-[#765c8d]">← Back to users</Link><div className="mt-4 rounded-2xl border border-[#eee5e9] bg-white p-6 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-[#765c8d]">User details</p><h1 className="mt-1 text-2xl font-semibold text-[#302447]">{user.username || user.email || user.phone}</h1><p className="mt-2 text-sm text-slate-500">{user.email || user.phone || 'No contact information'}</p></div><span className="rounded-full bg-[#f1ebf5] px-3 py-1 text-xs font-semibold text-[#765c8d]">{user.role}</span></div><div className="mt-6 grid gap-4 text-sm sm:grid-cols-3"><div><p className="text-xs text-slate-400">Registered</p><p className="mt-1 font-semibold text-[#302447]">{new Date(user.createdAt).toLocaleDateString()}</p></div><div><p className="text-xs text-slate-400">Purchases</p><p className="mt-1 font-semibold text-[#302447]">{purchases.length}</p></div><div><p className="text-xs text-slate-400">Attempts</p><p className="mt-1 font-semibold text-[#302447]">{attempts.length}</p></div></div></div>
    <section className="mt-5 rounded-2xl border border-[#eee5e9] bg-white p-5 shadow-sm"><h2 className="font-semibold text-[#302447]">Purchase activity</h2>{purchases.length === 0 ? <p className="mt-3 text-sm text-slate-500">No purchases yet.</p> : <div className="admin-table-wrap mt-3"><table className="w-full text-sm"><thead><tr><th>Test</th><th>Status</th><th>Amount</th><th>Date</th></tr></thead><tbody>{purchases.map((purchase) => <tr key={purchase._id}><td>{purchase.testId?.name || '-'}</td><td>{purchase.status}</td><td>${(purchase.amount / 100).toFixed(2)} {purchase.currency?.toUpperCase()}</td><td>{new Date(purchase.createdAt).toLocaleDateString()}</td></tr>)}</tbody></table></div>}</section>
    <section className="mt-5 rounded-2xl border border-[#eee5e9] bg-white p-5 shadow-sm"><h2 className="font-semibold text-[#302447]">Test activity</h2>{attempts.length === 0 ? <p className="mt-3 text-sm text-slate-500">No test attempts yet.</p> : <div className="admin-table-wrap mt-3"><table className="w-full text-sm"><thead><tr><th>Test</th><th>Status</th><th>Result</th><th>Started</th><th>Completed</th></tr></thead><tbody>{attempts.map((attempt) => <tr key={attempt._id}><td>{attempt.testId?.name || '-'}</td><td>{attempt.status}</td><td>{attempt.result?.snapshot?.title || attempt.result?.resultKey || '-'}</td><td>{new Date(attempt.startedAt).toLocaleDateString()}</td><td>{attempt.completedAt ? new Date(attempt.completedAt).toLocaleDateString() : '-'}</td></tr>)}</tbody></table></div>}</section>
  </div>;
}
