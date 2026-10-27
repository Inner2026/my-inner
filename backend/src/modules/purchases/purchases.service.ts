import { Types } from 'mongoose';
import { Purchase } from '../../models/Purchase';
import { Test } from '../../models/Test';
import { TestVersion } from '../../models/TestVersion';
import { User } from '../../models/User';
import { env } from '../../config/env';
import { AppError } from '../../utils/AppError';
import { createOrder, captureOrder, reconcileCapturedOrder } from './paypal.service';
import { PaymentProviderError, safePaymentLog } from './paymentErrors';
import { processReferralReward } from '../referrals/referrals.service';
import { isDbConnected } from '../../config/db';
import { calculateCheckout, reserveCredit, consumeCredit, releaseCredit } from './checkout.service';

async function awardReferralIfAvailable(userId: Types.ObjectId, purchaseId: Types.ObjectId) {
  // Payment confirmation remains successful even if a later ledger write needs
  // retrying. The unique ledger key makes this safe to retry from a callback.
  if (isDbConnected()) await processReferralReward(userId, purchaseId);
}

async function finalizeCreditAndReward(purchase: any) {
  if (isDbConnected()) {
    await consumeCredit(purchase);
    await awardReferralIfAvailable(purchase.userId, purchase._id);
  }
}

function checkoutExpiry() {
  return new Date(Date.now() + Math.max(1, env.paypalCheckoutTimeoutMinutes) * 60_000);
}

export const PURCHASE_ACCESS_WINDOW_DAYS = 90;
const PURCHASE_ACCESS_WINDOW_MS = PURCHASE_ACCESS_WINDOW_DAYS * 24 * 60 * 60 * 1000;

export async function getActivePaidPurchase(userId: Types.ObjectId, testId: Types.ObjectId) {
  const cutoff = new Date(Date.now() - PURCHASE_ACCESS_WINDOW_MS);
  return Purchase.findOne({ userId, testId, status: 'paid', paidAt: { $gt: cutoff } }).sort({ paidAt: -1 });
}

function isExpired(purchase: { expiresAt?: Date | null; createdAt?: Date }) {
  const expiry = purchase.expiresAt ?? (
    purchase.createdAt
      ? new Date(purchase.createdAt.getTime() + Math.max(1, env.paypalCheckoutTimeoutMinutes) * 60_000)
      : null
  );
  return Boolean(expiry && expiry <= new Date());
}

/** Cancel a still-pending (never captured) checkout and give back any reserved referral credit. */
async function cancelUnpaidCheckout(purchase: any) {
  const result = await Purchase.updateOne({ _id: purchase._id, status: 'pending' }, { $set: { status: 'failed' } });
  if (result.modifiedCount === 1) await releaseCredit(purchase);
}

async function recoverExpiredPurchase(purchase: any) {
  if (purchase.status === 'pending') {
    await Purchase.updateOne(
      { _id: purchase._id, status: 'pending', expiresAt: purchase.expiresAt },
      { $set: { status: 'failed' } }
    );
    return;
  }

  if (purchase.status !== 'capturing') return;

  try {
    const result = await reconcileCapturedOrder({
      orderId: purchase.paypalOrderId,
      amountCents: purchase.amount,
      currency: purchase.currency
    });
    await Purchase.updateOne(
      { _id: purchase._id, paypalOrderId: purchase.paypalOrderId, status: 'capturing' },
      { $set: { status: 'paid', paypalCaptureId: result.captureId, paidAt: new Date() } }
    );
    await finalizeCreditAndReward(purchase);
  } catch (err) {
    if (err instanceof PaymentProviderError) safePaymentLog(err, purchase._id.toString());
    if (err instanceof PaymentProviderError && err.metadata.retryable) {
      throw AppError.conflict('Payment confirmation is temporarily unavailable. Please try again shortly.');
    }
    await Purchase.updateOne(
      { _id: purchase._id, status: 'capturing' },
      { $set: { status: 'failed' } }
    );
  }
}

