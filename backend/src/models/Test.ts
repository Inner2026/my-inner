import { Schema, model, Document, Types } from 'mongoose';

export interface ITest extends Document {
  _id: Types.ObjectId;
  slug: string;
  name: string;
  description: string;
  marketingSubject?: string;
  marketingMessage?: string;
  imageUrl?: string;
  price: { amount: number; currency: string };
  active: boolean;
  currentVersionId: Types.ObjectId | null;
  /** Set when an admin removes a test that has customer history: hidden everywhere, history kept. */
  removedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const testSchema = new Schema<ITest>(
  {
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    marketingSubject: { type: String, trim: true, default: '' },
    marketingMessage: { type: String, trim: true, default: '' },
    imageUrl: { type: String, trim: true, default: '' },
    price: {
      amount: { type: Number, required: true, min: 0 }, // in cents
      currency: { type: String, required: true, default: 'usd' }
    },
    active: { type: Boolean, default: false },
    currentVersionId: { type: Schema.Types.ObjectId, ref: 'TestVersion', default: null },
    removedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

testSchema.index({ active: 1 });

export const Test = model<ITest>('Test', testSchema);
