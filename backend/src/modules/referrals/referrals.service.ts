import { randomBytes } from 'crypto';
import { Types } from 'mongoose';
import { User } from '../../models/User';
import { Referral } from '../../models/Referral';
import { WalletLedger } from '../../models/WalletLedger';
import { AppError } from '../../utils/AppError';
import { env } from '../../config/env';
import { WalletAccount } from '../../models/WalletAccount';
import { getPromotionSettings } from '../admin/promotion.service';
import { sendReferralUsedEmail } from '../auth/mailer';

const REWARD_CENTS = 100;
const CODE_RETRIES = 8;

export async function expireWalletCredits(userId: Types.ObjectId) {
  if (typeof (WalletLedger as any).find !== 'function') return;
  const query = (WalletLedger as any).find({ userId, entryType: 'referral_reward', status: 'posted', expiresAt: { $lte: new Date() } });
  if (!query) return;
  const expired = await query.select('_id amountCents').lean();
  for (const entry of expired) {
    const result = await WalletLedger.updateOne({ _id: entry._id, status: 'posted' }, { $set: { status: 'expired' } });
    if (result.modifiedCount) await WalletAccount.updateOne({ userId, availableCents: { $gte: entry.amountCents } }, { $inc: { availableCents: -entry.amountCents } });
  }
}

export async function ensureWalletAccount(userId: Types.ObjectId) {
  await expireWalletCredits(userId);
  let account = await WalletAccount.findOne({ userId });
  if (account) return account;
  const earned = await WalletLedger.aggregate([{ $match: { userId, status: { $in: ['posted', 'consumed'] } } }, { $group: { _id: null, cents: { $sum: { $cond: [{ $eq: ['$entryType', 'referral_reward'] }, '$amountCents', { $multiply: ['$amountCents', -1] }] } } } }]);
  try {
    account = await WalletAccount.create({ userId, availableCents: earned[0]?.cents ?? 0 });
  } catch (error: any) {
    if (error?.code !== 11000) throw error;
    account = await WalletAccount.findOne({ userId });
  }
  if (!account) throw AppError.internal('Wallet account is unavailable.');
  return account;
}

function makeCode() {
  // Base32 avoids ambiguous punctuation and does not encode an ObjectId or PII.
  return randomBytes(8).toString('base64url').replace(/[^a-z0-9]/gi, '').slice(0, 10).toUpperCase();
}

export async function ensureReferralCode(userId: Types.ObjectId) {
  const existing = await User.findById(userId).select('_id referralCode');
  if (!existing) throw AppError.notFound('User not found.');
  if (existing.referralCode) return existing.referralCode;
  for (let attempt = 0; attempt < CODE_RETRIES; attempt += 1) {
    const code = makeCode();
    try {
      const result = await User.updateOne({ _id: userId, referralCode: { $exists: false } }, { $set: { referralCode: code } });
      if (result.modifiedCount === 1) return code;
      const current = await User.findById(userId).select('referralCode').lean();
      if (current?.referralCode) return current.referralCode;
    } catch (error: any) {
      if (error?.code !== 11000) throw error;
    }
  }
  throw AppError.internal('Could not allocate a unique referral code.');
}

export async function validateReferralCode(code: string) {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return null;
  const referrer = await User.findOne({ referralCode: normalized }).select('_id referralCode').lean();
  if (!referrer) throw AppError.badRequest('This referral link is invalid.');
  return referrer;
}

export async function createReferralAttribution(referredUserId: Types.ObjectId, code?: string) {
  if (!code) return null;
  const referrer = await validateReferralCode(code);
  if (!referrer || referrer._id.equals(referredUserId)) throw AppError.badRequest('Self-referrals are not allowed.');
  try {
    const referral = await Referral.create({ referrerUserId: referrer._id, referredUserId, referralCode: referrer.referralCode, status: 'pending' });
    return referral;
  } catch (error: any) {
    if (error?.code === 11000) throw AppError.conflict('This account already has a referral attribution.');
    throw error;
  }
}

export async function claimReferralAttribution(referredUserId: Types.ObjectId, code: string) {
  const existing = await Referral.findOne({ referredUserId });
  if (existing) return existing;
  return createReferralAttribution(referredUserId, code);
}

