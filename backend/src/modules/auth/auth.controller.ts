import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { registerUser, loginUser, requestPasswordReset, resetPassword, revokeSessions, updateMarketingPreference, unsubscribeMarketing } from './auth.service';
import { User } from '../../models/User';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { username, email, phone, password, marketingEmails } = req.body ?? {};
  const { user, token } = await registerUser({ username, email, phone, password, marketingEmails: marketingEmails === true });
  res.status(201).json({ token, user: user.toJSON() });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { identifier, password } = req.body ?? {};
  const { user, token } = await loginUser({ identifier, password });
  res.json({ token, user: user.toJSON() });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user!.id).select('-passwordHash').lean();
  if (!user) { res.status(404).json({ error: { message: 'User not found.' } }); return; }
  res.json({ ...user, id: user._id, role: user.role });
});

export const updatePreferences = asyncHandler(async (req: Request, res: Response) => {
  if (typeof req.body?.marketingEmails !== 'boolean') { res.status(400).json({ error: { message: 'marketingEmails must be a boolean.' } }); return; }
  const user = await updateMarketingPreference(req.user!.id, req.body.marketingEmails);
  res.json({ user: user.toJSON() });
});

export const unsubscribe = asyncHandler(async (req: Request, res: Response) => {
  await unsubscribeMarketing(String(req.query.token ?? ''));
  res.json({ message: 'You have been unsubscribed from marketing emails.' });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  await revokeSessions(req.user!.id);
  res.status(204).send();
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  await requestPasswordReset(req.body?.email);
  res.json({ message: 'If an account exists for that email, a reset link has been sent.' });
});

export const resetPasswordHandler = asyncHandler(async (req: Request, res: Response) => {
  await resetPassword(req.body?.token, req.body?.password);
  res.json({ message: 'Password reset successfully.' });
});
