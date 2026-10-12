import { Schema, model } from 'mongoose';

export interface IPromotionSettings {
  key: string;
  announcementEnabled: boolean;
  announcementText: string;
  announcementEndsAt?: Date | null;
  referralEmailSubject: string;
  referralEmailMessage: string;
  referralCreditExpiryDays: number;
}

const schema = new Schema<IPromotionSettings>({
  key: { type: String, unique: true, default: 'default' },
  announcementEnabled: { type: Boolean, default: true },
  announcementText: { type: String, default: 'Invite a friend and earn $1 toward your next My Inner test.' },
  announcementEndsAt: { type: Date, default: null },
  referralEmailSubject: { type: String, default: 'You earned $1 in My Inner credit' },
  referralEmailMessage: { type: String, default: 'Your friend completed their first My Inner purchase. You earned $1 in My Inner credit, valid for 60 days.' },
  referralCreditExpiryDays: { type: Number, default: 60, min: 1, max: 3650 }
}, { timestamps: true });

export const PromotionSettings = model<IPromotionSettings>('PromotionSettings', schema);
