import { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/AppError';
import { env } from '../config/env';

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: { message: `Route not found: ${req.method} ${req.originalUrl}` } });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  if (err instanceof AppError) {
    if (!env.isProd) {
      console.error(`[error] ${err.statusCode} ${err.message}`);
    }
    return res.status(err.statusCode).json({
      error: { message: err.message, details: err.details ?? undefined }
    });
  }

  // Malformed JSON request body (thrown by express.json()'s underlying
  // body-parser before any route handler runs) -- a client error, not a
  // server fault, so it must be a 400, not the generic 500 fallback below.
  if (typeof err === 'object' && err !== null && (err as any).type === 'entity.parse.failed') {
    return res.status(400).json({ error: { message: 'Malformed JSON in request body.' } });
  }

  // Mongoose duplicate key error
  if (typeof err === 'object' && err !== null && (err as any).code === 11000) {
    return res.status(409).json({ error: { message: 'A record with this value already exists.' } });
  }

  // Mongoose validation error
  if (typeof err === 'object' && err !== null && (err as any).name === 'ValidationError') {
    return res.status(400).json({ error: { message: 'Validation failed.', details: (err as any).errors } });
  }

  console.error('[unhandled error]', err);
  return res.status(500).json({ error: { message: 'Something went wrong. Please try again.' } });
}
