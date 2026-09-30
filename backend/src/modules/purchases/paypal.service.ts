import { env } from '../../config/env';
import { PaymentProviderError } from './paymentErrors';

/**
 * Thin wrapper around the PayPal REST API (Orders v2 + Webhooks v1). All
 * PayPal-specific logic is isolated here so the payment provider could
 * theoretically be swapped later without touching the Purchase/Attempt
 * business logic. Uses the platform's built-in fetch -- no PayPal SDK
 * dependency needed for this small a surface.
 */

interface CachedToken {
  accessToken: string;
  expiresAt: number;
}

let cachedToken: CachedToken | null = null;

function requireCredentials() {
  if (!env.paypalClientId || !env.paypalClientSecret) {
    throw new Error(
      'PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET are not configured. Set them in .env before creating orders.'
    );
  }
}

async function getAccessToken(): Promise<string> {
  if (!['sandbox', 'live'].includes(env.paypalMode)) throw new Error('PAYPAL_MODE must be sandbox or live.');
  const isSandboxBase = env.paypalApiBase.includes('sandbox');
  if ((env.paypalMode === 'sandbox') !== isSandboxBase) throw new Error('PAYPAL_MODE and PAYPAL_API_BASE do not match.');
  requireCredentials();
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.accessToken;
  }

  const basicAuth = Buffer.from(`${env.paypalClientId}:${env.paypalClientSecret}`).toString('base64');
  let res: Response;
  try {
    res = await fetch(`${env.paypalApiBase}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });
  } catch {
    throw new PaymentProviderError('PAYPAL_ORDER_CREATE_FAILED', 'PayPal authentication is temporarily unavailable.', { retryable: true });
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as any;
    throw new PaymentProviderError('PAYPAL_ORDER_CREATE_FAILED', 'PayPal OAuth failed.', {
      httpStatus: res.status,
      paypalName: body.name ?? body.error,
      retryable: res.status === 429 || res.status >= 500
    });
  }
  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { accessToken: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return cachedToken.accessToken;
}

export interface PayPalOrder {
  id: string;
  approveUrl: string;
}

export async function createOrder(input: {
  purchaseId: string;
  testName: string;
  amountCents: number;
  currency: string;
}): Promise<PayPalOrder> {
  const accessToken = await getAccessToken();
  const res = await fetch(`${env.paypalApiBase}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      // Lets PayPal de-duplicate this exact create-order call if retried.
      'PayPal-Request-Id': `purchase-${input.purchaseId}`
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          // Travels back on the capture result and the webhook payload so
          // both can find the Purchase without trusting anything the
          // frontend reports back.
          custom_id: input.purchaseId,
          description: input.testName,
          amount: {
            currency_code: env.paypalCurrency,
            value: (input.amountCents / 100).toFixed(2)
          }
        }
      ],
      application_context: {
        brand_name: 'My Inner',
        user_action: 'PAY_NOW',
        return_url: `${env.paypalReturnUrl}?purchaseId=${input.purchaseId}`,
        cancel_url: env.paypalCancelUrl
      }
    })
  });
  const data = (await res.json()) as { id: string; links?: Array<{ rel: string; href: string }> };
  if (!res.ok) {
    throw new PaymentProviderError('PAYPAL_ORDER_CREATE_FAILED', 'PayPal order creation failed.', {
      httpStatus: res.status,
      paypalName: (data as any).name,
      issue: (data as any).details?.[0]?.issue,
      debugId: (data as any).debug_id
    });
  }
  const approveLink = data.links?.find((l) => l.rel === 'approve');
  if (!approveLink) throw new PaymentProviderError('PAYPAL_APPROVAL_FAILED', 'PayPal returned no approval link.', { orderId: data.id });
  return { id: data.id, approveUrl: approveLink.href };
}

export interface PayPalCaptureResult {
  status: string; // e.g. 'COMPLETED', 'DECLINED'
  captureId: string | null;
}

export interface ExpectedPayment {
  orderId: string;
  amountCents: number;
  currency: string;
}

type PayPalOrderResponse = {
  id?: string;
  status?: string;
  purchase_units?: Array<{
    payments?: { captures?: Array<{ id?: string; status?: string; amount?: { value?: string; currency_code?: string } }> };
  }>;
};

function amountToCents(value: unknown): number | null {
  if (typeof value !== 'string' || !/^\d+(\.\d{1,2})?$/.test(value)) return null;
  const [whole, fraction = ''] = value.split('.');
  const cents = Number(`${whole}${fraction.padEnd(2, '0')}`);
  return Number.isSafeInteger(cents) ? cents : null;
}

