import { Schema, model, Document, Types } from 'mongoose';

export type LedgerEntryType = 'referral_reward' | 'referral_reversal' | 'credit_reservation' | 'credit_spend' | 'credit_release';
export type LedgerStatus = 'posted' | 'reserved' | 'consumed' | 'released' | 'reversed' | 'expired';

export interface IWalletLedger extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  referralId?: Types.ObjectId | null;
  entryType: LedgerEntryType;
  amountCents: number;
  currency: string;
  status: LedgerStatus;
  idempotencyKey: string;
  relatedPurchaseId?: Types.ObjectId | null;
  expiresAt?: Date | null;
  createdAt: Date;
}

const walletLedgerSchema = new Schema<IWalletLedger>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  referralId: { type: Schema.Types.ObjectId, ref: 'Referral', default: null },
  entryType: { type: String, enum: ['referral_reward', 'referral_reversal', 'credit_reservation', 'credit_spend', 'credit_release'], required: true },
  amountCents: { type: Number, required: true, min: 1, validate: { validator: Number.isInteger, message: 'amountCents must be an integer.' } },
  currency: { type: String, required: true, uppercase: true, default: 'USD' },
  status: { type: String, enum: ['posted', 'reserved', 'consumed', 'released', 'reversed', 'expired'], default: 'posted', required: true },
  idempotencyKey: { type: String, required: true, unique: true },
  relatedPurchaseId: { type: Schema.Types.ObjectId, ref: 'Purchase', default: null },
  expiresAt: { type: Date, default: null }
}, { timestamps: { createdAt: true, updatedAt: false } });

walletLedgerSchema.index({ userId: 1, createdAt: -1 });
walletLedgerSchema.index({ referralId: 1 }, { unique: true, sparse: true, partialFilterExpression: { entryType: 'referral_reward' } });

export const WalletLedger = model<IWalletLedger>('WalletLedger', walletLedgerSchema);
