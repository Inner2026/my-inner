import { Types } from 'mongoose';
import { Purchase } from '../../models/Purchase';
import { Test } from '../../models/Test';
import { TestVersion } from '../../models/TestVersion';
import { User } from '../../models/User';
import { env } from '../../config/env';
import { AppError } from '../../utils/AppError';
import { createOrder, captureOrder, reconcileCapturedOrder } from './paypal.service';
import { PaymentProviderError, safePaymentLog } from './paymentErrors';

function checkoutExpiry() {
  return new Date(Date.now() + Math.max(1, env.paypalCheckoutTimeoutMinutes) * 60_000);
}

function isExpired(purchase: { expiresAt?: Date | null; createdAt?: Date }) {
  const expiry = purchase.expiresAt ?? (
    purchase.createdAt
      ? new Date(purchase.createdAt.getTime() + Math.max(1, env.paypalCheckoutTimeoutMinutes) * 60_000)
      : null
  );
  return Boolean(expiry && expiry <= new Date());
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

export async function initiatePurchase(userId: Types.ObjectId, testSlug: string) {
  const test = await Test.findOne({ slug: testSlug, active: true });
  if (!test || !test.currentVersionId) {
    throw AppError.notFound('Test not found or not currently available for purchase.');
  }
  const version = await TestVersion.findOne({ _id: test.currentVersionId, status: 'published' });
  if (!version) {
    throw AppError.notFound('Test not found or not currently available for purchase.');
  }

  const user = await User.findById(userId);
  if (!user) throw AppError.unauthorized('User not found.');

  if (!['paypal', 'demo'].includes(env.paymentsMode)) throw AppError.internal('Unsupported payment mode.');

  const activePurchase = await Purchase.findOne({ userId: user._id, testId: test._id, status: { $in: ['pending', 'capturing'] } });
  if (activePurchase) {
    if (isExpired(activePurchase)) {
      await recoverExpiredPurchase(activePurchase);
    } else {
      throw AppError.conflict('This test already has an active checkout.');
    }
  }

  if (env.paymentsMode === 'demo') {
    const demoPurchase = await Purchase.create({
      userId: user._id,
      testId: test._id,
      testVersionId: version._id,
      amount: test.price.amount,
      currency: env.paypalCurrency,
      status: 'paid',
      paymentProvider: 'demo',
      paypalOrderId: `demo-${new Types.ObjectId().toString()}`,
      paidAt: new Date(),
      expiresAt: null
    });
    return { purchase: demoPurchase, approvalUrl: null };
  }

  // Create the Purchase first (status: pending) so we have a stable id to hand to PayPal.
  let purchase;
  try {
    purchase = await Purchase.create({
      userId: user._id,
      testId: test._id,
      testVersionId: version._id,
      amount: test.price.amount,
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

  let order;
  try {
    order = await createOrder({
      purchaseId: purchase._id.toString(),
      testName: test.name,
      amountCents: test.price.amount,
      currency: test.price.currency
    });
  } catch (err) {
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
    return finalDoc ?? (await Purchase.findById(purchaseId))!;
  } catch (err) {
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
