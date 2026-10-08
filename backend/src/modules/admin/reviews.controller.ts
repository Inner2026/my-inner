import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { TestRating } from '../../models/TestRating';
import { AppError } from '../../utils/AppError';
import { asyncHandler } from '../../utils/asyncHandler';

export const listReviews = asyncHandler(async (_req: Request, res: Response) => {
  const reviews = await TestRating.find()
    .select('rating comment createdAt updatedAt testId userId')
    .populate('testId', 'name slug')
    .populate('userId', 'username email')
    .sort({ createdAt: -1 })
    .limit(500)
    .lean();
  res.json({ reviews });
});

export const deleteReview = asyncHandler(async (req: Request, res: Response) => {
  if (!Types.ObjectId.isValid(req.params.reviewId)) throw AppError.badRequest('Invalid review id.');
  const deleted = await TestRating.findByIdAndDelete(req.params.reviewId);
  if (!deleted) throw AppError.notFound('Review not found.');
  res.status(204).send();
});
