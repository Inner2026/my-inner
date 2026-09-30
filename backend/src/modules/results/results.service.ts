import { Types } from 'mongoose';
import { TestAttempt } from '../../models/TestAttempt';
import { Test } from '../../models/Test';
import { AppError } from '../../utils/AppError';

export async function listUserResults(userId: Types.ObjectId) {
  const attempts = await TestAttempt.find({ userId, status: 'submitted' })
    .sort({ completedAt: -1 })
    .lean();

  const testIds = [...new Set(attempts.map((a) => a.testId.toString()))];
  const tests = await Test.find({ _id: { $in: testIds } }).lean();
  const testsById = new Map(tests.map((t) => [t._id.toString(), t]));

  return attempts.map((a) => ({
    attemptId: a._id,
    testName: testsById.get(a.testId.toString())?.name ?? 'Unknown test',
    completedAt: a.completedAt,
    resultTitle: a.result?.snapshot.title
  }));
}

/** Always renders from the frozen snapshot -- never re-fetches ResultDefinition live. */
export async function getUserResult(userId: Types.ObjectId, attemptId: string) {
  const attempt = await TestAttempt.findOne({ _id: attemptId, userId, status: 'submitted' }).lean();
  if (!attempt || !attempt.result) {
    throw AppError.notFound('Result not found.');
  }
  const test = await Test.findById(attempt.testId).lean();

  return {
    attemptId: attempt._id,
    purchaseId: attempt.purchaseId,
    testSlug: test?.slug,
    testName: test?.name ?? 'Unknown test',
    completedAt: attempt.completedAt,
    categoryScores: attempt.result.categoryScores,
    resultKey: attempt.result.resultKey,
    snapshot: attempt.result.snapshot
  };
}
