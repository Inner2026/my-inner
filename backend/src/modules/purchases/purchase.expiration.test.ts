jest.mock('../../models/Purchase', () => ({
  Purchase: { findOne: jest.fn(), create: jest.fn(), updateOne: jest.fn() }
}));
jest.mock('../../models/Test', () => ({ Test: { findOne: jest.fn() } }));
jest.mock('../../models/TestVersion', () => ({ TestVersion: { findOne: jest.fn() } }));
jest.mock('../../models/User', () => ({ User: { findById: jest.fn() } }));
jest.mock('./paypal.service', () => ({
  createOrder: jest.fn(),
  reconcileCapturedOrder: jest.fn()
}));
jest.mock('../../config/env', () => ({
  env: { paymentsMode: 'paypal', paypalCurrency: 'USD', paypalCheckoutTimeoutMinutes: 30 }
}));

import { Purchase } from '../../models/Purchase';
import { Test } from '../../models/Test';
import { TestVersion } from '../../models/TestVersion';
import { User } from '../../models/User';
import { createOrder, reconcileCapturedOrder } from './paypal.service';
import { initiatePurchase } from './purchases.service';
import { PaymentProviderError } from './paymentErrors';

const userId = 'user-1' as any;
const user = { _id: userId };
const test = { _id: 'test-1', name: 'Test', slug: 'test', currentVersionId: 'version-1', active: true, price: { amount: 499, currency: 'USD' } };
const version = { _id: 'version-1' };

function setup() {
  (Test.findOne as jest.Mock).mockResolvedValue(test);
  (TestVersion.findOne as jest.Mock).mockResolvedValue(version);
  (User.findById as jest.Mock).mockResolvedValue(user);
  (Purchase.updateOne as jest.Mock).mockResolvedValue({ modifiedCount: 1 });
  (createOrder as jest.Mock).mockResolvedValue({ id: 'ORDER-NEW', approveUrl: 'https://paypal.test/approve' });
  (Purchase.create as jest.Mock).mockImplementation(async (input: any) => ({ ...input, _id: 'purchase-new', save: jest.fn() }));
}

describe('expired purchase recovery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setup();
  });

  it('expires a pending checkout and allows a new checkout', async () => {
    (Purchase.findOne as jest.Mock).mockResolvedValue({ _id: 'old', status: 'pending', expiresAt: new Date(Date.now() - 1000) });

    const result = await initiatePurchase(userId, 'test');

    expect(Purchase.updateOne).toHaveBeenCalledWith(
      { _id: 'old', status: 'pending', expiresAt: expect.any(Date) },
      { $set: { status: 'failed' } }
    );
    expect(result.purchase._id).toBe('purchase-new');
  });

  it('reconciles an expired capturing checkout before creating a new one', async () => {
    (Purchase.findOne as jest.Mock).mockResolvedValue({ _id: 'old', status: 'capturing', paypalOrderId: 'ORDER-OLD', amount: 499, currency: 'USD', expiresAt: new Date(Date.now() - 1000) });
    (reconcileCapturedOrder as jest.Mock).mockResolvedValue({ status: 'COMPLETED', captureId: 'CAP-OLD' });

    await initiatePurchase(userId, 'test');

    expect(reconcileCapturedOrder).toHaveBeenCalledWith({ orderId: 'ORDER-OLD', amountCents: 499, currency: 'USD' });
    expect(Purchase.updateOne).toHaveBeenCalledWith(
      { _id: 'old', paypalOrderId: 'ORDER-OLD', status: 'capturing' },
      expect.objectContaining({ $set: expect.objectContaining({ status: 'paid', paypalCaptureId: 'CAP-OLD' }) })
    );
  });

  it('keeps expired capturing checkout recoverable during a temporary outage', async () => {
    (Purchase.findOne as jest.Mock).mockResolvedValue({ _id: 'old', status: 'capturing', paypalOrderId: 'ORDER-OLD', amount: 499, currency: 'USD', expiresAt: new Date(Date.now() - 1000) });
    (reconcileCapturedOrder as jest.Mock).mockRejectedValue(new PaymentProviderError('PAYPAL_CAPTURE_FAILED', 'temporarily unavailable', { httpStatus: 503, retryable: true }));

    await expect(initiatePurchase(userId, 'test')).rejects.toThrow(/temporarily unavailable/);
    expect(Purchase.create).not.toHaveBeenCalled();
    expect(Purchase.updateOne).not.toHaveBeenCalledWith(expect.anything(), { $set: { status: 'failed' } });
  });

  it('allows failed and paid historical purchases without treating them as active locks', async () => {
    (Purchase.findOne as jest.Mock).mockResolvedValue(null);
    await initiatePurchase(userId, 'test');

    expect(Purchase.findOne).toHaveBeenCalledWith({ userId, testId: 'test-1', status: { $in: ['pending', 'capturing'] } });
    expect(Purchase.create).toHaveBeenCalled();
  });
});
