jest.mock('../../models/Purchase', () => ({
  Purchase: { findOne: jest.fn(), updateOne: jest.fn() }
}));
jest.mock('./paypal.service', () => ({
  verifyWebhookSignature: jest.fn(),
  reconcileCapturedOrder: jest.fn()
}));

import { Purchase } from '../../models/Purchase';
import { reconcileCapturedOrder, verifyWebhookSignature } from './paypal.service';
import { processVerifiedCaptureEvent, verifyPayPalWebhookRequest } from './paypalWebhook.routes';

const purchase = {
  _id: 'purchase-1',
  paypalOrderId: 'ORDER-1',
  amount: 499,
  currency: 'USD',
  status: 'pending'
};

const event = (overrides: Record<string, unknown> = {}) => ({
  event_type: 'PAYMENT.CAPTURE.COMPLETED',
  resource: {
    id: 'CAP-1',
    custom_id: 'purchase-1',
    status: 'COMPLETED',
    supplementary_data: { related_ids: { order_id: 'ORDER-1' } },
    ...overrides
  }
});

describe('PayPal webhook validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Purchase.findOne as jest.Mock).mockResolvedValue(purchase);
    (Purchase.updateOne as jest.Mock).mockResolvedValue({ modifiedCount: 1 });
    (reconcileCapturedOrder as jest.Mock).mockResolvedValue({ status: 'COMPLETED', captureId: 'CAP-1' });
  });

  it('marks a valid signed event paid after authoritative reconciliation', async () => {
    await expect(processVerifiedCaptureEvent(event())).resolves.toBe('paid');
    expect(reconcileCapturedOrder).toHaveBeenCalledWith({ orderId: 'ORDER-1', amountCents: 499, currency: 'USD' });
    expect(Purchase.updateOne).toHaveBeenCalled();
  });

  it('rejects a valid event with the wrong order ID', async () => {
    await expect(processVerifiedCaptureEvent(event({ supplementary_data: { related_ids: { order_id: 'OTHER' } } }))).resolves.toBe('rejected');
    expect(Purchase.updateOne).not.toHaveBeenCalled();
  });

  it('rejects a valid event with the wrong capture amount', async () => {
    (reconcileCapturedOrder as jest.Mock).mockRejectedValue(new Error('amount mismatch'));
    await expect(processVerifiedCaptureEvent(event())).rejects.toThrow('amount mismatch');
    expect(Purchase.updateOne).not.toHaveBeenCalled();
  });

  it('rejects a valid event with the wrong capture currency', async () => {
    (reconcileCapturedOrder as jest.Mock).mockRejectedValue(new Error('currency mismatch'));
    await expect(processVerifiedCaptureEvent(event())).rejects.toThrow('currency mismatch');
    expect(Purchase.updateOne).not.toHaveBeenCalled();
  });

  it('keeps an already-paid purchase paid on duplicate or invalid delivery', async () => {
    (Purchase.findOne as jest.Mock).mockResolvedValue({ ...purchase, status: 'paid' });
    await expect(processVerifiedCaptureEvent(event({ status: 'DECLINED' }))).resolves.toBe('rejected');
    expect(Purchase.updateOne).not.toHaveBeenCalled();
  });

  it('rejects an invalid PayPal signature', async () => {
    (verifyWebhookSignature as jest.Mock).mockResolvedValue(false);
    await expect(verifyPayPalWebhookRequest({ transmissionSig: 'invalid' }, event())).resolves.toBe(false);
  });
});
