import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import { env } from '../../config/env';

export function createMarketingUnsubscribeToken(userId: Types.ObjectId) {
  return jwt.sign({ sub: userId.toString(), purpose: 'marketing-unsubscribe' }, env.jwtSecret, { expiresIn: '30d' });
}

export function verifyMarketingUnsubscribeToken(token: string) {
  const payload = jwt.verify(token, env.jwtSecret) as { sub?: string; purpose?: string };
  if (payload.purpose !== 'marketing-unsubscribe' || !payload.sub) throw new Error('Invalid token');
  return payload.sub;
}
