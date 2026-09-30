import { FormEvent, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';
import { AuthArtwork } from '../components/AuthArtwork';
import { PasswordVisibilityIcon } from '../components/PasswordVisibilityIcon';

export function Register() {
  const { register } = useAuth(); const navigate = useNavigate(); const location = useLocation();
  const [mode, setMode] = useState<'email' | 'phone'>('email'); const [username, setUsername] = useState(''); const [email, setEmail] = useState(''); const [phone, setPhone] = useState(''); const [password, setPassword] = useState(''); const [confirmPassword, setConfirmPassword] = useState(''); const [acceptedTerms, setAcceptedTerms] = useState(false); const [marketingEmails, setMarketingEmails] = useState(false); const [showPassword, setShowPassword] = useState(false); const [showConfirmPassword, setShowConfirmPassword] = useState(false); const [error, setError] = useState<string | null>(null); const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault(); setError(null);
    if (!acceptedTerms) { setError('Please accept the Terms & Conditions to continue.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    setSubmitting(true);
    try { await register(mode === 'email' ? { username, email, password, marketingEmails } : { username, phone, password, marketingEmails }); navigate((location.state as { from?: string } | null)?.from ?? '/tests'); }
    catch (err) { setError(err instanceof ApiError ? err.message : 'Registration failed.'); }
    finally { setSubmitting(false); }
  }

  const inputClass = 'mt-2 w-full rounded-xl border border-[#d9cfdb] bg-white px-4 py-3.5 outline-none transition placeholder:text-[#aaa2ae] focus:border-[#765c8d] focus:ring-4 focus:ring-[#765c8d]/10';

  return (
    <div className="min-h-[calc(100vh-74px)] bg-[#f7f3f2] px-4 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto grid min-h-[650px] max-w-6xl overflow-hidden rounded-[2rem] border border-white/80 bg-white/70 shadow-2xl shadow-slate-900/10 lg:grid-cols-[1.05fr_.95fr]">
        <div className="relative hidden overflow-hidden p-10 lg:flex lg:flex-col lg:justify-center"><AuthArtwork /><div className="relative max-w-sm -translate-y-20"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#765c8d]">Start your journey</p><h1 className="mt-4 text-5xl font-semibold leading-[1.05] tracking-tight text-[#302447]">Your journey inward starts here.</h1><p className="mt-5 max-w-xs leading-7 text-[#4e4960]">Create an account to save your test results and revisit your self-discovery journey anytime.</p></div></div>
        <div className="flex items-center justify-center bg-[#fffdfb]/90 px-5 py-10 sm:px-12"><div className="w-full max-w-md">
          <div className="mb-8 lg:hidden"><img src="/my-inner-logo.png" alt="My Inner" className="h-16 w-auto object-contain object-left" /></div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#765c8d]">Make it personal</p><h1 className="mt-3 text-4xl font-semibold tracking-tight text-[#302447]">Create your account</h1><p className="mt-3 text-[#6a6473]">Save your results and access your tests from one place.</p>
          <div className="mt-7 grid grid-cols-2 rounded-xl bg-[#f1ebf2] p-1 text-sm font-medium"><button type="button" onClick={() => setMode('email')} className={`rounded-lg px-3 py-2.5 transition ${mode === 'email' ? 'bg-white text-[#765c8d] shadow-sm' : 'text-[#81798a]'}`}>Use email</button><button type="button" onClick={() => setMode('phone')} className={`rounded-lg px-3 py-2.5 transition ${mode === 'phone' ? 'bg-white text-[#765c8d] shadow-sm' : 'text-[#81798a]'}`}>Use phone</button></div>
          <form onSubmit={handleSubmit} className="mt-5 space-y-5">
            <label className="block text-sm font-medium text-[#302447]">Username<input required minLength={3} placeholder="Choose a username" value={username} onChange={(e) => setUsername(e.target.value)} className={inputClass} /></label>
            {mode === 'email' ? <label className="block text-sm font-medium text-[#302447]">Email address<input type="email" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} /></label> : <label className="block text-sm font-medium text-[#302447]">Phone number<input type="tel" required placeholder="010 1234 5678" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} /></label>}
            <label className="block text-sm font-medium text-[#302447]">Password<div className="relative mt-2"><input type={showPassword ? 'text' : 'password'} required minLength={8} placeholder="At least 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} className={`${inputClass} mt-0 pr-12`} /><button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#765c8d]"><PasswordVisibilityIcon visible={showPassword} /></button></div></label>
            <label className="block text-sm font-medium text-[#302447]">Confirm password<div className="relative mt-2"><input type={showConfirmPassword ? 'text' : 'password'} required minLength={8} placeholder="Repeat your password" value={confirmPassword} onChange={(e) => setConfirmPassword((e.target as HTMLInputElement).value)} className={`${inputClass} mt-0 pr-12`} /><button type="button" onClick={() => setShowConfirmPassword((visible) => !visible)} aria-label={showConfirmPassword ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#765c8d]"><PasswordVisibilityIcon visible={showConfirmPassword} /></button></div></label>
            <label className="flex items-start gap-3 text-sm leading-5 text-[#6a6473]"><input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} className="mt-1 accent-[#765c8d]" /><span>I agree to the <Link to="/terms" target="_blank" className="font-semibold text-[#765c8d] underline underline-offset-2">Terms &amp; Conditions</Link>.</span></label>
            {mode === 'email' && <label className="flex items-start gap-3 text-sm leading-5 text-[#6a6473]"><input type="checkbox" checked={marketingEmails} onChange={(e) => setMarketingEmails(e.target.checked)} className="mt-1 accent-[#765c8d]" /><span>Send me occasional updates about new My Inner tests and offers. You can unsubscribe anytime.</span></label>}
            {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}<button type="submit" disabled={submitting} className="w-full rounded-full bg-[#765c8d] px-4 py-3.5 font-semibold text-white shadow-lg shadow-[#765c8d]/20 transition hover:-translate-y-0.5 hover:bg-[#634a78] disabled:opacity-60">{submitting ? 'Creating account...' : 'Create account'}</button>
          </form>
          <p className="mt-7 text-center text-sm text-[#6a6473]">Already have an account? <Link to="/login" className="font-semibold text-[#765c8d] hover:underline">Log in</Link></p><p className="mt-8 text-center text-xs leading-5 text-[#aaa2ae]">Your account and saved results are kept private.</p>
        </div></div>
      </div>
    </div>
  );
}
