import { Types } from 'mongoose';
import { TestAttempt } from '../../models/TestAttempt';
import { Test } from '../../models/Test';
import { ResultDefinition } from '../../models/ResultDefinition';
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

/**
 * Renders from the frozen snapshot. The only exception: when a snapshot item has no
 * image (e.g. the attempt was taken before result images were added), the image is
 * filled in from the current ResultDefinition. Text content is never changed.
 */
export async function getUserResult(userId: Types.ObjectId, attemptId: string) {
  const attempt = await TestAttempt.findOne({ _id: attemptId, userId, status: 'submitted' }).lean();
  if (!attempt || !attempt.result) {
    throw AppError.notFound('Result not found.');
  }
  const test = await Test.findById(attempt.testId).lean();

  const snapshot = attempt.result.snapshot;
  let snapshotResults = snapshot?.results ?? [];
  const keysMissingImage = snapshotResults.filter((item) => !item.imageUrl).map((item) => item.resultKey);
  if (keysMissingImage.length > 0) {
    const definitions = await ResultDefinition.find({ testVersionId: attempt.testVersionId, resultKey: { $in: keysMissingImage } })
      .select('resultKey imageUrl')
      .lean();
    const imageByKey = new Map(definitions.filter((d) => d.imageUrl).map((d) => [d.resultKey, d.imageUrl as string]));
    snapshotResults = snapshotResults.map((item) => (item.imageUrl ? item : { ...item, imageUrl: imageByKey.get(item.resultKey) ?? item.imageUrl ?? null }));
  }

  return {
    attemptId: attempt._id,
    purchaseId: attempt.purchaseId,
    testSlug: test?.slug,
    testName: test?.name ?? 'Unknown test',
    completedAt: attempt.completedAt,
    categoryScores: attempt.result.categoryScores,
    rawScores: attempt.result.rawScores,
    resultKey: attempt.result.resultKey,
    snapshot: snapshot ? { ...snapshot, results: snapshotResults } : snapshot
  };
}