export async function processReferralReward(referredUserId: Types.ObjectId, purchaseId: Types.ObjectId) {
  const referral = await Referral.findOneAndUpdate(
    { referredUserId, status: 'pending' },
    { $set: { status: 'qualified', qualifyingPurchaseId: purchaseId, qualifiedAt: new Date() } },
    { new: true }
  ) ?? await Referral.findOne({ referredUserId, status: 'qualified' });
  if (!referral) return null;

  const idempotencyKey = `referral-reward:${referral._id.toString()}`;
  await ensureWalletAccount(referral.referrerUserId);
  const settings = await getPromotionSettings();
  const expiresAt = new Date(Date.now() + (settings?.referralCreditExpiryDays ?? 60) * 24 * 60 * 60 * 1000);
  let created = false;
  try {
    await WalletLedger.create({ userId: referral.referrerUserId, referralId: referral._id, entryType: 'referral_reward', amountCents: REWARD_CENTS, currency: 'USD', status: 'posted', idempotencyKey, relatedPurchaseId: referral.qualifyingPurchaseId, expiresAt });
    created = true;
  } catch (error: any) {
    if (error?.code !== 11000) throw error;
  }
  if (created) {
    await WalletAccount.updateOne({ userId: referral.referrerUserId }, { $inc: { availableCents: REWARD_CENTS } });
  }
  await Referral.updateOne({ _id: referral._id, status: 'qualified' }, { $set: { status: 'rewarded', rewardedAt: new Date() } });
  const emailClaim = await Referral.findOne({ _id: referral._id, status: 'rewarded', rewardEmailSentAt: null });
  if (emailClaim) void (async () => { try { await notifyReferrerOfReward(emailClaim.referrerUserId); await Referral.updateOne({ _id: emailClaim._id, rewardEmailSentAt: null }, { $set: { rewardEmailSentAt: new Date() } }); } catch (error: any) { if (!env.isProd) console.warn('[referrals] reward email failed', error?.message); } })();
  return referral;
}

export async function getReferralOverview(userId: Types.ObjectId) {
  const [code, total, pending, successful, earned, spent, account] = await Promise.all([
    ensureReferralCode(userId),
    Referral.countDocuments({ referrerUserId: userId }),
    Referral.countDocuments({ referrerUserId: userId, status: 'pending' }),
    Referral.countDocuments({ referrerUserId: userId, status: 'rewarded' }),
    WalletLedger.aggregate([{ $match: { userId, entryType: 'referral_reward', status: { $in: ['posted', 'expired'] } } }, { $group: { _id: null, cents: { $sum: '$amountCents' } } }]),
    WalletLedger.aggregate([{ $match: { userId, entryType: { $in: ['credit_spend', 'credit_reservation'] }, status: { $in: ['posted', 'consumed'] } } }, { $group: { _id: null, cents: { $sum: '$amountCents' } } }]),
    ensureWalletAccount(userId)
  ]);
  const earnedCents = earned[0]?.cents ?? 0;
  const spentCents = spent[0]?.cents ?? 0;
  return { referralCode: code, referralLink: `${env.clientOrigin.replace(/\/$/, '')}/login?ref=${code}`, totalReferredUsers: total, pendingReferrals: pending, successfulReferrals: successful, totalReferralCreditEarnedCents: earnedCents, totalReferralCreditSpentCents: spentCents, availableReferralCreditCents: Math.max(0, account.availableCents), reservedReferralCreditCents: Math.max(0, earnedCents - spentCents - account.availableCents) };
}

async function notifyReferrerOfReward(referrerId: Types.ObjectId) {
  const query = (User as any).findById(referrerId);
  if (!query) return;
  const referrer = await query.select('email').lean();
  if (!referrer?.email) return;
  const settings = await getPromotionSettings();
  await sendReferralUsedEmail(referrer.email, settings?.referralEmailSubject ?? 'You earned $1 in My Inner credit', settings?.referralEmailMessage ?? 'Your friend completed their first My Inner purchase. You earned $1 in My Inner credit, valid for 60 days.');
}

export async function getReferralHistory(userId: Types.ObjectId) {
  return Referral.find({ referrerUserId: userId }).sort({ createdAt: -1 }).populate('referredUserId', 'username createdAt').lean();
}

export async function getWalletHistory(userId: Types.ObjectId) {
  return WalletLedger.find({ userId }).sort({ createdAt: -1 }).lean();
}
