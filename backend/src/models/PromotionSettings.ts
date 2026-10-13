import { Schema, model } from 'mongoose';

export interface IPromotionSettings {
  key: string;
  announcementEnabled: boolean;
  announcementText: string;
  announcementTagline: string;
  announcementEndsAt?: Date | null;
  referralEmailSubject: string;
  referralEmailMessage: string;
  referralCreditExpiryDays: number;
  footerMessage: string;
  socialLinks: { facebook: string; instagram: string; tiktok: string; snapchat: string; youtube: string; linkedin: string; x: string };
}

const schema = new Schema<IPromotionSettings>({
  key: { type: String, unique: true, default: 'default' },
  announcementEnabled: { type: Boolean, default: true },
  announcementText: { type: String, default: 'Invite a friend and earn $1 toward your next My Inner test.' },
  announcementTagline: { type: String, default: 'Share the good energy' },
  announcementEndsAt: { type: Date, default: null },
  referralEmailSubject: { type: String, default: 'You earned $1 in My Inner credit' },
  referralEmailMessage: { type: String, default: 'Your friend completed their first My Inner purchase. You earned $1 in My Inner credit, valid for 60 days.' },
  referralCreditExpiryDays: { type: Number, default: 60, min: 1, max: 3650 },
  footerMessage: { type: String, default: 'Have questions? We are here to help.' },
  socialLinks: {
    facebook: { type: String, default: '' }, instagram: { type: String, default: '' }, tiktok: { type: String, default: '' },
    snapchat: { type: String, default: '' }, youtube: { type: String, default: '' }, linkedin: { type: String, default: '' }, x: { type: String, default: '' }
  }
}, { timestamps: true });

export const PromotionSettings = model<IPromotionSettings>('PromotionSettings', schema);
