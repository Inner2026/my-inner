jest.mock('../../models/Test', () => ({ Test: { findOne: jest.fn() } }));
jest.mock('../../models/TestVersion', () => ({ TestVersion: { findOne: jest.fn() } }));
jest.mock('../../models/Coupon', () => ({ Coupon: { findOne: jest.fn() } }));
jest.mock('../../models/WalletAccount', () => ({ WalletAccount: { findOne: jest.fn(), create: jest.fn(), updateOne: jest.fn() } }));
jest.mock('../../models/WalletLedger', () => ({ WalletLedger: { aggregate: jest.fn(), create: jest.fn(), updateOne: jest.fn(), findOne: jest.fn() } }));
jest.mock('../../config/db', () => ({ isDbConnected: jest.fn(() => true) }));
jest.mock('../referrals/referrals.service', () => ({ ensureWalletAccount: jest.fn() }));

import { Test } from '../../models/Test';
import { TestVersion } from '../../models/TestVersion';
import { Coupon } from '../../models/Coupon';
import { ensureWalletAccount } from '../referrals/referrals.service';
import { calculateCheckout, reserveCredit } from './checkout.service';
import { WalletAccount } from '../../models/WalletAccount';
import { WalletLedger } from '../../models/WalletLedger';

const userId = '507f1f77bcf86cd799439011' as any;

describe('checkout calculation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Test.findOne as jest.Mock).mockResolvedValue({ _id: 'test-1', slug: 'inner', name: 'Inner', currentVersionId: 'version-1', price: { amount: 1000, currency: 'USD' } });
    (TestVersion.findOne as jest.Mock).mockResolvedValue({ _id: 'version-1' });
    (ensureWalletAccount as jest.Mock).mockResolvedValue({ availableCents: 300 });
    (Coupon.findOne as jest.Mock).mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
    (WalletLedger.findOne as jest.Mock).mockResolvedValue(null);
    (WalletLedger.create as jest.Mock).mockResolvedValue({});
    (WalletAccount.updateOne as jest.Mock).mockResolvedValue({ modifiedCount: 1 });
  });

  it('reserves credit atomically and repeated reservation is idempotent', async () => {
    await reserveCredit(userId, '507f1f77bcf86cd799439012' as any, 100);
    expect(WalletAccount.updateOne).toHaveBeenCalledWith({ userId, availableCents: { $gte: 100 } }, { $inc: { availableCents: -100 } });
    (WalletLedger.findOne as jest.Mock).mockResolvedValue({ idempotencyKey: 'credit-reservation:507f1f77bcf86cd799439012' });
    await reserveCredit(userId, '507f1f77bcf86cd799439012' as any, 100);
    expect(WalletLedger.create).toHaveBeenCalledTimes(1);
  });

  it('calculates the original price without discounts', async () => {
    await expect(calculateCheckout(userId, 'inner')).resolves.toMatchObject({ originalAmountCents: 1000, couponDiscountCents: 0, referralCreditAppliedCents: 0, payableAmountCents: 1000 });
  });

  it('stacks a coupon and referral credit, capped at the remaining amount', async () => {
    (Coupon.findOne as jest.Mock).mockReturnValue({ lean: jest.fn().mockResolvedValue({ code: 'SAVE200', discountType: 'fixed', discountValue: 200, active: true, testSlugs: [], expiresAt: null, maxRedemptions: null, redeemedCount: 0 }) });
    await expect(calculateCheckout(userId, 'inner', 'SAVE200', true)).resolves.toMatchObject({ couponDiscountCents: 200, amountAfterDiscountsCents: 800, referralCreditAppliedCents: 300, payableAmountCents: 500 });
    (ensureWalletAccount as jest.Mock).mockResolvedValue({ availableCents: 900 });
    await expect(calculateCheckout(userId, 'inner', 'SAVE200', true)).resolves.toMatchObject({ referralCreditAppliedCents: 800, payableAmountCents: 0 });
  });
});
