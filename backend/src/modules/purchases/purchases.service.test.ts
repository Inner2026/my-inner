jest.mock('../../models/Purchase', () => ({
  Purchase: {
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    updateOne: jest.fn(),
    findById: jest.fn()
  }
}));
jest.mock('./paypal.service', () => ({
  createOrder: jest.fn(),
  captureOrder: jest.fn(),
  reconcileCapturedOrder: jest.fn()
}));

import { Purchase } from '../../models/Purchase';
import { captureOrder, reconcileCapturedOrder } from './paypal.service';
import { capturePurchase } from './purchases.service';
import { PaymentProviderError } from './paymentErrors';

const userId = 'user-1' as any;
const purchaseId = 'purchase-1';

/**
 * Minimal in-memory stand-in for the atomic conditional updates the real
 * Mongo driver performs: an update only "matches" (and mutates state) when
 * the filter's status equals the document's current status -- same style as
 * attempts.service.test.ts, since capturePurchase uses the identical
 * claim/release pattern.
 */
function installFakePurchaseStore(initialStatus: string) {
  let status = initialStatus;
  let paypalCaptureId: string | null = null;
  const doc = () => ({ _id: purchaseId, userId, paypalOrderId: 'order-123', amount: 499, currency: 'USD', status, paypalCaptureId });

  (Purchase.findOne as jest.Mock).mockImplementation(async () => doc());
  (Purchase.findOneAndUpdate as jest.Mock).mockImplementation(async (filter: any, update: any) => {
    if (filter.status !== undefined && filter.status !== status) return null;
    status = update.$set.status;
    if (update.$set.paypalCaptureId !== undefined) paypalCaptureId = update.$set.paypalCaptureId;
    return doc();
  });
  (Purchase.updateOne as jest.Mock).mockImplementation(async (filter: any, update: any) => {
    if (filter.status !== undefined && filter.status !== status) return { modifiedCount: 0 };
    status = update.$set.status;
    return { modifiedCount: 1 };
  });
  (Purchase.findById as jest.Mock).mockImplementation(async () => doc());

  return { getStatus: () => status, getCaptureId: () => paypalCaptureId };
}

