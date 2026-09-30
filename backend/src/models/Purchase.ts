import { Schema, model, Document, Types } from 'mongoose';

// 'capturing' is a transient lock state (see purchases.service.ts::capturePurchase)
// between a PayPal order being approved and its capture being confirmed --
// never a stable end state.
export type PurchaseStatus = 'pending' | 'capturing' | 'paid' | 'failed' | 'refunded';
export type PaymentProvider = 'paypal' | 'demo';

export interface IPurchase extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  testId: Types.ObjectId;
  testVersionId: Types.ObjectId;
  amount: number;
  currency: string;
  status: PurchaseStatus;
  paymentProvider: PaymentProvider;
  paypalOrderId: string;
  paypalCaptureId?: string | null;
  attemptId?: Types.ObjectId | null;
  createdAt: Date;
  paidAt?: Date | null;
  expiresAt?: Date | null;
}

const purchaseSchema = new Schema<IPurchase>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    testId: { type: Schema.Types.ObjectId, ref: 'Test', required: true },
    testVersionId: { type: Schema.Types.ObjectId, ref: 'TestVersion', required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: 'usd' },
    status: { type: String, enum: ['pending', 'capturing', 'paid', 'failed', 'refunded'], default: 'pending' },
    paymentProvider: { type: String, enum: ['paypal', 'demo'], required: true, default: 'paypal' },
    paypalOrderId: { type: String, required: true, unique: true },
    paypalCaptureId: { type: String, default: null },
    // NOTE: deliberately no `default: null` here. The uniqueness guarantee
    // below (at most one Purchase per TestAttempt) relies on a sparse index,
    // which only excludes documents where the field is truly ABSENT -- an
    // explicit `null` still counts as a value and would collide across every
    // unfunded purchase. Mongo's `{ attemptId: null }` queries (see
    // attempts.service.ts) match both "absent" and "explicit null", so
    // leaving the field genuinely unset here is safe everywhere it's read.
    attemptId: { type: Schema.Types.ObjectId, ref: 'TestAttempt' },
    paidAt: { type: Date, default: null }
    ,expiresAt: { type: Date, default: null }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

purchaseSchema.index({ userId: 1, status: 1 });
// At most one checkout may be active for a user/test pair. Paid and failed
// purchases remain allowed, so a user can retry after a failed checkout and
// can still retain historical payment records.
purchaseSchema.index(
  { userId: 1, testId: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ['pending', 'capturing'] } } }
);
purchaseSchema.index({ attemptId: 1 }, { sparse: true });

export const Purchase = model<IPurchase>('Purchase', purchaseSchema);
