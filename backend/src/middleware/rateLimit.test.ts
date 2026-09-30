import { rateLimit } from './rateLimit';

describe('rateLimit middleware', () => {
  it('allows the configured number and rejects the next request', () => {
    const limiter = rateLimit({ windowMs: 60_000, max: 2 });
    const next = jest.fn();
    const response = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn(), setHeader: jest.fn() }) as any;
    const request = { ip: '198.51.100.10', socket: {} } as any;
    limiter(request, response(), next); limiter(request, response(), next);
    const third = response(); limiter(request, third, next);
    expect(next).toHaveBeenCalledTimes(2);
    expect(third.status).toHaveBeenCalledWith(429);
    expect(third.json).toHaveBeenCalledWith({ error: { message: 'Too many requests. Please try again later.' } });
  });
});
