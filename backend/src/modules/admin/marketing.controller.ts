import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { User } from '../../models/User';
import { Test } from '../../models/Test';
import { MarketingDelivery } from '../../models/MarketingDelivery';
import { sendNewTestMarketingEmail } from '../auth/mailer';
import { AppError } from '../../utils/AppError';

export const sendNewTestNotification = asyncHandler(async (req: Request, res: Response) => {
  const test = await Test.findById(req.params.testId).lean();
  if (!test) throw AppError.notFound('Test not found.');
  const subscribers = await User.find({ active: true, marketingEmails: true, email: { $exists: true, $ne: '' } }).select('_id email').lean();
  let sent = 0; let skipped = 0; let failed = 0;
  for (const user of subscribers) {
    const existing = await MarketingDelivery.findOne({ userId: user._id, testId: test._id, kind: 'new_test' }).lean();
    if (existing) { skipped += 1; continue; }
    try {
      await sendNewTestMarketingEmail(user.email!, user._id, test);
      await MarketingDelivery.create({ userId: user._id, testId: test._id, kind: 'new_test', status: 'sent', sentAt: new Date() });
      sent += 1;
    } catch (error: any) {
      await MarketingDelivery.create({ userId: user._id, testId: test._id, kind: 'new_test', status: 'failed', error: String(error?.message ?? 'Email delivery failed').slice(0, 500) });
      failed += 1;
    }
  }
  if (subscribers.length > 0 && sent === 0 && failed === subscribers.length) throw AppError.serviceUnavailable('No marketing email was delivered. Check SMTP configuration and delivery logs.');
  res.json({ subscribers: subscribers.length, sent, skipped, failed });
});
