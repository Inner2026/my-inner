jest.mock('../../models/User', () => ({ User: { findById: jest.fn(), findOne: jest.fn(), updateOne: jest.fn(), exists: jest.fn() } }));
jest.mock('../../models/Referral', () => ({ Referral: { create: jest.fn(), findOneAndUpdate: jest.fn(), findOne: jest.fn(), updateOne: jest.fn(), countDocuments: jest.fn(), find: jest.fn() } }));
jest.mock('../../models/WalletLedger', () => ({ WalletLedger: { create: jest.fn(), aggregate: jest.fn(), find: jest.fn() } }));
jest.mock('../../models/WalletAccount', () => ({ WalletAccount: { findOne: jest.fn(), create: jest.fn(), updateOne: jest.fn() } }));

import { User } from '../../models/User';
import { Referral } from '../../models/Referral';
import { WalletLedger } from '../../models/WalletLedger';
import { WalletAccount } from '../../models/WalletAccount';
import { Types } from 'mongoose';
import { createReferralAttribution, processReferralReward } from './referrals.service';

const referrerId = new Types.ObjectId('507f1f77bcf86cd799439011');
const referredId = new Types.ObjectId('507f1f77bcf86cd799439012');
const purchaseId = new Types.ObjectId('507f1f77bcf86cd799439013');

describe('referral service', () => {
  beforeEach(() => jest.clearAllMocks());

  it('attributes a valid code and rejects an invalid code', async () => {
    (User.findOne as jest.Mock).mockReturnValue({ select: () => ({ lean: async () => ({ _id: referrerId, referralCode: 'ABC123' }) }) });
    (Referral.create as jest.Mock).mockResolvedValue({ status: 'pending' });
    await expect(createReferralAttribution(referredId, 'abc123')).resolves.toEqual({ status: 'pending' });
    expect(Referral.create).toHaveBeenCalledWith(expect.objectContaining({ referrerUserId: referrerId, referredUserId: referredId, referralCode: 'ABC123', status: 'pending' }));

    (User.findOne as jest.Mock).mockReturnValue({ select: () => ({ lean: async () => null }) });
    await expect(createReferralAttribution(referredId, 'nope')).rejects.toThrow('referral link is invalid');
  });

  it('credits once with an idempotency key under concurrent callbacks', async () => {
    const referral = { _id: referrerId, referrerUserId: referrerId, referredUserId: referredId, qualifyingPurchaseId: purchaseId };
    (Referral.findOneAndUpdate as jest.Mock).mockResolvedValueOnce(referral).mockResolvedValueOnce(null);
    (Referral.findOne as jest.Mock).mockResolvedValue(referral);
    (WalletAccount.findOne as jest.Mock).mockResolvedValue({ availableCents: 0 });
    (WalletAccount.updateOne as jest.Mock).mockResolvedValue({ modifiedCount: 1 });
    let writes = 0;
    (WalletLedger.create as jest.Mock).mockImplementation(async () => {
      writes += 1;
      if (writes > 1) throw { code: 11000 };
      return {};
    });
    (Referral.updateOne as jest.Mock).mockResolvedValue({ modifiedCount: 1 });
    await Promise.all([processReferralReward(referredId, purchaseId), processReferralReward(referredId, purchaseId)]);
    expect(WalletLedger.create).toHaveBeenCalledTimes(2);
    expect(WalletLedger.create).toHaveBeenCalledWith(expect.objectContaining({ amountCents: 100, entryType: 'referral_reward', idempotencyKey: `referral-reward:${referrerId}` }));
    expect(Referral.updateOne).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ $set: expect.objectContaining({ status: 'rewarded' }) }));
  });
});
