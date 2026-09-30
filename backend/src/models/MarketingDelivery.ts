import { Schema, model, Document, Types } from 'mongoose';

export interface IMarketingDelivery extends Document {
  userId: Types.ObjectId;
  testId: Types.ObjectId;
  kind: 'new_test';
  status: 'sent' | 'failed';
  error?: string | null;
  sentAt?: Date | null;
  createdAt: Date;
}

const schema = new Schema<IMarketingDelivery>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  testId: { type: Schema.Types.ObjectId, ref: 'Test', required: true },
  kind: { type: String, enum: ['new_test'], required: true },
  status: { type: String, enum: ['sent', 'failed'], required: true },
  error: { type: String, default: null },
  sentAt: { type: Date, default: null }
}, { timestamps: { createdAt: true, updatedAt: false } });

schema.index({ userId: 1, testId: 1, kind: 1 }, { unique: true });
schema.index({ status: 1, createdAt: -1 });

export const MarketingDelivery = model<IMarketingDelivery>('MarketingDelivery', schema);
