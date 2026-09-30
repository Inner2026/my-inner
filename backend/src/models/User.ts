import { Schema, model, Document, Types } from 'mongoose';

export type UserRole = 'user' | 'admin';

export interface IUser extends Document {
  _id: Types.ObjectId;
  username?: string;
  email?: string;
  phone?: string;
  passwordHash: string;
  role: UserRole;
  active: boolean;
  sessionVersion: number;
  marketingEmails: boolean;
  marketingConsentAt?: Date | null;
  passwordResetTokenHash?: string | null;
  passwordResetExpiresAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    username: { type: String, unique: true, sparse: true, trim: true, lowercase: true },
    email: { type: String, lowercase: true, trim: true, unique: true, sparse: true },
    phone: { type: String, trim: true, unique: true, sparse: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user', required: true },
    active: { type: Boolean, default: true, required: true },
    sessionVersion: { type: Number, default: 0, required: true },
    marketingEmails: { type: Boolean, default: false, required: true },
    marketingConsentAt: { type: Date, default: null }
    ,passwordResetTokenHash: { type: String, default: null, select: false }
    ,passwordResetExpiresAt: { type: Date, default: null, select: false }
  },
  { timestamps: true }
);

userSchema.pre('validate', function (next) {
  if (!this.email && !this.phone) {
    next(new Error('A user must have an email or a phone number.'));
    return;
  }
  next();
});

// toJSON: never leak the password hash
userSchema.set('toJSON', {
  transform: (_doc, ret: any) => {
    delete ret.passwordHash;
    return ret;
  }
});

userSchema.index({ createdAt: -1 });
userSchema.index({ active: 1, createdAt: -1 });
userSchema.index({ marketingEmails: 1, createdAt: -1 });

export const User = model<IUser>('User', userSchema);