describe('capturePurchase', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('is a no-op if the purchase is already paid', async () => {
    installFakePurchaseStore('paid');
    const result = await capturePurchase(userId, purchaseId);
    expect(result.status).toBe('paid');
    expect(captureOrder).not.toHaveBeenCalled();
  });

  it('claims pending -> capturing -> paid on a successful PayPal capture', async () => {
    const store = installFakePurchaseStore('pending');
    (captureOrder as jest.Mock).mockResolvedValue({ status: 'COMPLETED', captureId: 'CAP-1' });

    const result = await capturePurchase(userId, purchaseId);

    expect(result.status).toBe('paid');
    expect(store.getStatus()).toBe('paid');
    expect(store.getCaptureId()).toBe('CAP-1');
    expect(captureOrder).toHaveBeenCalledWith('order-123', { amountCents: 499, currency: 'USD' });
  });

  it('only allows one of two concurrent capture calls to win the claim; the other is rejected', async () => {
    installFakePurchaseStore('pending');
    (captureOrder as jest.Mock).mockResolvedValue({ status: 'COMPLETED', captureId: 'CAP-1' });

    const [r1, r2] = await Promise.allSettled([capturePurchase(userId, purchaseId), capturePurchase(userId, purchaseId)]);

    const fulfilled = [r1, r2].filter((r) => r.status === 'fulfilled');
    const rejected = [r1, r2].filter((r) => r.status === 'rejected');
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(captureOrder).toHaveBeenCalledTimes(1);
  });

  it('marks the purchase failed (not paid) when PayPal reports a non-COMPLETED status', async () => {
    const store = installFakePurchaseStore('pending');
    (captureOrder as jest.Mock).mockResolvedValue({ status: 'DECLINED', captureId: null });

    await expect(capturePurchase(userId, purchaseId)).rejects.toThrow(/DECLINED/);
    expect(store.getStatus()).toBe('failed');
  });

  it('releases the claim back to pending (for retry) if the PayPal capture call itself errors', async () => {
    const store = installFakePurchaseStore('pending');
    (captureOrder as jest.Mock).mockRejectedValue(new Error('network error'));

    await expect(capturePurchase(userId, purchaseId)).rejects.toThrow('network error');
    expect(store.getStatus()).toBe('pending');
  });

  it('marks a compliance violation failed and never treats it as paid', async () => {
    const store = installFakePurchaseStore('pending');
    (captureOrder as jest.Mock).mockRejectedValue(new PaymentProviderError('PAYPAL_COMPLIANCE_VIOLATION', 'PayPal capture failed.', { httpStatus: 422, issue: 'COMPLIANCE_VIOLATION', debugId: 'safe-debug' }));

    await expect(capturePurchase(userId, purchaseId)).rejects.toThrow(/Payment could not be completed/);
    expect(store.getStatus()).toBe('failed');
    expect(store.getStatus()).not.toBe('paid');
  });

  it('rejects an approved-but-not-captured response and never grants payment access', async () => {
    const store = installFakePurchaseStore('pending');
    (captureOrder as jest.Mock).mockResolvedValue({ status: 'APPROVED', captureId: null });

    await expect(capturePurchase(userId, purchaseId)).rejects.toThrow(/APPROVED/);
    expect(store.getStatus()).toBe('failed');
  });

  it('keeps a capture 500 recoverable and never paid', async () => {
    const store = installFakePurchaseStore('pending');
    (captureOrder as jest.Mock).mockRejectedValue(new PaymentProviderError('PAYPAL_CAPTURE_FAILED', 'PayPal capture failed.', { httpStatus: 500, orderId: 'order-123', retryable: true }));

    await expect(capturePurchase(userId, purchaseId)).rejects.toThrow(/temporarily unavailable/);
    expect(store.getStatus()).toBe('pending');
  });

  it('does not attempt a second capture for an already-paid purchase', async () => {
    installFakePurchaseStore('paid');
    const result = await capturePurchase(userId, purchaseId);
    expect(result.status).toBe('paid');
    expect(captureOrder).not.toHaveBeenCalled();
  });

  it('reconciles an already-captured PayPal order and marks a matching purchase paid', async () => {
    const store = installFakePurchaseStore('pending');
    (captureOrder as jest.Mock).mockRejectedValue(new PaymentProviderError('PAYMENT_ALREADY_PROCESSED', 'PayPal order was already captured.', { httpStatus: 422, issue: 'ORDER_ALREADY_CAPTURED' }));
    (reconcileCapturedOrder as jest.Mock).mockResolvedValue({ status: 'COMPLETED', captureId: 'CAP-RECOVERED' });

    const result = await capturePurchase(userId, purchaseId);
    expect(result.status).toBe('paid');
    expect(store.getStatus()).toBe('paid');
    expect(store.getCaptureId()).toBe('CAP-RECOVERED');
  });

  it('rejects an already-captured PayPal order when reconciliation does not match', async () => {
    const store = installFakePurchaseStore('pending');
    (captureOrder as jest.Mock).mockRejectedValue(new PaymentProviderError('PAYMENT_ALREADY_PROCESSED', 'PayPal order was already captured.', { httpStatus: 422, issue: 'ORDER_ALREADY_CAPTURED' }));
    (reconcileCapturedOrder as jest.Mock).mockRejectedValue(new PaymentProviderError('PAYMENT_INVALID', 'PayPal returned an invalid capture response.', { orderId: 'order-123' }));

    await expect(capturePurchase(userId, purchaseId)).rejects.toThrow(/Payment could not be completed/);
    expect(store.getStatus()).toBe('failed');
  });

  it('keeps the purchase recoverable when already-captured reconciliation times out', async () => {
    const store = installFakePurchaseStore('pending');
    (captureOrder as jest.Mock).mockRejectedValue(new PaymentProviderError('PAYMENT_ALREADY_PROCESSED', 'PayPal order was already captured.', { httpStatus: 422, issue: 'ORDER_ALREADY_CAPTURED' }));
    (reconcileCapturedOrder as jest.Mock).mockRejectedValue(new PaymentProviderError('PAYPAL_CAPTURE_FAILED', 'PayPal order lookup is temporarily unavailable.', { httpStatus: 503, retryable: true }));

    await expect(capturePurchase(userId, purchaseId)).rejects.toThrow(/temporarily unavailable/);
    expect(store.getStatus()).toBe('pending');
  });

  it('retries after a transient reconciliation error and then becomes paid', async () => {
    const store = installFakePurchaseStore('pending');
    (captureOrder as jest.Mock)
      .mockRejectedValueOnce(new PaymentProviderError('PAYMENT_ALREADY_PROCESSED', 'PayPal order was already captured.', { issue: 'ORDER_ALREADY_CAPTURED' }))
      .mockRejectedValueOnce(new PaymentProviderError('PAYMENT_ALREADY_PROCESSED', 'PayPal order was already captured.', { issue: 'ORDER_ALREADY_CAPTURED' }));
    (reconcileCapturedOrder as jest.Mock)
      .mockRejectedValueOnce(new PaymentProviderError('PAYPAL_CAPTURE_FAILED', 'PayPal order lookup is temporarily unavailable.', { httpStatus: 503, retryable: true }))
      .mockResolvedValueOnce({ status: 'COMPLETED', captureId: 'CAP-RETRY' });

    await expect(capturePurchase(userId, purchaseId)).rejects.toThrow(/temporarily unavailable/);
    const result = await capturePurchase(userId, purchaseId);
    expect(result.status).toBe('paid');
    expect(store.getStatus()).toBe('paid');
    expect(store.getCaptureId()).toBe('CAP-RETRY');
  });

  it('rejects an onApprove order id that does not belong to the purchase', async () => {
    installFakePurchaseStore('pending');
    await expect(capturePurchase(userId, purchaseId, 'different-order')).rejects.toThrow(/Payment reference is invalid/);
    expect(captureOrder).not.toHaveBeenCalled();
  });
});
