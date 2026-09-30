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
  const purchaseIdRef = useRef<string | null>(null);
  const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID as string | undefined;

  useEffect(() => {
    if (slug) TestsApi.getBySlug(slug).then((res) => setTest(res.test)).catch((err) => setError(err.message));
  }, [slug]);

  useEffect(() => {
    PaymentsApi.mode().then((res) => setPaymentMode(res.mode)).catch(() => setPaymentMode('paypal'));
  }, []);

  async function createPayPalOrder() {
    if (!user) { navigate('/login', { state: { from: `/tests/${slug}` } }); throw new Error('Authentication required.'); }
    if (!test) throw new Error('Test is not ready.');
    setError(null);
    try {
      const purchase = await PurchasesApi.create(test.slug);
      purchaseIdRef.current = purchase.purchaseId;
      return purchase.paypalOrderId;
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        localStorage.removeItem('myinner_token');
        navigate('/login', { state: { from: `/tests/${slug}` } });
      }
      throw err;
    }
  }

  async function captureApprovedOrder(orderId?: string) {
    const purchaseId = purchaseIdRef.current;
    if (!purchaseId || !orderId) { setError('Payment reference is missing. Please try again.'); return; }
    try {
      const result = await PurchasesApi.capture(purchaseId, orderId);
      if (result.purchase.status !== 'paid') { setError('Payment could not be completed right now. Please try again later.'); return; }
      navigate(`/checkout/success?purchaseId=${purchaseId}&captured=1`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        navigate('/login', { state: { from: `/tests/${slug}` } });
        return;
      }
      setError(err instanceof ApiError ? err.message : 'Payment could not be completed right now. Please try again later.');
    }
  }

  async function createDemoPurchase() {
    if (!user) { navigate('/login', { state: { from: `/tests/${slug}` } }); return; }
    if (!test) return;
    setError(null);
    try {
      const purchase = await PurchasesApi.create(test.slug);
      navigate(`/checkout/success?purchaseId=${purchase.purchaseId}&captured=1`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Demo payment could not be completed.');
    }
  }

  if (error && !test) return <div className="p-8 text-center text-red-600">{error}</div>;
  if (!test) return <LoadingScreen message="Preparing secure checkout..." detail="Your assessment details are loading." />;
  const price = `$${(test.price.amount / 100).toFixed(2)}`;

  return <div className="checkout-page min-h-[calc(100vh-74px)] px-4 py-10 sm:px-8"><div className="mx-auto max-w-6xl">
    <button onClick={() => navigate('/tests')} className="text-xs font-medium text-[#765c8d]">← Back to Tests</button>
    <div className="mt-4"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#765c8d]">Secure checkout</p><h1 className="mt-1 text-3xl font-semibold tracking-tight text-[#302447]">Secure Checkout</h1><p className="mt-2 text-sm text-slate-500">Complete your purchase to access this assessment. Retakes are free for 90 days after payment.</p></div>
    <div className="mt-8 grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
      <section className="rounded-2xl border border-[#eee5e9] bg-white p-7 shadow-sm sm:p-9"><div className="flex items-start gap-4"><span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#eee7f7] text-[#765c8d]"><TestIcon slug={test.slug} className="h-9 w-9" /></span><div><h2 className="font-semibold text-[#302447]">{test.name}</h2><p className="mt-1 text-xs text-slate-400">{test.slug.replaceAll('-', ' ')} assessment</p></div></div><p className="mt-8 text-3xl font-semibold tracking-tight text-[#302447]">{price}</p><div className="mt-5 space-y-3 text-sm text-slate-500"><p>◉ {test.questionCount} questions</p><p>◉ 5-point response scale</p><p>◉ Estimated time: 5–25 minutes</p></div>{test.categories.length > 0 && <div className="mt-8 flex flex-wrap gap-2">{test.categories.slice(0, 4).map((c) => <span key={c.key} className="rounded-full bg-[#f5eff9] px-3 py-1 text-xs text-[#765c8d]">{c.name}</span>)}</div>}</section>
      <section className="rounded-2xl border border-[#eee5e9] bg-white p-7 shadow-sm sm:p-9"><h2 className="text-lg font-semibold text-[#302447]">Payment Details</h2><p className="mt-1 text-xs text-slate-400">{paymentMode === 'demo' ? 'Secure local demo checkout' : 'Pay securely through PayPal Sandbox'}</p><div className="mt-7 rounded-2xl border border-[#eadff0] bg-[#faf6fc] p-5"><div className="flex items-center justify-between gap-4"><span className="text-lg font-bold italic text-[#003087]">{paymentMode === 'demo' ? 'Demo Payment' : <>Pay<span className="text-[#009cde]">Pal</span></>}</span><span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#765c8d]">{paymentMode === 'demo' ? 'Local only' : 'Sandbox'}</span></div><p className="mt-4 text-sm leading-6 text-[#62596c]">{paymentMode === 'demo' ? 'This demo checkout is available only in the backend development environment. No PayPal request is made.' : 'Approve this payment with your PayPal Sandbox buyer account. My Inner never collects card details.'}</p></div>{!test.available && <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-700">This test is coming soon.</p>}{error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}{paymentMode === 'demo' && test.available ? <button onClick={createDemoPurchase} className="mt-6 w-full rounded-xl bg-[#765c8d] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#634a78]">Continue with Demo Payment</button> : paymentMode === 'paypal' && paypalClientId && test.available ? <div className="mt-6"><PayPalScriptProvider options={{ clientId: paypalClientId, currency: 'USD', intent: 'capture', components: 'buttons' }}><PayPalButtons style={{ layout: 'vertical', shape: 'rect', label: 'paypal' }} createOrder={createPayPalOrder} onApprove={(data) => captureApprovedOrder(data.orderID)} onCancel={() => setError('Payment was cancelled. No payment was completed.')} onError={() => setError('Payment could not be completed right now. Please try again later.')} /></PayPalScriptProvider></div> : <p className="mt-6 rounded-xl bg-amber-50 p-3 text-sm text-amber-700">{paymentMode === null ? 'Loading payment options...' : 'PayPal is not configured for this frontend.'}</p>}<p className="mt-3 text-center text-[11px] text-slate-400">Payment is captured and verified by the My Inner backend before access is granted.</p></section>
    </div><p className="mt-6 text-xs text-slate-400">Secure payment powered by PayPal Sandbox</p>
  </div></div>;
}
