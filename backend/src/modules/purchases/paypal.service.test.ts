jest.mock('../../config/env', () => ({
  env: {
    paypalClientId: 'client',
    paypalClientSecret: 'secret',
    paypalMode: 'sandbox',
    paypalApiBase: 'https://api-m.sandbox.paypal.com',
    paypalCurrency: 'USD'
  }
}));

import { captureOrder, reconcileCapturedOrder } from './paypal.service';

const expected = { orderId: 'ORDER-1', amountCents: 499, currency: 'USD' };

function response(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}

describe('PayPal capture validation', () => {
  let nextResponse: Response;

  beforeEach(() => {
    jest.restoreAllMocks();
    nextResponse = response({});
    global.fetch = jest.fn((input: string | URL | Request) => String(input).includes('/oauth2/token')
      ? Promise.resolve(response({ access_token: 'token', expires_in: 300 }))
      : Promise.resolve(nextResponse));
  });

  it('accepts matching amount and currency', async () => {
    nextResponse = response({
      id: 'ORDER-1', status: 'COMPLETED', purchase_units: [{ payments: { captures: [{ id: 'CAP-1', status: 'COMPLETED', amount: { value: '4.99', currency_code: 'USD' } }] } }]
    });

    await expect(captureOrder(expected.orderId, expected)).resolves.toEqual({ status: 'COMPLETED', captureId: 'CAP-1' });
  });

  it.each([
    ['amount', { value: '5.00', currency_code: 'USD' }],
    ['currency', { value: '4.99', currency_code: 'EUR' }]
  ])('rejects a capture with mismatched %s', async (_label, amount) => {
    nextResponse = response({
      id: 'ORDER-1', status: 'COMPLETED', purchase_units: [{ payments: { captures: [{ id: 'CAP-1', status: 'COMPLETED', amount }] } }]
    });

    await expect(captureOrder(expected.orderId, expected)).rejects.toMatchObject({ code: 'PAYMENT_INVALID' });
  });

  it('reconciles an already-completed order from the authoritative order lookup', async () => {
    nextResponse = response({
      id: 'ORDER-1', status: 'COMPLETED', purchase_units: [{ payments: { captures: [{ id: 'CAP-1', status: 'COMPLETED', amount: { value: '4.99', currency_code: 'USD' } }] } }]
    });

    await expect(reconcileCapturedOrder(expected)).resolves.toEqual({ status: 'COMPLETED', captureId: 'CAP-1' });
  });

  it('rejects reconciliation when the order identity is wrong', async () => {
    nextResponse = response({
      id: 'OTHER-ORDER', status: 'COMPLETED', purchase_units: [{ payments: { captures: [{ id: 'CAP-1', status: 'COMPLETED', amount: { value: '4.99', currency_code: 'USD' } }] } }]
    });

    await expect(reconcileCapturedOrder(expected)).rejects.toMatchObject({ code: 'PAYMENT_INVALID' });
  });
});
