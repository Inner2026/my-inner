import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { initiatePurchase, getPurchaseStatus, capturePurchase } from './purchases.service';
import { AppError } from '../../utils/AppError';

export const createPurchase = asyncHandler(async (req: Request, res: Response) => {
  const { testSlug } = req.body ?? {};
  if (!testSlug) throw AppError.badRequest('testSlug is required.');
  const { purchase, approvalUrl } = await initiatePurchase(req.user!.id, testSlug);
  res.status(201).json({ purchaseId: purchase._id, paypalOrderId: purchase.paypalOrderId, approvalUrl, paymentProvider: purchase.paymentProvider });
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
