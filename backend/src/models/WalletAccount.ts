import { Schema, model, Document, Types } from 'mongoose';

export interface IWalletAccount extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  availableCents: number;
  createdAt: Date;
  updatedAt: Date;
}

const walletAccountSchema = new Schema<IWalletAccount>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  availableCents: { type: Number, required: true, min: 0, validate: { validator: Number.isInteger, message: 'availableCents must be an integer.' } }
}, { timestamps: true });

export const WalletAccount = model<IWalletAccount>('WalletAccount', walletAccountSchema);
