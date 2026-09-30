export type PaymentErrorCode =
  | 'PAYPAL_ORDER_CREATE_FAILED'
  | 'PAYPAL_APPROVAL_FAILED'
  | 'PAYPAL_CAPTURE_FAILED'
  | 'PAYPAL_COMPLIANCE_VIOLATION'
  | 'PAYMENT_ALREADY_PROCESSED'
  | 'PAYMENT_INVALID';

export class PaymentProviderError extends Error {
  constructor(
    public readonly code: PaymentErrorCode,
    message: string,
    public readonly metadata: {
      httpStatus?: number;
      paypalName?: string;
      issue?: string;
      debugId?: string;
      orderId?: string;
      retryable?: boolean;
    } = {}
  ) {
    super(message);
    this.name = 'PaymentProviderError';
  }
}

export function safePaymentLog(error: PaymentProviderError, purchaseId?: string) {
  console.error('[payment]', JSON.stringify({
    code: error.code,
    purchase_id: purchaseId ?? null,
    order_id: error.metadata.orderId ?? null,
    http_status: error.metadata.httpStatus ?? null,
    paypal_name: error.metadata.paypalName ?? null,
    issue: error.metadata.issue ?? null,
    debug_id: error.metadata.debugId ?? null,
    timestamp: new Date().toISOString()
  }));
}
