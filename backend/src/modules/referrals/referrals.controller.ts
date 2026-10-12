import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { getReferralHistory, getReferralOverview, getWalletHistory, claimReferralAttribution } from './referrals.service';
import { Purchase } from '../../models/Purchase';
import { processReferralReward } from './referrals.service';

export const overview = asyncHandler(async (req: Request, res: Response) => res.json(await getReferralOverview(req.user!.id)));
export const history = asyncHandler(async (req: Request, res: Response) => res.json({ referrals: await getReferralHistory(req.user!.id) }));
export const ledger = asyncHandler(async (req: Request, res: Response) => res.json({ entries: await getWalletHistory(req.user!.id) }));
export const balance = asyncHandler(async (req: Request, res: Response) => {
  const data = await getReferralOverview(req.user!.id);
  res.json({ currency: 'USD', availableReferralCreditCents: data.availableReferralCreditCents });
});
export const claim = asyncHandler(async (req: Request, res: Response) => {
  const code = String(req.body?.referralCode ?? '').trim();
  if (!code) return res.json({ attributed: false });
  const referral = await claimReferralAttribution(req.user!.id, code);
  const paidPurchase = await Purchase.findOne({ userId: req.user!.id, status: 'paid' }).sort({ paidAt: -1 });
  if (paidPurchase) await processReferralReward(req.user!.id, paidPurchase._id);
  res.json({ attributed: true, referralId: referral?._id ?? null });
});
