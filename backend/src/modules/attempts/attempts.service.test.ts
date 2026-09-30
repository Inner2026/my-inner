import mongoose, { Types } from 'mongoose';

jest.mock('../../models/Purchase', () => ({
  Purchase: { findOne: jest.fn(), updateOne: jest.fn() }
}));

jest.mock('../../models/TestAttempt', () => ({
  TestAttempt: {
    create: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    findOneAndUpdate: jest.fn(),
    updateOne: jest.fn(),
    exists: jest.fn()
  }
}));
jest.mock('../../models/TestVersion', () => ({
  TestVersion: { findById: jest.fn() }
}));
jest.mock('../../models/Question', () => ({
  Question: { find: jest.fn() }
}));
jest.mock('../scoring/scoringEngine', () => ({
  scoreAttempt: jest.fn()
}));

import { TestAttempt } from '../../models/TestAttempt';
import { Purchase } from '../../models/Purchase';
import { TestVersion } from '../../models/TestVersion';
import { Question } from '../../models/Question';
import { scoreAttempt } from '../scoring/scoringEngine';
import { createAttemptFromPurchase, submitAttempt } from './attempts.service';

function oid() {
  return new Types.ObjectId();
}

const fakeResultPayload = {
  resultKey: 'K',
  rawScores: {},
  categoryScores: {},
  resultDefinitionId: oid(),
  resultDefinitionIds: [oid()],
  snapshot: { title: 'T', description: 'D', results: [{ resultKey: 'K', title: 'T', description: 'D' }] }
};

/**
 * Minimal in-memory stand-in for the atomic conditional updates the real
 * Mongo driver performs: an update only "matches" (and mutates state) when
 * the filter's status equals the document's current status.
 */
function installFakeAttemptStore(initialStatus: 'in_progress' | 'scoring' | 'submitted', testVersionId: Types.ObjectId) {
  let status = initialStatus;
  const doc = () => ({ _id: 'attempt-1', testVersionId, status });

  (TestAttempt.findOneAndUpdate as jest.Mock).mockImplementation(async (filter: any, update: any) => {
    if (filter.status !== undefined && filter.status !== status) return null;
    status = update.$set.status;
    return { ...doc(), ...update.$set };
  });
  (TestAttempt.updateOne as jest.Mock).mockImplementation(async (filter: any, update: any) => {
    if (filter.status !== undefined && filter.status !== status) return { modifiedCount: 0 };
    status = update.$set.status;
    return { modifiedCount: 1 };
  });
  (TestAttempt.exists as jest.Mock).mockImplementation(async () => true);

  return { getStatus: () => status };
}

describe('submitAttempt concurrency (race condition protection)', () => {
  const userId = oid();
  const attemptId = 'attempt-1';

  beforeEach(() => {
    jest.clearAllMocks();
    (TestVersion.findById as jest.Mock).mockResolvedValue({ _id: oid(), scoringMethod: 'CATEGORY_SUM_RANGE', scoringConfig: {}, categories: [] });
    (Question.find as jest.Mock).mockReturnValue({ sort: jest.fn().mockResolvedValue([]) });
    (scoreAttempt as jest.Mock).mockResolvedValue(fakeResultPayload);
  });

  it('only allows one of two concurrent submissions to win the claim; the other is rejected', async () => {
    const store = installFakeAttemptStore('in_progress', oid());

    // Fired back-to-back, mimicking two requests racing on the same attempt.
    const p1 = submitAttempt(userId, attemptId, []);
    const p2 = submitAttempt(userId, attemptId, []);

    const settled = await Promise.allSettled([p1, p2]);
    const fulfilled = settled.filter((s) => s.status === 'fulfilled');
    const rejected = settled.filter((s) => s.status === 'rejected');

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect((rejected[0] as PromiseRejectedResult).reason.message).toMatch(/already been submitted/i);

    // Scoring only ran once -- no double-write of a result.
    expect(scoreAttempt).toHaveBeenCalledTimes(1);
    expect(store.getStatus()).toBe('submitted');
  });

  it('rejects submission for an attempt that is not in_progress (already submitted)', async () => {
    installFakeAttemptStore('submitted', oid());

    await expect(submitAttempt(userId, attemptId, [])).rejects.toThrow(/already been submitted/i);
    expect(scoreAttempt).not.toHaveBeenCalled();
  });

  it('never marks the attempt submitted if scoring fails, and releases the claim back to in_progress', async () => {
    const store = installFakeAttemptStore('in_progress', oid());
    (scoreAttempt as jest.Mock).mockRejectedValue(new Error('bad answers'));

    await expect(submitAttempt(userId, attemptId, [])).rejects.toThrow('bad answers');

    // Released back to in_progress, not left stuck in 'scoring' and not submitted.
    expect(store.getStatus()).toBe('in_progress');
  });

  it('allows a resubmission after a failed scoring attempt releases the claim', async () => {
    const versionId = oid();
    const store = installFakeAttemptStore('in_progress', versionId);
    (scoreAttempt as jest.Mock).mockRejectedValueOnce(new Error('bad answers'));

    await expect(submitAttempt(userId, attemptId, [])).rejects.toThrow('bad answers');
    expect(store.getStatus()).toBe('in_progress');

    (scoreAttempt as jest.Mock).mockResolvedValueOnce(fakeResultPayload);
    const result = await submitAttempt(userId, attemptId, []);
    expect(result.status).toBe('submitted');
  });
});