function validateCompletedCapture(data: PayPalOrderResponse, expected: ExpectedPayment, httpStatus: number): PayPalCaptureResult {
  const capture = data.purchase_units?.[0]?.payments?.captures?.[0];
  const captureAmount = amountToCents(capture?.amount?.value);
  const expectedCurrency = expected.currency.toUpperCase();
  const actualCurrency = capture?.amount?.currency_code?.toUpperCase();

  if (
    data.id !== expected.orderId ||
    data.status !== 'COMPLETED' ||
    capture?.status !== 'COMPLETED' ||
    !capture.id ||
    captureAmount === null ||
    captureAmount !== expected.amountCents ||
    actualCurrency !== expectedCurrency
  ) {
    throw new PaymentProviderError('PAYMENT_INVALID', 'PayPal returned an invalid capture response.', {
      httpStatus,
      paypalName: data.status,
      orderId: expected.orderId
    });
  }
  return { status: 'COMPLETED', captureId: capture.id };
}

export async function captureOrder(orderId: string, expected: Omit<ExpectedPayment, 'orderId'>): Promise<PayPalCaptureResult> {
  const accessToken = await getAccessToken();
  const res = await fetch(`${env.paypalApiBase}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }
  });
  const data = (await res.json()) as any;

  if (!res.ok) {
    const alreadyCaptured = (data?.details ?? []).some((d: any) => d.issue === 'ORDER_ALREADY_CAPTURED');
    if (alreadyCaptured) throw new PaymentProviderError('PAYMENT_ALREADY_PROCESSED', 'PayPal order was already captured.', { httpStatus: res.status, paypalName: data.name, issue: 'ORDER_ALREADY_CAPTURED', debugId: data.debug_id, orderId });
    const issue = data?.details?.[0]?.issue;
    throw new PaymentProviderError(issue === 'COMPLIANCE_VIOLATION' ? 'PAYPAL_COMPLIANCE_VIOLATION' : 'PAYPAL_CAPTURE_FAILED', 'PayPal capture failed.', { httpStatus: res.status, paypalName: data.name, issue, debugId: data.debug_id, orderId, retryable: res.status === 429 || res.status >= 500 });
  }

  return validateCompletedCapture(data, { ...expected, orderId }, res.status);
}

export async function getOrder(orderId: string): Promise<PayPalOrderResponse> {
  const accessToken = await getAccessToken();
  let res: Response;
  try {
    res = await fetch(`${env.paypalApiBase}/v2/checkout/orders/${orderId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }
    });
  } catch {
    throw new PaymentProviderError('PAYPAL_CAPTURE_FAILED', 'PayPal order lookup is temporarily unavailable.', {
      orderId,
      retryable: true
    });
  }
  const data = (await res.json()) as PayPalOrderResponse & { name?: string; debug_id?: string };
  if (!res.ok) {
    throw new PaymentProviderError('PAYPAL_CAPTURE_FAILED', 'PayPal order lookup failed.', {
      httpStatus: res.status,
      paypalName: data.name,
      debugId: data.debug_id,
      orderId,
      retryable: res.status === 429 || res.status >= 500
    });
  }
  return data;
}

export async function reconcileCapturedOrder(expected: ExpectedPayment): Promise<PayPalCaptureResult> {
  const data = await getOrder(expected.orderId);
  return validateCompletedCapture(data, expected, 200);
}

export interface PayPalWebhookHeaders {
  authAlgo?: string;
  certUrl?: string;
  transmissionId?: string;
  transmissionSig?: string;
  transmissionTime?: string;
}

/**
 * PayPal has no local-HMAC option like Stripe's -- verification means asking
 * PayPal's own API to confirm the transmission signature, so this call
 * always requires network access and a configured PAYPAL_WEBHOOK_ID.
 */
export async function verifyWebhookSignature(headers: PayPalWebhookHeaders, event: unknown): Promise<boolean> {
  if (!env.paypalWebhookId) {
    throw new Error('PAYPAL_WEBHOOK_ID is not configured.');
  }
  const accessToken = await getAccessToken();
  const res = await fetch(`${env.paypalApiBase}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      auth_algo: headers.authAlgo,
      cert_url: headers.certUrl,
      transmission_id: headers.transmissionId,
      transmission_sig: headers.transmissionSig,
      transmission_time: headers.transmissionTime,
      webhook_id: env.paypalWebhookId,
      webhook_event: event
    })
  });
  if (!res.ok) {
    throw new Error(`PayPal webhook signature verification request failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { verification_status: string };
  return data.verification_status === 'SUCCESS';
}
