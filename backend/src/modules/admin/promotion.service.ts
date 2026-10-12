import { PromotionSettings } from '../../models/PromotionSettings';
import mongoose from 'mongoose';

export const DEFAULT_PROMOTION = {
  announcementEnabled: true,
  announcementText: 'Invite a friend and earn $1 toward your next My Inner test.',
  announcementEndsAt: null,
  referralEmailSubject: 'You earned $1 in My Inner credit',
  referralEmailMessage: 'Your friend completed their first My Inner purchase. You earned $1 in My Inner credit, valid for 60 days.',
  referralCreditExpiryDays: 60
};

export async function getPromotionSettings() {
  if (mongoose.connection.readyState !== 1) return { ...DEFAULT_PROMOTION, key: 'default' } as any;
  return PromotionSettings.findOneAndUpdate({ key: 'default' }, { $setOnInsert: { key: 'default', ...DEFAULT_PROMOTION } }, { upsert: true, new: true, setDefaultsOnInsert: true }).lean();
}

export function publicPromotion(settings: Awaited<ReturnType<typeof getPromotionSettings>>) {
  return { announcementEnabled: settings?.announcementEnabled ?? DEFAULT_PROMOTION.announcementEnabled, announcementText: settings?.announcementText ?? DEFAULT_PROMOTION.announcementText, announcementEndsAt: settings?.announcementEndsAt ?? null };
}
