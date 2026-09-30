jest.mock('../../models/Purchase', () => ({
  Purchase: { findOne: jest.fn(), create: jest.fn() }
}));
jest.mock('../../models/Test', () => ({ Test: { findOne: jest.fn() } }));
jest.mock('../../models/TestVersion', () => ({ TestVersion: { findOne: jest.fn() } }));
jest.mock('../../models/User', () => ({ User: { findById: jest.fn() } }));
jest.mock('./paypal.service', () => ({ createOrder: jest.fn() }));
jest.mock('../../config/env', () => ({
  env: { paymentsMode: 'demo', paypalCurrency: 'USD', paypalCheckoutTimeoutMinutes: 30 }
}));

import { Purchase } from '../../models/Purchase';
import { Test } from '../../models/Test';
import { TestVersion } from '../../models/TestVersion';
import { User } from '../../models/User';
import { createOrder } from './paypal.service';
import { initiatePurchase } from './purchases.service';

describe('secure demo payment mode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Test.findOne as jest.Mock).mockResolvedValue({ _id: 'test-1', slug: 'inner', name: 'Inner Test', currentVersionId: 'version-1', price: { amount: 499, currency: 'USD' } });
    (TestVersion.findOne as jest.Mock).mockResolvedValue({ _id: 'version-1' });
    (User.findById as jest.Mock).mockResolvedValue({ _id: 'user-1' });
    (Purchase.findOne as jest.Mock).mockResolvedValue(null);
    (Purchase.create as jest.Mock).mockImplementation(async (input: any) => ({ ...input, _id: 'purchase-demo' }));
  });

  it('creates a paid demo Purchase without calling PayPal', async () => {
    const result = await initiatePurchase('user-1' as any, 'inner');

    expect(result.purchase.status).toBe('paid');
    expect(result.purchase.paymentProvider).toBe('demo');
    expect(result.approvalUrl).toBeNull();
    expect(createOrder).not.toHaveBeenCalled();
  });

  it('ignores any frontend payment-provider choice because mode is backend-controlled', async () => {
    await initiatePurchase('user-1' as any, 'inner');
    expect(Purchase.create).toHaveBeenCalledWith(expect.objectContaining({ paymentProvider: 'demo', status: 'paid' }));
  });
});
