import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AuthApi } from '../api/endpoints';

export function Profile() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.username || '');
  const [saved, setSaved] = useState(false);
  const [marketingEmails, setMarketingEmails] = useState(user?.marketingEmails === true);
  const [preferenceError, setPreferenceError] = useState<string | null>(null);
  async function saveMarketing(next: boolean) { setPreferenceError(null); try { await AuthApi.updatePreferences({ marketingEmails: next }); setMarketingEmails(next); } catch (error: any) { setPreferenceError(error.message); } }
  function save(e: React.FormEvent) { e.preventDefault(); setSaved(true); setTimeout(() => setSaved(false), 2500); }
  return <div className="profile-page min-h-[calc(100vh-74px)] px-4 py-10 sm:px-8"><div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[200px_1fr]"><aside className="rounded-2xl border border-[#eee5e9] bg-white/70 p-4 shadow-sm"><p className="px-3 pb-4 text-xs font-semibold uppercase tracking-[0.16em] text-[#765c8d]">My account</p><nav className="space-y-1"><Link to="/profile" className="profile-nav active">Profile</Link><Link to="/dashboard" className="profile-nav">My Tests</Link><Link to="/dashboard" className="profile-nav">My Results</Link><Link to="/about" className="profile-nav">My Inner</Link></nav></aside><main className="rounded-2xl border border-[#eee5e9] bg-white p-6 shadow-sm sm:p-10"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#765c8d]">Your account</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#302447]">Profile Information</h1><p className="mt-2 text-sm text-slate-500">Manage your personal details and account preferences.</p><form onSubmit={save} className="mt-9 max-w-2xl"><label className="profile-label">Full name<input value={name} onChange={(e) => setName(e.target.value)} className="profile-input" placeholder="Your full name" /></label><label className="profile-label">Email address<input value={user?.email ?? 'No email address'} readOnly className="profile-input bg-[#faf9fb]" /></label><div className="mt-6 rounded-2xl border border-[#eee5e9] bg-[#fcfafc] p-4"><label className="flex items-start gap-3 text-sm leading-6 text-[#6a6473]"><input type="checkbox" checked={marketingEmails} onChange={(e) => void saveMarketing(e.target.checked)} className="mt-1 accent-[#765c8d]" /><span><b className="text-[#302447]">Marketing emails</b><br />Receive occasional updates about new My Inner tests and offers.</span></label>{preferenceError && <p className="mt-2 text-sm text-red-700">{preferenceError}</p>}</div><button className="mt-5 w-full rounded-xl bg-[#765c8d] py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#765c8d]/15 transition hover:bg-[#634a78]">{saved ? 'Changes Saved ✓' : 'Save Changes'}</button></form></main></div></div>;
}
