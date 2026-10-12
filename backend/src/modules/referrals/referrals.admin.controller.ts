import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { Referral } from '../../models/Referral';
import { WalletLedger } from '../../models/WalletLedger';

export const listReferrals = asyncHandler(async (req: Request, res: Response) => {
  const status = ['pending', 'qualified', 'rewarded'].includes(String(req.query.status)) ? String(req.query.status) : undefined;
  const query = status ? { status } : {};
  const referrals = await Referral.find(query).sort({ createdAt: -1 }).populate('referrerUserId', 'username email').populate('referredUserId', 'username email').populate('qualifyingPurchaseId', 'status amount currency paidAt').lean();
  res.json({ referrals });
});

export const referralTotals = asyncHandler(async (_req: Request, res: Response) => {
  const [referrals, ledger] = await Promise.all([
    Referral.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    WalletLedger.aggregate([{ $match: { entryType: 'referral_reward', status: 'posted' } }, { $group: { _id: '$currency', cents: { $sum: '$amountCents' }, count: { $sum: 1 } } }])
  ]);
  res.json({ referrals, rewards: ledger });
});
