import { FormEvent, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';
import { AuthArtwork } from '../components/AuthArtwork';
import { PasswordVisibilityIcon } from '../components/PasswordVisibilityIcon';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault(); setError(null); setSubmitting(true);
    try { await login(identifier, password); navigate((location.state as { from?: string } | null)?.from ?? '/tests'); }
    catch (err) { setError(err instanceof ApiError ? err.message : 'Login failed.'); }
    finally { setSubmitting(false); }
  }

  return (
    <div className="min-h-[calc(100vh-74px)] bg-[#f7f3f2] px-4 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto grid min-h-[650px] max-w-6xl overflow-hidden rounded-[2rem] border border-white/80 bg-white/70 shadow-2xl shadow-slate-900/10 lg:grid-cols-[.95fr_1.05fr]">
        <div className="relative hidden overflow-hidden p-10 lg:flex lg:flex-col lg:justify-center">
          <AuthArtwork />
          <div className="relative max-w-sm -translate-y-20"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#765c8d]">Welcome back</p><h1 className="mt-4 text-5xl font-semibold leading-[1.05] tracking-tight text-[#302447]">Know yourself a little better.</h1><p className="mt-5 max-w-xs leading-7 text-[#4e4960]">A calm, personal space to explore your personality, relationships, and inner patterns.</p></div>
        </div>
        <div className="flex items-center justify-center bg-[#fffdfb]/90 px-5 py-10 sm:px-12">
          <div className="w-full max-w-md">
            <div className="mb-8 lg:hidden"><img src="/my-inner-logo.png" alt="My Inner" className="h-16 w-auto object-contain object-left" /></div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#765c8d]">Your journey inward</p><h1 className="mt-3 text-4xl font-semibold tracking-tight text-[#302447]">Welcome back</h1><p className="mt-3 text-[#6a6473]">Sign in to continue your My Inner journey.</p>
            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <label className="block text-sm font-medium text-[#302447]">Email or phone<input required placeholder="you@example.com or 010..." value={identifier} onChange={(e) => setIdentifier(e.target.value)} className="mt-2 w-full rounded-xl border border-[#d9cfdb] bg-white px-4 py-3.5 text-slate-800 outline-none transition placeholder:text-[#aaa2ae] focus:border-[#765c8d] focus:ring-4 focus:ring-[#765c8d]/10" /></label>
              <label className="block text-sm font-medium text-[#302447]">Password<div className="relative mt-2"><input type={showPassword ? 'text' : 'password'} required placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-[#d9cfdb] bg-white px-4 py-3.5 pr-12 text-slate-800 outline-none transition placeholder:text-[#aaa2ae] focus:border-[#765c8d] focus:ring-4 focus:ring-[#765c8d]/10" /><button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#765c8d]"><PasswordVisibilityIcon visible={showPassword} /></button></div></label>
              {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
              <button type="submit" disabled={submitting} className="w-full rounded-full bg-[#765c8d] px-4 py-3.5 font-semibold text-white shadow-lg shadow-[#765c8d]/20 transition hover:-translate-y-0.5 hover:bg-[#634a78] disabled:opacity-60">{submitting ? 'Logging in...' : 'Log in'}</button>
              <Link to="/forgot-password" className="block text-center text-sm font-semibold text-[#765c8d] hover:underline">Forgot Password?</Link>
            </form>
            <div className="my-7 flex items-center gap-3 text-xs uppercase tracking-[0.16em] text-[#aaa2ae]"><span className="h-px flex-1 bg-[#e4dce5]" /> or <span className="h-px flex-1 bg-[#e4dce5]" /></div>
            <p className="text-center text-sm text-[#6a6473]">Don&apos;t have an account? <Link to="/register" className="font-semibold text-[#765c8d] hover:underline">Create an account</Link></p><p className="mt-8 text-center text-xs text-[#aaa2ae]">Your account and saved results are kept private.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
