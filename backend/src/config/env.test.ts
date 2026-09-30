import { validatePaymentConfiguration } from './env';

describe('payment mode safety', () => {
  it('allows demo only outside production', () => {
    expect(() => validatePaymentConfiguration('demo', false)).not.toThrow();
    expect(() => validatePaymentConfiguration('demo', true)).toThrow(/not allowed.*production/i);
  });

  it('allows PayPal in production and rejects unknown modes', () => {
    expect(() => validatePaymentConfiguration('paypal', true)).not.toThrow();
    expect(() => validatePaymentConfiguration('anything', false)).toThrow(/either paypal or demo/i);
  });
});
