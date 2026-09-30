import { Router } from 'express';
import { register, login, me, logout, updatePreferences, unsubscribe, forgotPassword, resetPasswordHandler } from './auth.controller';
import { requireAuth } from '../../middleware/auth';
import { rateLimit } from '../../middleware/rateLimit';

export const authRouter = Router();

authRouter.post('/register', rateLimit({ windowMs: 15 * 60_000, max: 10 }), register);
authRouter.post('/login', rateLimit({ windowMs: 15 * 60_000, max: 10, message: 'Too many login attempts. Please try again later.' }), login);
authRouter.get('/me', requireAuth, me);
authRouter.post('/logout', requireAuth, logout);
authRouter.patch('/preferences', requireAuth, updatePreferences);
authRouter.get('/unsubscribe', unsubscribe);
authRouter.post('/forgot-password', rateLimit({ windowMs: 15 * 60_000, max: 5 }), forgotPassword);
authRouter.post('/reset-password', rateLimit({ windowMs: 15 * 60_000, max: 5 }), resetPasswordHandler);
