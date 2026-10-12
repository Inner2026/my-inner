import { Types } from 'mongoose';
import { Test } from '../../models/Test';
import { TestVersion } from '../../models/TestVersion';
import { Coupon } from '../../models/Coupon';
import { Purchase } from '../../models/Purchase';
import { WalletAccount } from '../../models/WalletAccount';
import { WalletLedger } from '../../models/WalletLedger';
import { AppError } from '../../utils/AppError';
import { ensureWalletAccount } from '../referrals/referrals.service';
import { isDbConnected } from '../../config/db';

export interface CheckoutQuote {
  testId: Types.ObjectId;
  testVersionId: Types.ObjectId;
  testName: string;
  originalAmountCents: number;
  couponCode: string | null;
  couponDiscountCents: number;
  taxCents: number;
  amountAfterDiscountsCents: number;
  availableReferralCreditCents: number;
  referralCreditAppliedCents: number;
  payableAmountCents: number;
  currency: string;
}

async function loadProduct(testSlug: string) {
  const test = await Test.findOne({ slug: testSlug, active: true });
  if (!test || !test.currentVersionId) throw AppError.notFound('Test not found or not currently available for purchase.');
  const version = await TestVersion.findOne({ _id: test.currentVersionId, status: 'published' });
  if (!version) throw AppError.notFound('Test not found or not currently available for purchase.');
  return { test, version };
}

async function findCoupon(code: string | undefined, testSlug: string, amountCents: number) {
  if (!code?.trim()) return { coupon: null, discount: 0 };
  const coupon = await Coupon.findOne({ code: code.trim().toUpperCase(), active: true }).lean();
  if (!coupon || (coupon.expiresAt && coupon.expiresAt <= new Date()) || (coupon.testSlugs?.length && !coupon.testSlugs.includes(testSlug)) || (coupon.maxRedemptions !== null && coupon.maxRedemptions !== undefined && coupon.redeemedCount >= coupon.maxRedemptions)) {
    throw AppError.badRequest('This coupon is invalid or not eligible for this test.');
  }
  const discount = coupon.discountType === 'percent' ? Math.floor(amountCents * coupon.discountValue / 100) : Math.min(amountCents, Math.round(coupon.discountValue));
  return { coupon, discount: Math.max(0, Math.min(amountCents, discount)) };
}

export async function calculateCheckout(userId: Types.ObjectId, testSlug: string, couponCode?: string, applyCredit = false): Promise<CheckoutQuote> {
  const { test, version } = await loadProduct(testSlug);
  const original = Math.max(0, Math.round(test.price.amount));
  const { coupon, discount } = await findCoupon(couponCode, testSlug, original);
  const afterDiscounts = Math.max(0, original - discount);
  const account = isDbConnected() ? await ensureWalletAccount(userId) : { availableCents: 0 };
  const credit = applyCredit ? Math.min(account.availableCents, afterDiscounts) : 0;
  return { testId: test._id, testVersionId: version._id, testName: test.name, originalAmountCents: original, couponCode: coupon?.code ?? null, couponDiscountCents: discount, taxCents: 0, amountAfterDiscountsCents: afterDiscounts, availableReferralCreditCents: Math.max(0, account.availableCents), referralCreditAppliedCents: credit, payableAmountCents: afterDiscounts - credit, currency: test.price.currency.toUpperCase() };
}

export async function reserveCredit(userId: Types.ObjectId, purchaseId: Types.ObjectId, amountCents: number) {
  if (amountCents <= 0) return;
  const idempotencyKey = `credit-reservation:${purchaseId}`;
  if (await WalletLedger.findOne({ idempotencyKey })) return;
  await ensureWalletAccount(userId);
  const result = await WalletAccount.updateOne({ userId, availableCents: { $gte: amountCents } }, { $inc: { availableCents: -amountCents } });
  if (result.modifiedCount !== 1) throw AppError.conflict('Your available referral credit changed. Please review checkout again.');
  try {
    await WalletLedger.create({ userId, entryType: 'credit_reservation', amountCents, currency: 'USD', status: 'reserved', idempotencyKey, relatedPurchaseId: purchaseId });
  } catch (error: any) {
    if (error?.code === 11000) {
      await WalletAccount.updateOne({ userId }, { $inc: { availableCents: amountCents } });
      return;
    }
    await WalletAccount.updateOne({ userId }, { $inc: { availableCents: amountCents } });
    throw error;
  }
}

export async function consumeCredit(purchase: { _id: Types.ObjectId; userId: Types.ObjectId; creditAppliedCents?: number }) {
  const amount = purchase.creditAppliedCents ?? 0;
  if (!amount) return;
  await WalletLedger.updateOne({ relatedPurchaseId: purchase._id, entryType: 'credit_reservation', status: 'reserved' }, { $set: { status: 'consumed' } });
}

export async function releaseCredit(purchase: { _id: Types.ObjectId; userId: Types.ObjectId; creditAppliedCents?: number }) {
  const amount = purchase.creditAppliedCents ?? 0;
  if (!amount) return;
  const result = await WalletLedger.updateOne({ relatedPurchaseId: purchase._id, entryType: 'credit_reservation', status: 'reserved' }, { $set: { status: 'released' } });
  if (result.modifiedCount === 1) await WalletAccount.updateOne({ userId: purchase.userId }, { $inc: { availableCents: amount } });
}
