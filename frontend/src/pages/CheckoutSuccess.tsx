import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PurchasesApi, AttemptsApi } from '../api/endpoints';
import { ApiError } from '../api/client';

/**
 * Landed on after the buyer approves payment on PayPal. We do NOT trust the
 * redirect itself as proof of payment: landing here only triggers a
 * backend-authoritative capture call against PayPal's own API
 * (PurchasesApi.capture -> purchases.service.ts::capturePurchase), and it is
 * PayPal's response to that call -- not the browser redirect -- that
 * confirms payment. A PayPal webhook can also complete the capture
 * concurrently (e.g. if this call loses a race, or the buyer reloads), so a
 * failed/conflicting capture attempt falls back to polling purchase status
 * rather than immediately surfacing an error.
 */
export function CheckoutSuccess() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'checking' | 'paid' | 'pending' | 'error'>('checking');
  const [error, setError] = useState<string | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [testName, setTestName] = useState('Your test');
  const [amount, setAmount] = useState<string>('');

  const purchaseId = params.get('purchaseId');
  const paypalOrderId = params.get('token') ?? undefined;
  const alreadyCaptured = params.get('captured') === '1';

  useEffect(() => {
    if (!purchaseId) {
      setStatus('error');
      setError('Missing purchase reference.');
      return;
    }

    let cancelled = false;

    async function startAttempt() {
      const { attempt } = await AttemptsApi.create(purchaseId!);
      if (!cancelled) {
        setAttemptId(attempt._id);
        const detail = await AttemptsApi.get(attempt._id);
        const test = detail.attempt?.testId;
        if (typeof test === 'object' && test) setTestName(test.name || 'Your test');
        const purchase = await PurchasesApi.get(purchaseId!);
        if (purchase.purchase?.amount) setAmount(`$${(purchase.purchase.amount / 100).toFixed(2)}`);
      }
    }

    async function pollUntilPaid(attemptsLeft: number) {
      if (cancelled) return;
      try {
        const { purchase } = await PurchasesApi.get(purchaseId!);
        if (purchase.status === 'paid') {
          setStatus('paid');
          await startAttempt();
        } else if (purchase.status === 'pending' && attemptsLeft > 0) {
          // A transient network error or a competing return-page request can
          // leave a PayPal-approved order pending. Retry the backend-authoritative
          // capture instead of polling the same unchanged document forever.
          try {
            const retry = await PurchasesApi.capture(purchaseId!, paypalOrderId);
            if (retry.purchase.status === 'paid') {
              setStatus('paid');
              await startAttempt();
              return;
            }
          } catch {
            // Keep polling; the backend claim lock prevents concurrent captures.
          }
          setStatus('pending');
          setTimeout(() => pollUntilPaid(attemptsLeft - 1), 2000);
        } else if (purchase.status === 'capturing' && attemptsLeft > 0) {
          setStatus('pending');
          setTimeout(() => pollUntilPaid(attemptsLeft - 1), 2000);
        } else {
          setStatus('error');
          setError(`Payment was not completed. Current status: ${purchase.status ?? 'unknown'}. Please try again.`);
        }
      } catch (err) {
        if (!cancelled) {
          if (err instanceof ApiError && err.status === 401) {
            navigate('/login', { state: { from: `/checkout/success?purchaseId=${purchaseId}&captured=${alreadyCaptured ? '1' : ''}` } });
            return;
          }
          setStatus('error');
          setError(err instanceof Error ? err.message : 'Something went wrong.');
        }
      }
    }

    async function run() {
      if (alreadyCaptured) {
        try {
          const { purchase } = await PurchasesApi.get(purchaseId!);
          if (purchase.status === 'paid') {
            setStatus('paid');
            await startAttempt();
          } else {
            setStatus('error');
            setError('Payment could not be completed right now. Please try again later.');
          }
        } catch (err) {
          if (err instanceof ApiError && err.status === 401) {
            navigate('/login', { state: { from: `/checkout/success?purchaseId=${purchaseId}&captured=1` } });
            return;
          }
          setStatus('error');
          setError(err instanceof ApiError ? err.message : 'Payment could not be confirmed.');
        }
        return;
      }
      try {
        const { purchase } = await PurchasesApi.capture(purchaseId!, paypalOrderId);
        if (purchase.status === 'paid') {
          setStatus('paid');
          await startAttempt();
          return;
        }
      } catch (err) {
        // A concurrent webhook delivery may already be capturing/have
        // captured this purchase -- fall back to polling only for that
        // expected conflict. PayPal/API failures should be shown immediately.
        if (err instanceof ApiError && err.status === 409) {
          await pollUntilPaid(15);
          return;
        }
        if (err instanceof ApiError && err.status === 401) {
          navigate('/login', { state: { from: `/checkout/success?purchaseId=${purchaseId}&captured=1` } });
          return;
        }
        setStatus('error');
        setError(err instanceof ApiError ? err.message : 'PayPal could not confirm this payment. Please try again.');
        return;
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [purchaseId, paypalOrderId, alreadyCaptured, navigate]);

  return (
    <div className="success-page min-h-[calc(100vh-74px)] px-4 py-12 sm:py-16">
      {status === 'checking' || status === 'pending' ? (
        <div className="mx-auto max-w-md rounded-3xl bg-white p-10 text-center shadow-sm"><p className="text-slate-600">Confirming your payment...</p></div>
      ) : status === 'error' ? (
        <div className="mx-auto max-w-md rounded-3xl bg-white p-10 text-center shadow-sm"><p className="text-red-600">{error}</p></div>
      ) : (
        <div className="success-card mx-auto max-w-xl rounded-[1.75rem] bg-white px-6 py-10 text-center shadow-[0_20px_60px_rgba(73,57,88,0.09)] sm:px-16">
          <div className="success-check mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#397e7c] text-3xl text-white shadow-lg shadow-[#397e7c]/20">✓</div>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-[#765c8d]">My Inner</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#302447] sm:text-4xl">You’re ready to begin!</h1>
          <p className="mt-3 text-sm text-slate-500">Your access to this assessment is confirmed.</p>
          <div className="mt-8 flex items-center gap-4 rounded-2xl bg-[#faf6fc] p-4 text-left"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#eee7f7] text-[#765c8d]">✦</span><div className="min-w-0 flex-1"><p className="font-semibold text-[#302447]">{testName}</p><p className="mt-1 text-xs text-slate-400">Order confirmed</p></div><p className="font-semibold text-[#302447]">{amount}</p></div>
          <p className="mt-7 text-sm text-slate-500">You can now access your test from your account.</p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row"><button onClick={() => attemptId && navigate(`/attempts/${attemptId}/instructions`)} className="rounded-full bg-[#765c8d] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#634a78]">Go to My Tests →</button><button onClick={() => navigate('/tests')} className="rounded-full border border-[#cfc3d7] px-6 py-3 text-sm font-semibold text-[#62596c] transition hover:bg-[#faf6fc]">Explore More Tests</button></div>
        </div>
      )}
    </div>
  );
}
