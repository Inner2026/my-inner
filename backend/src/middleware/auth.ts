import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';
import { JwtPayload, AuthedUser } from '../modules/auth/auth.types';
import { User } from '../models/User';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthedUser;
    }
  }
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(AppError.unauthorized('Authentication required.'));
  }
  const token = header.slice('Bearer '.length);
  try {
    const payload = jwt.verify(token, env.jwtSecret) as JwtPayload;
    const user = await User.findById(payload.sub).select('_id role active sessionVersion').lean();
    if (!user || user.active === false || user.sessionVersion !== payload.sessionVersion) {
      return next(AppError.unauthorized('Invalid or expired session.'));
    }
    req.user = { id: user._id, role: user.role, sessionVersion: user.sessionVersion };
    next();
  } catch {
    next(AppError.unauthorized('Invalid or expired session.'));
  }
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) return next(AppError.unauthorized('Authentication required.'));
  if (req.user.role !== 'admin') return next(AppError.forbidden('Admin access required.'));
  next();
}

// Populates req.user if a valid token is present, but does not fail the request otherwise.
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return next();
  const token = header.slice('Bearer '.length);
  try {
    const payload = jwt.verify(token, env.jwtSecret) as JwtPayload;
    void User.findById(payload.sub).select('_id role active sessionVersion').lean().then((user) => {
      if (user && user.active !== false && user.sessionVersion === payload.sessionVersion) {
        req.user = { id: user._id, role: user.role, sessionVersion: user.sessionVersion };
      }
      next();
    }).catch(() => next());
    return;
  } catch {
    // ignore invalid token for optional auth
  }
  next();
}
