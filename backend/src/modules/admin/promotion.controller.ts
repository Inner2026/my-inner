import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { AppError } from '../../utils/AppError';
import { getPromotionSettings, publicPromotion } from './promotion.service';
import { PromotionSettings } from '../../models/PromotionSettings';
import { Coupon } from '../../models/Coupon';

function normalizeCouponInput(body: Record<string, unknown>, partial = false) {
  const patch: Record<string, unknown> = {};
  if (!partial || body.code !== undefined) {
    const code = String(body.code ?? '').trim().toUpperCase();
    if (!/^[A-Z0-9][A-Z0-9_-]{1,39}$/.test(code)) throw AppError.badRequest('Coupon code must be 2-40 characters using letters, numbers, _ or -.');
    patch.code = code;
  }
  if (!partial || body.discountType !== undefined) {
    if (body.discountType !== 'fixed' && body.discountType !== 'percent') throw AppError.badRequest('Discount type must be fixed or percent.');
    patch.discountType = body.discountType;
  }
  if (!partial || body.discountValue !== undefined) {
    const value = Number(body.discountValue);
    const type = (body.discountType ?? body.existingDiscountType) as string;
    if (!Number.isFinite(value) || value <= 0 || (type === 'percent' && value > 100)) throw AppError.badRequest(type === 'percent' ? 'Percentage must be greater than 0 and at most 100.' : 'Fixed discount must be greater than 0.');
    patch.discountValue = type === 'fixed' ? Math.round(value) : value;
  }
  if (body.active !== undefined) {
    if (typeof body.active !== 'boolean') throw AppError.badRequest('Active must be true or false.');
    patch.active = body.active;
  }
  if (body.testSlugs !== undefined) {
    if (!Array.isArray(body.testSlugs) || body.testSlugs.some((slug) => typeof slug !== 'string')) throw AppError.badRequest('Test restrictions must be a list of slugs.');
    patch.testSlugs = body.testSlugs.map((slug) => slug.trim()).filter(Boolean);
  }
  if (body.expiresAt !== undefined) {
    if (body.expiresAt === null || body.expiresAt === '') patch.expiresAt = null;
    else { const date = new Date(String(body.expiresAt)); if (Number.isNaN(date.getTime())) throw AppError.badRequest('Invalid coupon expiry date.'); patch.expiresAt = date; }
  }
  if (body.maxRedemptions !== undefined) {
    if (body.maxRedemptions === null || body.maxRedemptions === '') patch.maxRedemptions = null;
    else { const max = Number(body.maxRedemptions); if (!Number.isInteger(max) || max < 1) throw AppError.badRequest('Maximum redemptions must be a positive whole number.'); patch.maxRedemptions = max; }
  }
  return patch;
}

export const publicSettings = asyncHandler(async (_req: Request, res: Response) => res.json({ promotion: publicPromotion(await getPromotionSettings()) }));

export const adminSettings = asyncHandler(async (_req: Request, res: Response) => res.json({ settings: await getPromotionSettings() }));

export const updateSettings = asyncHandler(async (req: Request, res: Response) => {
  const patch: Record<string, unknown> = {};
  if (typeof req.body.announcementEnabled === 'boolean') patch.announcementEnabled = req.body.announcementEnabled;
  for (const key of ['announcementText', 'referralEmailSubject', 'referralEmailMessage']) if (typeof req.body[key] === 'string' && req.body[key].trim()) patch[key] = req.body[key].trim();
  if (req.body.announcementEndsAt === null || req.body.announcementEndsAt === '') patch.announcementEndsAt = null;
  else if (req.body.announcementEndsAt) { const date = new Date(req.body.announcementEndsAt); if (Number.isNaN(date.getTime())) throw AppError.badRequest('Invalid announcement end date.'); patch.announcementEndsAt = date; }
  if (req.body.referralCreditExpiryDays !== undefined) { const days = Number(req.body.referralCreditExpiryDays); if (!Number.isInteger(days) || days < 1 || days > 3650) throw AppError.badRequest('Expiry must be between 1 and 3650 days.'); patch.referralCreditExpiryDays = days; }
  const settings = await PromotionSettings.findOneAndUpdate({ key: 'default' }, { $set: patch, $setOnInsert: { key: 'default' } }, { upsert: true, new: true, setDefaultsOnInsert: true });
  res.json({ settings });
});

export const listCoupons = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ coupons: await Coupon.find().sort({ createdAt: -1 }).lean() });
});

export const createCoupon = asyncHandler(async (req: Request, res: Response) => {
  const payload = normalizeCouponInput(req.body ?? {});
  try {
    const coupon = await Coupon.create(payload);
    res.status(201).json({ coupon });
  } catch (error: any) {
    if (error?.code === 11000) throw AppError.conflict('A coupon with this code already exists.');
    throw error;
  }
});

export const updateCoupon = asyncHandler(async (req: Request, res: Response) => {
  const coupon = await Coupon.findById(req.params.couponId);
  if (!coupon) throw AppError.notFound('Coupon not found.');
  const payload = normalizeCouponInput({ ...req.body, existingDiscountType: coupon.discountType }, true);
  Object.assign(coupon, payload);
  try { await coupon.save(); } catch (error: any) { if (error?.code === 11000) throw AppError.conflict('A coupon with this code already exists.'); throw error; }
  res.json({ coupon });
});

export const deleteCoupon = asyncHandler(async (req: Request, res: Response) => {
  const result = await Coupon.deleteOne({ _id: req.params.couponId });
  if (!result.deletedCount) throw AppError.notFound('Coupon not found.');
  res.status(204).send();
});
