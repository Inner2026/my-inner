import { Types } from 'mongoose';
import jwt from 'jsonwebtoken';
import { createMarketingUnsubscribeToken, verifyMarketingUnsubscribeToken } from './marketingToken';
import { env } from '../../config/env';

describe('marketing unsubscribe tokens', () => {
  it('round-trips a signed token for the intended user', () => {
    const userId = new Types.ObjectId();
    const token = createMarketingUnsubscribeToken(userId);
    expect(verifyMarketingUnsubscribeToken(token)).toBe(userId.toString());
  });

  it('rejects a token with another purpose', () => {
    const token = jwt.sign({ sub: new Types.ObjectId().toString(), purpose: 'password-reset' }, env.jwtSecret, { expiresIn: '30d' });
    expect(() => verifyMarketingUnsubscribeToken(token)).toThrow();
  });
});
