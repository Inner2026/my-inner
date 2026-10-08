import { Types } from 'mongoose';
import { Test } from '../../models/Test';
import { TestRating } from '../../models/TestRating';
import { TestAttempt } from '../../models/TestAttempt';
import { AppError } from '../../utils/AppError';

async function findPublicTest(slug: string) {
  const test = await Test.findOne({ slug, active: true }).select('_id').lean();
  if (!test) throw AppError.notFound('Test not found.');
  return test;
}

async function buildSummary(testId: Types.ObjectId, userId?: Types.ObjectId) {
  const [summaryRows, reviews] = await Promise.all([
    TestRating.aggregate<{ average: number; count: number }>([
    { $match: { testId } },
    { $group: { _id: null, average: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]),
    TestRating.find({ testId }).select('rating comment createdAt userId').populate('userId', 'username').sort({ createdAt: -1 }).limit(50).lean()
  ]);
  const summary = summaryRows[0];
  const [own, completedAttempt] = userId
    ? await Promise.all([
        TestRating.findOne({ testId, userId }).select('rating').lean(),
        TestAttempt.exists({ testId, userId, status: 'submitted' })
      ])
    : [null, null];
  return {
    average: summary ? Math.round(summary.average * 10) / 10 : 0,
    count: summary?.count ?? 0,
    userRating: own?.rating ?? null,
    canRate: Boolean(completedAttempt),
    reviews: reviews.map((review: any) => ({
      id: String(review._id),
      rating: review.rating,
      comment: review.comment ?? '',
      author: review.userId?.username || 'Anonymous',
      createdAt: review.createdAt
    }))
  };
}

export async function getRatingSummary(slug: string, userId?: string | Types.ObjectId) {
  const test = await findPublicTest(slug);
  return buildSummary(test._id, userId ? new Types.ObjectId(userId) : undefined);
}

export async function saveRating(slug: string, userId: string | Types.ObjectId, rating: number, comment = '') {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw AppError.badRequest('Rating must be an integer from 1 to 5.');
  }
  const test = await findPublicTest(slug);
  const userObjectId = new Types.ObjectId(userId);
  const completedAttempt = await TestAttempt.exists({ testId: test._id, userId: userObjectId, status: 'submitted' });
  if (!completedAttempt) throw AppError.forbidden('Complete this test before rating it.');
  const trimmedComment = comment.trim();
  if (trimmedComment.length > 500) throw AppError.badRequest('Your feedback must be 500 characters or fewer.');
  await TestRating.findOneAndUpdate(
    { testId: test._id, userId: userObjectId },
    { $set: { rating, comment: trimmedComment } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return buildSummary(test._id, userObjectId);
}
