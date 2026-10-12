import { Schema, model, Document, Types } from 'mongoose';

export type CouponDiscountType = 'fixed' | 'percent';

export interface ICoupon extends Document {
  _id: Types.ObjectId;
  code: string;
  discountType: CouponDiscountType;
  discountValue: number;
  active: boolean;
  testSlugs?: string[];
  expiresAt?: Date | null;
  maxRedemptions?: number | null;
  redeemedCount: number;
}

const couponSchema = new Schema<ICoupon>({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  discountType: { type: String, enum: ['fixed', 'percent'], required: true },
  discountValue: { type: Number, required: true, min: 0 },
  active: { type: Boolean, default: true, required: true },
  testSlugs: { type: [String], default: [] },
  expiresAt: { type: Date, default: null },
  maxRedemptions: { type: Number, default: null, min: 1 },
  redeemedCount: { type: Number, default: 0, min: 0 }
});

export const Coupon = model<ICoupon>('Coupon', couponSchema);
