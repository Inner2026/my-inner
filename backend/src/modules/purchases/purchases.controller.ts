import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { initiatePurchase, getPurchaseStatus, capturePurchase, getActivePaidPurchase } from './purchases.service';
import { calculateCheckout } from './checkout.service';
import { AppError } from '../../utils/AppError';

export const createPurchase = asyncHandler(async (req: Request, res: Response) => {
  const { testSlug, couponCode, applyCredit } = req.body ?? {};
  if (!testSlug) throw AppError.badRequest('testSlug is required.');
  const { purchase, approvalUrl } = await initiatePurchase(req.user!.id, testSlug, couponCode, applyCredit === true);
  res.status(201).json({ purchaseId: purchase._id, paypalOrderId: purchase.paypalOrderId, approvalUrl, paymentProvider: purchase.paymentProvider, pricing: { originalAmountCents: purchase.originalAmount, couponCode: purchase.couponCode, couponDiscountCents: purchase.couponDiscountAmount, referralCreditAppliedCents: purchase.creditAppliedCents, payableAmountCents: purchase.amount, currency: purchase.currency } });
});

export const quotePurchase = asyncHandler(async (req: Request, res: Response) => {
  const { testSlug, couponCode, applyCredit } = req.body ?? {};
  if (!testSlug) throw AppError.badRequest('testSlug is required.');
  res.json({ quote: await calculateCheckout(req.user!.id, testSlug, couponCode, applyCredit === true) });
});

export const getEntitlement = asyncHandler(async (req: Request, res: Response) => {
  const test = await (await import('../../models/Test')).Test.findOne({ slug: req.params.testSlug, active: true }).select('_id').lean();
  if (!test) throw AppError.notFound('Test not found.');
  const purchase = await getActivePaidPurchase(req.user!.id, test._id);
  res.json({ owned: Boolean(purchase), purchaseId: purchase?._id ?? null, expiresAt: purchase?.paidAt ? new Date(purchase.paidAt.getTime() + 90 * 24 * 60 * 60 * 1000) : null });
});

export const getPurchase = asyncHandler(async (req: Request, res: Response) => {
  const purchase = await getPurchaseStatus(req.user!.id, req.params.purchaseId);
  res.json({ purchase });
});

export const capturePurchaseHandler = asyncHandler(async (req: Request, res: Response) => {
  const { orderId } = req.body ?? {};
  const purchase = await capturePurchase(req.user!.id, req.params.purchaseId, orderId);
  res.json({ purchase });
});
