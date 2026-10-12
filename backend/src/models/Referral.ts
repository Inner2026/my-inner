import { Schema, model, Document, Types } from 'mongoose';

export type ReferralStatus = 'pending' | 'qualified' | 'rewarded';

export interface IReferral extends Document {
  _id: Types.ObjectId;
  referrerUserId: Types.ObjectId;
  referredUserId: Types.ObjectId;
  referralCode: string;
  status: ReferralStatus;
  qualifyingPurchaseId?: Types.ObjectId | null;
  createdAt: Date;
  qualifiedAt?: Date | null;
  rewardedAt?: Date | null;
  rewardEmailSentAt?: Date | null;
}

const referralSchema = new Schema<IReferral>({
  referrerUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  referredUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  referralCode: { type: String, required: true, uppercase: true, trim: true },
  status: { type: String, enum: ['pending', 'qualified', 'rewarded'], default: 'pending', required: true },
  qualifyingPurchaseId: { type: Schema.Types.ObjectId, ref: 'Purchase', default: null },
  qualifiedAt: { type: Date, default: null },
  rewardedAt: { type: Date, default: null },
  rewardEmailSentAt: { type: Date, default: null }
}, { timestamps: { createdAt: true, updatedAt: false } });

referralSchema.index({ referredUserId: 1 }, { unique: true });
referralSchema.index({ referrerUserId: 1, createdAt: -1 });
referralSchema.index({ status: 1, createdAt: -1 });

export const Referral = model<IReferral>('Referral', referralSchema);