describe('paid purchase access gating', () => {
  const userId = oid();
  const purchaseId = oid().toString();

  beforeEach(() => jest.clearAllMocks());

  it('creates exactly one test attempt only after a purchase is paid', async () => {
    const purchase = { _id: oid(), userId, testId: oid(), testVersionId: oid(), status: 'paid' };
    const attempt = { _id: oid(), userId, purchaseId: purchase._id };
    const session = { withTransaction: jest.fn(async (callback: () => Promise<void>) => callback()), endSession: jest.fn() };
    jest.spyOn(mongoose, 'startSession').mockResolvedValue(session as any);
    (Purchase.findOne as jest.Mock).mockReturnValue({ session: jest.fn().mockResolvedValue(purchase) });
    (Purchase.updateOne as jest.Mock).mockReturnValue({ session: jest.fn().mockResolvedValue({ modifiedCount: 1 }) });
    (TestAttempt.create as jest.Mock).mockResolvedValue([attempt]);
    (TestAttempt.findById as jest.Mock).mockResolvedValue(attempt);

    const result = await createAttemptFromPurchase(userId, purchaseId);

    expect(result).toBe(attempt);
    expect(TestAttempt.create).toHaveBeenCalledTimes(1);
    expect(Purchase.updateOne).toHaveBeenCalledWith({ _id: purchase._id, status: 'paid', attemptId: null }, { $set: { attemptId: attempt._id } });
  });

  it('does not grant access when payment is not paid', async () => {
    const purchase = { _id: oid(), userId, testId: oid(), testVersionId: oid(), status: 'failed' };
    const session = { withTransaction: jest.fn(async (callback: () => Promise<void>) => callback()), endSession: jest.fn() };
    jest.spyOn(mongoose, 'startSession').mockResolvedValue(session as any);
    (Purchase.findOne as jest.Mock).mockReturnValue({ session: jest.fn().mockResolvedValue(purchase) });

    await expect(createAttemptFromPurchase(userId, purchaseId)).rejects.toThrow(/not been confirmed as paid/);
    expect(TestAttempt.create).not.toHaveBeenCalled();
  });

  it('allows a retake after the original attempt is complete without replacing the historical purchase link', async () => {
    const originalAttemptId = oid();
    const retake = { _id: oid(), userId, purchaseId: purchaseId };
    const purchase = { _id: oid(), userId, testId: oid(), testVersionId: oid(), status: 'paid', attemptId: originalAttemptId };
    const session = { withTransaction: jest.fn(async (callback: () => Promise<void>) => callback()), endSession: jest.fn() };
    jest.spyOn(mongoose, 'startSession').mockResolvedValue(session as any);
    (Purchase.findOne as jest.Mock).mockReturnValue({ session: jest.fn().mockResolvedValue(purchase) });
    (TestAttempt.findOne as jest.Mock).mockReturnValue({ session: jest.fn().mockResolvedValue(null) });
    (TestAttempt.create as jest.Mock).mockResolvedValue([retake]);
    (TestAttempt.findById as jest.Mock).mockResolvedValue(retake);

    await expect(createAttemptFromPurchase(userId, purchaseId)).resolves.toBe(retake);
    expect(TestAttempt.create).toHaveBeenCalledTimes(1);
    expect(Purchase.updateOne).not.toHaveBeenCalled();
  });

  it('rejects a second active retake without creating another attempt', async () => {
    const purchase = { _id: oid(), userId, testId: oid(), testVersionId: oid(), status: 'paid', attemptId: oid() };
    const activeAttempt = { _id: oid(), status: 'in_progress' };
    const session = { withTransaction: jest.fn(async (callback: () => Promise<void>) => callback()), endSession: jest.fn() };
    jest.spyOn(mongoose, 'startSession').mockResolvedValue(session as any);
    (Purchase.findOne as jest.Mock).mockReturnValue({ session: jest.fn().mockResolvedValue(purchase) });
    (TestAttempt.findOne as jest.Mock).mockReturnValue({ session: jest.fn().mockResolvedValue(activeAttempt) });

    await expect(createAttemptFromPurchase(userId, purchaseId)).rejects.toThrow(/active attempt/i);
    expect(TestAttempt.create).not.toHaveBeenCalled();
  });

  it('requires a new purchase after the 90-day free retake window', async () => {
    const purchase = {
      _id: oid(), userId, testId: oid(), testVersionId: oid(), status: 'paid', attemptId: oid(),
      paidAt: new Date(Date.now() - (91 * 24 * 60 * 60 * 1000))
    };
    const session = { withTransaction: jest.fn(async (callback: () => Promise<void>) => callback()), endSession: jest.fn() };
    jest.spyOn(mongoose, 'startSession').mockResolvedValue(session as any);
    (Purchase.findOne as jest.Mock).mockReturnValue({ session: jest.fn().mockResolvedValue(purchase) });

    await expect(createAttemptFromPurchase(userId, purchaseId)).rejects.toThrow(/90-day retake period has expired/i);
    expect(TestAttempt.create).not.toHaveBeenCalled();
  });
});
