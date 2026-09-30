import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { AppError } from '../../utils/AppError';
import { getRatingSummary, saveRating } from './ratings.service';

export const getRatings = asyncHandler(async (req: Request, res: Response) => {
  res.json({ rating: await getRatingSummary(req.params.slug, req.user?.id) });
});

export const rateTest = asyncHandler(async (req: Request, res: Response) => {
  const rating = Number(req.body?.rating);
  const comment = typeof req.body?.comment === 'string' ? req.body.comment : '';
  if (!req.user) throw AppError.unauthorized('Authentication required.');
  res.json({ rating: await saveRating(req.params.slug, req.user.id, rating, comment) });
});
