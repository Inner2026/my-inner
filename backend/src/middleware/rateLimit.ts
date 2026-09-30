import { NextFunction, Request, Response } from 'express';

type Bucket = { count: number; resetAt: number };

/** Small dependency-free fixed-window limiter for security-sensitive routes. */
export function rateLimit(options: { windowMs: number; max: number; message?: string }) {
  const buckets = new Map<string, Bucket>();
  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const current = buckets.get(key);
    const bucket = !current || current.resetAt <= now ? { count: 0, resetAt: now + options.windowMs } : current;
    bucket.count += 1;
    buckets.set(key, bucket);
    if (buckets.size > 10_000) {
      for (const [bucketKey, value] of buckets) if (value.resetAt <= now) buckets.delete(bucketKey);
    }
    res.setHeader('Retry-After', Math.ceil((bucket.resetAt - now) / 1000));
    if (bucket.count > options.max) {
      return res.status(429).json({ error: { message: options.message ?? 'Too many requests. Please try again later.' } });
    }
    next();
  };
}