export async function initiatePurchase(userId: Types.ObjectId, testSlug: string, couponCode?: string, applyCredit = false) {
  const quote = await calculateCheckout(userId, testSlug, couponCode, applyCredit);

  const existingEntitlement = await getActivePaidPurchase(userId, quote.testId);
  if (existingEntitlement) throw AppError.conflict('You already own this test. Your access is valid for 90 days.');

  const user = await User.findById(userId);
  if (!user) throw AppError.unauthorized('User not found.');

  if (!['paypal', 'demo'].includes(env.paymentsMode)) throw AppError.internal('Unsupported payment mode.');

  const activePurchase = await Purchase.findOne({ userId: user._id, testId: quote.testId, status: { $in: ['pending', 'capturing'] } });
  if (activePurchase) {
    if (activePurchase.status === 'pending') {
      // An unpaid checkout (e.g. a PayPal window the user abandoned, or a
      // checkout started before applying a coupon) must not block a new one.
      // Nothing was charged: PayPal money only moves when our backend
      // captures the order, and capture refuses non-pending purchases.
      await cancelUnpaidCheckout(activePurchase);
    } else if (isExpired(activePurchase)) {
      await recoverExpiredPurchase(activePurchase);
    } else {
      throw AppError.conflict('Your previous payment for this test is still being confirmed. Please wait a minute and refresh the page.');
    }
  }

  if (quote.payableAmountCents === 0) {
    const internalPurchase = await Purchase.create({ userId: user._id, testId: quote.testId, testVersionId: quote.testVersionId, amount: 0, originalAmount: quote.originalAmountCents, couponCode: quote.couponCode, couponDiscountAmount: quote.couponDiscountCents, creditAppliedCents: quote.referralCreditAppliedCents, currency: quote.currency, status: 'pending', paymentProvider: 'internal', paypalOrderId: `internal-${new Types.ObjectId().toString()}`, paidAt: null, expiresAt: null });
    try {
      await reserveCredit(user._id, internalPurchase._id, quote.referralCreditAppliedCents);
      await Purchase.updateOne({ _id: internalPurchase._id, status: 'pending' }, { $set: { status: 'paid', paidAt: new Date() } });
      internalPurchase.status = 'paid';
      await finalizeCreditAndReward(internalPurchase);
      return { purchase: internalPurchase, approvalUrl: null };
    } catch (error) {
      await releaseCredit(internalPurchase);
      await Purchase.updateOne({ _id: internalPurchase._id, status: 'pending' }, { $set: { status: 'failed' } });
      throw error;
    }
  }

  if (env.paymentsMode === 'demo') {
    const demoPurchase = await Purchase.create({
      userId: user._id,
      testId: quote.testId,
      testVersionId: quote.testVersionId,
      amount: quote.payableAmountCents,
      originalAmount: quote.originalAmountCents,
      couponCode: quote.couponCode,
      couponDiscountAmount: quote.couponDiscountCents,
      creditAppliedCents: quote.referralCreditAppliedCents,
      currency: env.paypalCurrency,
      status: quote.referralCreditAppliedCents ? 'pending' : 'paid',
      paymentProvider: quote.payableAmountCents === 0 ? 'internal' : 'demo',
      paypalOrderId: `demo-${new Types.ObjectId().toString()}`,
      paidAt: new Date(),
      expiresAt: null
    });
    if (quote.referralCreditAppliedCents) {
      await reserveCredit(user._id, demoPurchase._id, quote.referralCreditAppliedCents);
      await Purchase.updateOne({ _id: demoPurchase._id, status: 'pending' }, { $set: { status: 'paid', paidAt: new Date() } });
      demoPurchase.status = 'paid';
    }
    await finalizeCreditAndReward(demoPurchase);
    return { purchase: demoPurchase, approvalUrl: null };
  }

  // Create the Purchase first (status: pending) so we have a stable id to hand to PayPal.
  let purchase;
  try {
    purchase = await Purchase.create({
      userId: user._id,
      testId: quote.testId,
      testVersionId: quote.testVersionId,
      amount: quote.payableAmountCents,
      originalAmount: quote.originalAmountCents,
      couponCode: quote.couponCode,
      couponDiscountAmount: quote.couponDiscountCents,
      creditAppliedCents: quote.referralCreditAppliedCents,
      currency: env.paypalCurrency,
      status: 'pending',
      paymentProvider: 'paypal',
      expiresAt: checkoutExpiry(),
      paypalOrderId: `pending-${new Types.ObjectId().toString()}` // replaced immediately below; keeps the unique index satisfied
    });
  } catch (err: any) {
    if (err?.code === 11000) throw AppError.conflict('This test already has an active checkout.');
    throw err;
  }

  if (quote.referralCreditAppliedCents) {
    try { await reserveCredit(user._id, purchase._id, quote.referralCreditAppliedCents); }
    catch (error) { await Purchase.updateOne({ _id: purchase._id, status: 'pending' }, { $set: { status: 'failed' } }); throw error; }
  }

  let order;
  try {
    order = await createOrder({
      purchaseId: purchase._id.toString(),
      testName: quote.testName,
      amountCents: quote.payableAmountCents,
      currency: quote.currency
    });
  } catch (err) {
    await releaseCredit(purchase);
    await Purchase.updateOne({ _id: purchase._id, status: 'pending' }, { $set: { status: 'failed' } });
    if (err instanceof PaymentProviderError) safePaymentLog(err, purchase._id.toString());
    throw err;
  }

  purchase.paypalOrderId = order.id;
  await purchase.save();

  return { purchase, approvalUrl: order.approveUrl };
}

