import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import { User, IUser } from '../../models/User';
import { AppError } from '../../utils/AppError';
import { env } from '../../config/env';
import { JwtPayload } from './auth.types';
import { createHash, randomBytes } from 'crypto';
import { verifyMarketingUnsubscribeToken } from './marketingToken';
import { sendPasswordResetEmail } from './mailer';

const SALT_ROUNDS = 12;
const MIN_PASSWORD_LENGTH = 8;

export interface RegisterInput {
  username: string;
  email?: string;
  phone?: string;
  password: string;
  marketingEmails?: boolean;
}

export interface LoginInput {
  identifier: string; // email or phone
  password: string;
}

function validatePassword(password: string) {
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    throw AppError.badRequest(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  }
}

function normalizeEmail(email?: string): string | undefined {
  return email ? email.trim().toLowerCase() : undefined;
}

function normalizePhone(phone?: string): string | undefined {
  return phone ? phone.trim() : undefined;
}

function normalizeUsername(username?: string): string | undefined {
  return username ? username.trim().toLowerCase() : undefined;
}

export function signToken(user: IUser): string {
  const payload: JwtPayload = { sub: user._id.toString(), role: user.role, sessionVersion: user.sessionVersion };
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn } as jwt.SignOptions);
}

export async function registerUser(input: RegisterInput): Promise<{ user: IUser; token: string }> {
  const username = normalizeUsername(input.username);
  const email = normalizeEmail(input.email);
  const phone = normalizePhone(input.phone);

  if (!username) {
    throw AppError.badRequest('Username is required.');
  }
  if (!email && !phone) {
    throw AppError.badRequest('Provide an email or a phone number.');
  }
  validatePassword(input.password);

  const existing = await User.findOne({
    $or: [{ username }, ...(email ? [{ email }] : []), ...(phone ? [{ phone }] : [])]
  });
  if (existing) {
    // Do not reveal which field collided, to avoid account enumeration.
    throw AppError.conflict('An account with this email or phone number already exists.');
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  const marketingEmails = input.marketingEmails === true;
  const user = await User.create({ username, email, phone, passwordHash, role: 'user', marketingEmails, marketingConsentAt: marketingEmails ? new Date() : null });
  const token = signToken(user);
  return { user, token };
}

export async function loginUser(input: LoginInput): Promise<{ user: IUser; token: string }> {
  if (!input.identifier || !input.password) {
    throw AppError.badRequest('Identifier and password are required.');
  }

  const identifier = input.identifier.trim().toLowerCase();
  const user = await User.findOne({
    $or: [{ username: identifier }, { email: identifier }, { phone: input.identifier.trim() }]
  });

  // Generic message for both "no such user" and "wrong password" to avoid enumeration.
  const invalidCredentialsError = () => AppError.unauthorized('Invalid credentials.');

  if (!user || user.active === false) throw invalidCredentialsError();

  const matches = await bcrypt.compare(input.password, user.passwordHash);
  if (!matches) throw invalidCredentialsError();

  const token = signToken(user);
  return { user, token };
}

export async function revokeSessions(userId: Types.ObjectId) {
  await User.updateOne({ _id: userId }, { $inc: { sessionVersion: 1 } });
}

export async function updateMarketingPreference(userId: Types.ObjectId, marketingEmails: boolean) {
  const user = await User.findByIdAndUpdate(userId, { marketingEmails, marketingConsentAt: marketingEmails ? new Date() : null }, { new: true }).select('-passwordHash');
  if (!user) throw AppError.notFound('User not found.');
  return user;
}

export async function unsubscribeMarketing(token: string) {
  try {
    const userId = verifyMarketingUnsubscribeToken(token);
    await User.findByIdAndUpdate(userId, { marketingEmails: false, marketingConsentAt: null });
  } catch {
    throw AppError.badRequest('This unsubscribe link is invalid or expired.');
  }
}

export async function requestPasswordReset(emailInput: string) {
  const email = normalizeEmail(emailInput);
  if (!email) throw AppError.badRequest('A valid email is required.');
  const user = await User.findOne({ email });
  // The controller always returns the same public response whether or not a user exists.
  if (!user) return;
  const rawToken = randomBytes(32).toString('hex');
  user.passwordResetTokenHash = createHash('sha256').update(rawToken).digest('hex');
  user.passwordResetExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
  await user.save();
  await sendPasswordResetEmail(email, `${env.passwordResetUrl}?token=${rawToken}`);
}

export async function resetPassword(rawToken: string, newPassword: string) {
  if (!rawToken) throw AppError.badRequest('Reset token is required.');
  validatePassword(newPassword);
  const tokenHash = createHash('sha256').update(rawToken).digest('hex');
  const user = await User.findOne({ passwordResetTokenHash: tokenHash }).select('+passwordResetTokenHash +passwordResetExpiresAt');
  if (!user || !user.passwordResetExpiresAt || user.passwordResetExpiresAt.getTime() < Date.now()) throw AppError.badRequest('This reset link is invalid or expired.');
  user.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  user.passwordResetTokenHash = null;
  user.passwordResetExpiresAt = null;
  user.sessionVersion += 1;
  await user.save();
}
