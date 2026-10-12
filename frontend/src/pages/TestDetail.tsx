import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TestsApi, PurchasesApi, PaymentsApi } from '../api/endpoints';
import { PublicTest } from '../types';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';
import { TestIcon } from '../components/TestIcon';
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import { LoadingScreen } from '../components/LoadingScreen';

export function TestDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [test, setTest] = useState<PublicTest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paymentMode, setPaymentMode] = useState<'paypal' | 'demo' | null>(null);
  const [configuredMode, setConfiguredMode] = useState<'paypal' | 'demo' | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [applyCredit, setApplyCredit] = useState(false);
  const [quote, setQuote] = useState<any>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const purchaseIdRef = useRef<string | null>(null);
  const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID as string | undefined;

  useEffect(() => { if (slug) TestsApi.getBySlug(slug).then((res) => setTest(res.test)).catch((err) => setError(err.message)); }, [slug]);
  useEffect(() => { if (!slug || !user) return; PurchasesApi.entitlement(slug).then((result) => { if (result.owned) navigate(`/tests/${slug}`, { replace: true, state: { owned: true, expiresAt: result.expiresAt } }); }).catch(() => undefined); }, [slug, user, navigate]);
  useEffect(() => { PaymentsApi.mode().then((res) => { setConfiguredMode(res.mode); setPaymentMode(res.mode); }).catch(() => { setConfiguredMode('paypal'); setPaymentMode('paypal'); }); }, []);
  useEffect(() => {
    if (!test || !user) { setQuote(null); return; }
    setQuoteLoading(true);
    const timer = window.setTimeout(() => PurchasesApi.quote(test.slug, couponCode, applyCredit).then((result) => {
      setQuote(result.quote);
      setPaymentMode(result.quote.payableAmountCents === 0 ? 'demo' : configuredMode);
      setError(null);
    }).catch((err) => setError(err instanceof ApiError ? err.message : 'Could not calculate checkout total.')).finally(() => setQuoteLoading(false)), 250);
    return () => window.clearTimeout(timer);
  }, [test, user, couponCode, applyCredit, configuredMode]);

  async function createPayPalOrder() {
    if (!user) { navigate('/login', { state: { from: `/tests/${slug}` } }); throw new Error('Authentication required.'); }
    if (!test) throw new Error('Test is not ready.');
    const purchase = await PurchasesApi.create(test.slug, couponCode, applyCredit);
    purchaseIdRef.current = purchase.purchaseId;
    return purchase.paypalOrderId;
  }
  async function captureApprovedOrder(orderId?: string) {
    const purchaseId = purchaseIdRef.current;
    if (!purchaseId || !orderId) { setError('Payment reference is missing. Please try again.'); return; }
    try { const result = await PurchasesApi.capture(purchaseId, orderId); if (result.purchase.status !== 'paid') throw new Error('Payment could not be completed.'); navigate(`/checkout/success?purchaseId=${purchaseId}&captured=1`); }
    catch (err) { if (err instanceof ApiError && err.status === 401) navigate('/login', { state: { from: `/tests/${slug}` } }); else setError(err instanceof ApiError ? err.message : 'Payment could not be completed right now.'); }
  }
  async function createCreditPurchase() {
    if (!user) { navigate('/login', { state: { from: `/tests/${slug}` } }); return; }
    if (!test) return;
    try { const purchase = await PurchasesApi.create(test.slug, couponCode, applyCredit); navigate(`/checkout/success?purchaseId=${purchase.purchaseId}&captured=1`); }
    catch (err) { setError(err instanceof ApiError ? err.message : 'Checkout could not be completed.'); }
  }

  if (error && !test) return <div className="p-8 text-center text-red-600">{error}</div>;
  if (!test) return <LoadingScreen message="Preparing secure checkout..." detail="Your assessment details are loading." />;
  const currency = quote?.currency ?? test.price.currency ?? 'USD';
  const money = (cents: number) => `${currency} ${(cents / 100).toFixed(2)}`;
  const payableCents = quote?.payableAmountCents ?? test.price.amount;

  return <div className="checkout-page min-h-[calc(100vh-74px)] bg-[#faf9f7] px-4 py-8 sm:px-8 sm:py-10"><div className="mx-auto max-w-5xl">
    <button onClick={() => navigate('/tests')} className="text-sm font-medium text-[#765c8d]">← Back to Tests</button>
    <div className="mt-5"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#765c8d]">Secure checkout</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#302447]">Secure Checkout</h1><p className="mt-2 text-sm text-slate-500">Complete your purchase to access this assessment.</p></div>
    <div className="mt-8 grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
      <section className="rounded-2xl border border-[#eee5e9] bg-white p-7 shadow-sm sm:p-9"><div className="flex items-start gap-4"><span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eee7f7] text-[#765c8d]"><TestIcon slug={test.slug} className="h-9 w-9" /></span><div><h2 className="font-semibold text-[#302447]">{test.name}</h2><p className="mt-1 text-xs text-slate-400">{test.slug.replaceAll('-', ' ')} assessment</p></div></div><p className="mt-8 text-3xl font-semibold tracking-tight text-[#302447]">{money(quote?.originalAmountCents ?? test.price.amount)}</p><div className="mt-5 space-y-3 text-sm text-slate-500"><p>◉ {test.questionCount} questions</p><p>◉ 5-point response scale</p><p>◉ Estimated time: 5–25 minutes</p></div>{test.categories.length > 0 && <div className="mt-8 flex flex-wrap gap-2">{test.categories.slice(0, 4).map((category) => <span key={category.key} className="rounded-full bg-[#f5eff9] px-3 py-1 text-xs text-[#765c8d]">{category.name}</span>)}</div>}</section>
      <section className="rounded-2xl border border-[#eee5e9] bg-white p-7 shadow-sm sm:p-9"><h2 className="text-lg font-semibold text-[#302447]">Payment Details</h2><p className="mt-1 text-xs text-slate-400">{paymentMode === 'demo' ? 'Secure checkout' : 'Pay securely through PayPal Sandbox'}</p>
        <div className="mt-6 rounded-2xl border border-[#eadff0] bg-[#faf6fc] p-5"><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium text-[#302447]">Coupon code<input value={couponCode} onChange={(event) => setCouponCode(event.target.value.toUpperCase())} placeholder="Optional coupon" className="mt-2 w-full rounded-xl border border-[#d9cfdb] bg-white px-4 py-3 outline-none focus:border-[#765c8d]" /></label><label className="flex items-center gap-3 text-sm text-[#62596c] sm:pt-8"><input type="checkbox" checked={applyCredit} onChange={(event) => setApplyCredit(event.target.checked)} className="accent-[#765c8d]" />Apply available referral credit</label></div>{quoteLoading && <p className="mt-3 text-xs text-slate-400">Updating secure total...</p>}{quote && <div className="mt-5 grid grid-cols-2 gap-3 border-t border-[#eadff0] pt-5 text-sm text-[#62596c]"><span>Subtotal</span><span className="text-right">{money(quote.originalAmountCents)}</span><span>Coupon discount</span><span className="text-right text-emerald-700">− {money(quote.couponDiscountCents)}</span><span>Referral credit</span><span className="text-right text-[#765c8d]">− {money(quote.referralCreditAppliedCents)}</span><strong className="mt-2 border-t border-[#eadff0] pt-3 text-[#302447]">Total amount</strong><strong className="mt-2 border-t border-[#eadff0] pt-3 text-right text-[#302447]">{money(quote.payableAmountCents)}</strong></div>}</div>
        <div className="mt-6 rounded-2xl border border-[#eadff0] bg-[#faf6fc] p-5"><div className="flex items-center justify-between gap-4"><span className="text-lg font-bold italic text-[#003087]">{paymentMode === 'demo' ? 'My Inner' : <>Pay<span className="text-[#009cde]">Pal</span></>}</span><span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#765c8d]">{paymentMode === 'demo' ? 'Internal credit' : 'Sandbox'}</span></div><p className="mt-4 text-sm leading-6 text-[#62596c]">{paymentMode === 'demo' ? 'Your secure My Inner credit will be applied after the final amount is confirmed.' : 'Approve this payment with your PayPal Sandbox buyer account. My Inner never collects card details.'}</p></div>
        {!test.available && <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-700">This test is coming soon.</p>}{error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {paymentMode === 'demo' && test.available ? <button onClick={createCreditPurchase} disabled={quoteLoading} className="mt-6 w-full rounded-xl bg-[#765c8d] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#634a78] disabled:opacity-50">{payableCents === 0 ? 'Complete with Referral Credit' : 'Continue securely'}</button> : paymentMode === 'paypal' && paypalClientId && test.available && payableCents > 0 ? <div className="mt-6"><PayPalScriptProvider options={{ clientId: paypalClientId, currency: 'USD', intent: 'capture', components: 'buttons' }}><PayPalButtons style={{ layout: 'vertical', shape: 'rect', label: 'paypal' }} createOrder={createPayPalOrder} onApprove={(data) => captureApprovedOrder(data.orderID)} onCancel={() => setError('Payment was cancelled. No payment was completed.')} onError={() => setError('Payment could not be completed right now. Please try again later.')} /></PayPalScriptProvider></div> : <p className="mt-6 rounded-xl bg-amber-50 p-3 text-sm text-amber-700">{paymentMode === null ? 'Loading payment options...' : 'PayPal is not configured for this frontend.'}</p>}
        <p className="mt-3 text-center text-[11px] text-slate-400">Payment is confirmed by the My Inner backend before access is granted.</p>
      </section>
    </div>
  </div></div>;
}