export async function getPurchaseStatus(userId: Types.ObjectId, purchaseId: string) {
  const purchase = await Purchase.findOne({ _id: purchaseId, userId });
  if (!purchase) throw AppError.notFound('Purchase not found.');
  return purchase;
}

/**
 * Called when the buyer is redirected back from PayPal after approving the
 * order. Landing on our return_url is NOT itself treated as proof of
 * payment -- PayPal's Orders API requires an explicit capture call, and it
 * is PayPal's response to THAT call (not the browser redirect) that
 * authoritatively confirms payment. This mirrors the previous Stripe-webhook
 * trust model: the frontend can only trigger a backend-verified check, never
 * assert payment itself.
 *
 * Concurrency-safe the same way attempt submission is: an atomic conditional
 * update claims the purchase (pending -> capturing) before calling PayPal,
 * so a webhook delivery racing the browser's own return-triggered capture
 * call can't both call PayPal's capture endpoint at once. A failed capture
 * call (network/API error, not a legitimate decline) releases the claim
 * back to pending so it can be retried.
 */
export async function capturePurchase(userId: Types.ObjectId, purchaseId: string, approvedOrderId?: string) {
  const existing = await Purchase.findOne({ _id: purchaseId, userId });
  if (!existing) throw AppError.notFound('Purchase not found.');
  if (approvedOrderId && existing.paypalOrderId !== approvedOrderId) throw AppError.badRequest('Payment reference is invalid.');
  if (existing.status === 'paid') return existing; // already confirmed -- no-op
  if (existing.status === 'failed' || existing.status === 'refunded') throw AppError.conflict('Payment is no longer payable. Start a new checkout.');

  const claimed = await Purchase.findOneAndUpdate(
    { _id: purchaseId, userId, status: 'pending' },
    { $set: { status: 'capturing' } },
    { new: true }
  );
  if (!claimed) {
    const current = await Purchase.findOne({ _id: purchaseId, userId });
    if (current?.status === 'paid') return current;
    throw AppError.conflict('This purchase is already being processed or is not payable.');
  }

  try {
    let result;
    try {
      result = await captureOrder(claimed.paypalOrderId, { amountCents: claimed.amount, currency: claimed.currency });
    } catch (err) {
      if (err instanceof PaymentProviderError && err.code === 'PAYMENT_ALREADY_PROCESSED') {
        result = await reconcileCapturedOrder({
          orderId: claimed.paypalOrderId,
          amountCents: claimed.amount,
          currency: claimed.currency
        });
      } else {
        throw err;
      }
    }
    if (result.status !== 'COMPLETED') {
      await Purchase.updateOne({ _id: purchaseId, status: 'capturing' }, { $set: { status: 'failed' } });
      throw AppError.badRequest(`Payment was not completed (PayPal status: ${result.status}).`);
    }

    const update: Record<string, unknown> = { status: 'paid', paidAt: new Date() };
    if (result.captureId) update.paypalCaptureId = result.captureId;
    const finalDoc = await Purchase.findOneAndUpdate({ _id: purchaseId, status: 'capturing' }, { $set: update }, { new: true });
    if (finalDoc) await awardReferralIfAvailable(finalDoc.userId, finalDoc._id);
    return finalDoc ?? (await Purchase.findById(purchaseId))!;
  } catch (err) {
    await releaseCredit(claimed);
    if (err instanceof PaymentProviderError) {
      safePaymentLog(err, purchaseId);
    }
    const terminalFailure = err instanceof PaymentProviderError && (
      err.code === 'PAYPAL_COMPLIANCE_VIOLATION' ||
      err.code === 'PAYMENT_ALREADY_PROCESSED' ||
      err.code === 'PAYMENT_INVALID' ||
      err.code === 'PAYPAL_CAPTURE_FAILED'
    );
    const retryableFailure = err instanceof PaymentProviderError && err.metadata.retryable === true;
    if (terminalFailure && !retryableFailure) {
      await Purchase.updateOne({ _id: purchaseId, status: 'capturing' }, { $set: { status: 'failed' } });
      if (err instanceof PaymentProviderError && err.code === 'PAYMENT_ALREADY_PROCESSED') throw AppError.conflict('Payment has already been processed or is not payable.');
      throw AppError.badRequest('Payment could not be completed right now. Please try again later.');
    }
    if (retryableFailure) {
      await Purchase.updateOne({ _id: purchaseId, status: 'capturing' }, { $set: { status: 'pending' } });
      throw AppError.conflict('Payment confirmation is temporarily unavailable. Please try again shortly.');
    }
    // No-op if the doc already moved on (e.g. to 'failed' just above, or was
    // captured by a concurrent webhook delivery) -- filter-guarded, same as
    // the attempt-submission claim release.
    await Purchase.updateOne({ _id: purchaseId, status: 'capturing' }, { $set: { status: 'pending' } });
    throw err;
  }
}
