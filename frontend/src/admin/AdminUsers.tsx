import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminApi } from '../api/adminEndpoints';
import { useAdminFeedback } from './AdminFeedback';

export function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [active, setActive] = useState('');
  const [marketingEmails, setMarketingEmails] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 25, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showSuccess, showError, askConfirmation } = useAdminFeedback();

  const load = () => {
    setLoading(true); setError(null);
    AdminApi.listUsers({ search, active, marketingEmails, page, pageSize: 25 }).then((res) => { setUsers(res.users); setPagination(res.pagination); }).catch((e) => setError(e.message)).finally(() => setLoading(false));
  };
  useEffect(load, [search, active, marketingEmails, page]);

  async function toggle(user: any) {
    setError(null);
    const action = user.active === false ? 'reactivate' : 'disable';
    const confirmed = await askConfirmation({ title: `${action === 'disable' ? 'Disable' : 'Reactivate'} user?`, message: `${user.email || user.username || 'This user'} will be ${action === 'disable' ? 'unable to access the account' : 'able to access the account'} after this change.`, confirmLabel: action === 'disable' ? 'Disable user' : 'Reactivate user', danger: action === 'disable' });
    if (!confirmed) return;
    try { await AdminApi.updateUser(user._id, { active: !user.active }); showSuccess(`${user.email || user.username} is now ${user.active ? 'disabled' : 'active'}.`); load(); } catch (e: any) { setError(e.message); showError(e.message); }
  }
  async function toggleMarketing(user: any) {
    setError(null);
    try { await AdminApi.updateUser(user._id, { marketingEmails: !user.marketingEmails }); showSuccess('Marketing preference updated.'); load(); } catch (e: any) { setError(e.message); showError(e.message); }
  }
  function resetPage() { setPage(1); }

  const actions = (u: any) => <div className="flex flex-wrap gap-2"><button onClick={() => toggle(u)} className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700">{u.active === false ? 'Reactivate' : 'Disable'}</button><button onClick={() => toggleMarketing(u)} className="rounded-lg bg-[#f1ebf5] px-3 py-2 text-xs font-semibold text-[#765c8d]">{u.marketingEmails ? 'Opt out' : 'Opt in'}</button></div>;

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-xl font-semibold text-slate-900">Users</h1><div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap"><input value={search} onChange={(e) => { setSearch(e.target.value); resetPage(); }} placeholder="Search email, username or phone" className="admin-input w-full sm:max-w-xs" /><select value={active} onChange={(e) => { setActive(e.target.value); resetPage(); }} className="admin-input w-full sm:w-auto"><option value="">All account status</option><option value="true">Active</option><option value="false">Disabled</option></select><select value={marketingEmails} onChange={(e) => { setMarketingEmails(e.target.value); resetPage(); }} className="admin-input w-full sm:w-auto"><option value="">All marketing status</option><option value="true">Subscribed</option><option value="false">Unsubscribed</option></select></div></div>
      {error && <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {loading ? <p className="mt-5 text-sm text-slate-500">Loading users...</p> : users.length === 0 ? <p className="mt-5 rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">No users found.</p> : <>
        <div className="admin-table-wrap mt-4 hidden md:block"><table className="w-full text-sm"><thead><tr className="border-b border-slate-200 text-left text-slate-500"><th className="py-2">Email</th><th>Phone</th><th>Status</th><th>Marketing</th><th>Role</th><th>Joined</th><th>Actions</th></tr></thead><tbody>{users.map((u) => <tr key={u._id} className="border-b border-slate-100"><td className="py-2"><Link to={`/admin/users/${u._id}`} className="break-all font-semibold text-[#765c8d] underline underline-offset-4">{u.email ?? u.username ?? '-'}</Link></td><td>{u.phone ?? '-'}</td><td><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${u.active === false ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>{u.active === false ? 'Disabled' : 'Active'}</span></td><td><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${u.marketingEmails ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>{u.marketingEmails ? 'Subscribed' : 'Unsubscribed'}</span></td><td>{u.role}</td><td>{new Date(u.createdAt).toLocaleDateString()}</td><td>{actions(u)}</td></tr>)}</tbody></table></div>
        <div className="mt-4 grid gap-3 md:hidden">{users.map((u) => <article key={u._id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><Link to={`/admin/users/${u._id}`} className="min-w-0 break-all font-semibold text-[#765c8d] underline underline-offset-4">{u.email ?? u.username ?? '-'}</Link><span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${u.active === false ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>{u.active === false ? 'Disabled' : 'Active'}</span></div><dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm"><div><dt className="text-xs text-slate-400">Phone</dt><dd className="mt-1 break-words text-slate-700">{u.phone ?? '-'}</dd></div><div><dt className="text-xs text-slate-400">Role</dt><dd className="mt-1 text-slate-700">{u.role}</dd></div><div><dt className="text-xs text-slate-400">Marketing</dt><dd className="mt-1 text-slate-700">{u.marketingEmails ? 'Subscribed' : 'Unsubscribed'}</dd></div><div><dt className="text-xs text-slate-400">Joined</dt><dd className="mt-1 text-slate-700">{new Date(u.createdAt).toLocaleDateString()}</dd></div></dl><div className="mt-4 border-t border-slate-100 pt-3">{actions(u)}</div></article>)}</div>
      </>}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500"><span>{pagination.total} users</span><div className="flex max-w-full items-center gap-2"><button disabled={page <= 1} onClick={() => setPage((current) => current - 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-40">Previous</button><span className="whitespace-nowrap px-1 py-1.5">Page {pagination.page} of {Math.max(1, pagination.pages)}</span><button disabled={page >= pagination.pages} onClick={() => setPage((current) => current + 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-40">Next</button></div></div>
    </div>
  );
}
