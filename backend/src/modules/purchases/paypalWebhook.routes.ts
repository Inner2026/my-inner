import { Router, Request, Response } from 'express';
import express from 'express';
import { Purchase } from '../../models/Purchase';
import { reconcileCapturedOrder, verifyWebhookSignature } from './paypal.service';
import { PaymentProviderError, safePaymentLog } from './paymentErrors';
import { asyncHandler } from '../../utils/asyncHandler';

export const paypalWebhookRouter = Router();

export async function verifyPayPalWebhookRequest(headers: {
  authAlgo?: string;
  certUrl?: string;
  transmissionId?: string;
  transmissionSig?: string;
  transmissionTime?: string;
}, event: unknown) {
  return verifyWebhookSignature(headers, event);
}

// Unlike Stripe, PayPal signature verification is a server-to-server API
// call (PayPal recomputes and compares the signature on their end), not a
// local HMAC over the raw body -- so a normal parsed JSON body is fine here.
paypalWebhookRouter.use(express.json());

/**
 * PAYMENT.CAPTURE.COMPLETED is the authoritative, idempotent payment
 * confirmation: we key off Purchase.status and only transition
 * pending -> paid once. Re-delivered events for an already-paid purchase
 * (PayPal retries webhooks) are acknowledged as a no-op rather than erroring.
 * This is a reliability backup to the return-page-triggered capture in
 * purchases.service.ts::capturePurchase -- either path can be first.
 */
export async function processVerifiedCaptureEvent(event: {
  event_type?: string;
  resource?: {
    id?: string;
    custom_id?: string;
    status?: string;
    supplementary_data?: { related_ids?: { order_id?: string } };
  };
}) {
  if (event.event_type !== 'PAYMENT.CAPTURE.COMPLETED') return 'ignored';

  const resource = event.resource;
  if (!resource?.id || !resource.custom_id || resource.status !== 'COMPLETED') return 'rejected';

  // custom_id is only used to locate a candidate document. It is never
  // sufficient on its own: the authoritative PayPal order/capture is fetched
  // and checked against the local Purchase below.
  const purchase = await Purchase.findOne({ _id: resource.custom_id });
  if (!purchase || purchase.status === 'paid') return 'ignored';

  const eventOrderId = resource.supplementary_data?.related_ids?.order_id;
  if (eventOrderId && eventOrderId !== purchase.paypalOrderId) return 'rejected';

  const result = await reconcileCapturedOrder({
    orderId: purchase.paypalOrderId,
    amountCents: purchase.amount,
    currency: purchase.currency
  });
  if (result.captureId !== resource.id) return 'rejected';

  await Purchase.updateOne(
    { _id: purchase._id, paypalOrderId: purchase.paypalOrderId, status: { $in: ['pending', 'capturing'] } },
    { $set: { status: 'paid', paypalCaptureId: result.captureId, paidAt: new Date() } }
  );
  return 'paid';
}

paypalWebhookRouter.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const headers = {
      authAlgo: req.header('paypal-auth-algo') ?? undefined,
      certUrl: req.header('paypal-cert-url') ?? undefined,
      transmissionId: req.header('paypal-transmission-id') ?? undefined,
      transmissionSig: req.header('paypal-transmission-sig') ?? undefined,
      transmissionTime: req.header('paypal-transmission-time') ?? undefined
    };

    if (!headers.authAlgo || !headers.certUrl || !headers.transmissionId || !headers.transmissionSig || !headers.transmissionTime) {
      return res.status(400).send('Missing PayPal webhook signature headers.');
    }

    let verified: boolean;
    try {
      verified = await verifyPayPalWebhookRequest(headers, req.body);
    } catch {
      return res.status(400).send('Webhook signature verification failed.');
    }
    if (!verified) {
      return res.status(400).send('Webhook signature verification failed.');
    }

    const event = req.body as Parameters<typeof processVerifiedCaptureEvent>[0];
    try {
      await processVerifiedCaptureEvent(event);
    } catch (err) {
      if (err instanceof PaymentProviderError) safePaymentLog(err, event.resource?.custom_id);
      return res.status(400).send('Webhook payment validation failed.');
    }

    res.json({ received: true });
  })
);
