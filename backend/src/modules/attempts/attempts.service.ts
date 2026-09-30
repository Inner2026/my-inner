import mongoose, { Types } from 'mongoose';
import { Purchase } from '../../models/Purchase';
import { TestAttempt } from '../../models/TestAttempt';
import { TestVersion } from '../../models/TestVersion';
import { Question } from '../../models/Question';
import { AppError } from '../../utils/AppError';
import { scoreAttempt } from '../scoring/scoringEngine';
import { SubmittedAnswer } from '../scoring/types';

export const FREE_RETAKE_WINDOW_DAYS = 90;
const FREE_RETAKE_WINDOW_MS = FREE_RETAKE_WINDOW_DAYS * 24 * 60 * 60 * 1000;

/**
 * Creates a TestAttempt from a paid purchase inside a transaction.
 * One paid purchase grants repeat attempts, but never two active attempts at
 * the same time. The first attempt is retained on Purchase.attemptId for
 * historical compatibility; retakes reuse the same paid entitlement without
 * overwriting that historical link.
 */
export async function createAttemptFromPurchase(userId: Types.ObjectId, purchaseId: string) {
  const session = await mongoose.startSession();
  try {
    let createdAttemptId: Types.ObjectId | null = null;

    await session.withTransaction(async () => {
      const purchase = await Purchase.findOne({ _id: purchaseId, userId }).session(session);
      if (!purchase) throw AppError.notFound('Purchase not found.');
      if (purchase.status !== 'paid') throw AppError.badRequest('This purchase has not been confirmed as paid yet.');

      const entitlementStart = purchase.paidAt ?? purchase.createdAt;
      if (entitlementStart && Date.now() - new Date(entitlementStart).getTime() >= FREE_RETAKE_WINDOW_MS) {
        throw AppError.forbidden('The free 90-day retake period has expired. Please purchase this test again to continue.');
      }

      if (purchase.attemptId) {
        const activeAttempt = await TestAttempt.findOne({
          purchaseId: purchase._id,
          userId,
          status: { $in: ['in_progress', 'scoring'] }
        }).session(session);
        if (activeAttempt) throw AppError.conflict('This purchase already has an active attempt.');
      }

      const [attempt] = await TestAttempt.create(
        [
          {
            userId,
            purchaseId: purchase._id,
            testId: purchase.testId,
            testVersionId: purchase.testVersionId,
            status: 'in_progress',
            startedAt: new Date(),
            answers: []
          }
        ],
        { session }
      );

      if (!purchase.attemptId) {
        const linked = await Purchase.updateOne(
          { _id: purchase._id, status: 'paid', attemptId: null },
          { $set: { attemptId: attempt._id } }
        ).session(session);
        if (linked.modifiedCount !== 1) {
          throw AppError.conflict('This purchase already has an active attempt.');
        }
      }

      createdAttemptId = attempt._id;
    });

    return await TestAttempt.findById(createdAttemptId);
  } finally {
    await session.endSession();
  }
}

export async function getOwnedAttempt(userId: Types.ObjectId, attemptId: string) {
  const attempt = await TestAttempt.findOne({ _id: attemptId, userId }).populate('testId', 'slug name description');
  if (!attempt) throw AppError.notFound('Attempt not found.');
  return attempt;
}

export async function listOwnedAttempts(userId: Types.ObjectId) {
  return TestAttempt.find({ userId })
    .sort({ startedAt: -1 })
    .populate('testId', 'slug name')
    .select('_id testId status startedAt completedAt')
    .lean();
}

/**
 * Sanitized question payload for the test-taking UI: never leaks isCorrect,
 * scoringCategory, scoringDirection, resultMapping, or numericalValue.
 */
export async function getAttemptQuestions(userId: Types.ObjectId, attemptId: string) {
  const attempt = await getOwnedAttempt(userId, attemptId);
  const questions = await Question.find({ testVersionId: attempt.testVersionId }).sort({ order: 1 }).lean();

  return questions.map((q) => ({
    id: q._id,
    categoryKey: q.categoryKey,
    questionText: q.questionText,
    questionType: q.questionType,
    order: q.order,
    answerOptions: q.answerOptions
      .sort((a, b) => a.order - b.order)
      .map((o) => ({ id: o._id, text: o.text, order: o.order }))
  }));
}

/**
 * Concurrency-safe submission. Two requests hitting this at once must not
 * both score and write a result for the same attempt.
 *
 * Rather than a transaction, this uses a single atomic conditional update to
 * "claim" the attempt (in_progress -> scoring) as a lock: Mongo guarantees
 * only one concurrent findOneAndUpdate can match a given document for that
 * filter, so exactly one caller wins the claim and every other caller (and
 * any later resubmission attempt) is rejected immediately. Only the winner
 * proceeds to score and, only on success, atomically writes the result and
 * flips scoring -> submitted. If scoring fails, the claim is released back
 * to in_progress so the user can correct their answers and retry -- the
 * attempt is never marked submitted before scoring has actually succeeded.
 */
export async function submitAttempt(userId: Types.ObjectId, attemptId: string, answers: SubmittedAnswer[]) {
  const claimed = await TestAttempt.findOneAndUpdate(
    { _id: attemptId, userId, status: 'in_progress' },
    { $set: { status: 'scoring' } },
    { new: true }
  );

  if (!claimed) {
    const exists = await TestAttempt.exists({ _id: attemptId, userId });
    if (!exists) throw AppError.notFound('Attempt not found.');
    throw AppError.conflict('This attempt has already been submitted.');
  }

  try {
    const version = await TestVersion.findById(claimed.testVersionId);
    if (!version) throw AppError.internal('Test version for this attempt no longer exists.');

    const questions = await Question.find({ testVersionId: claimed.testVersionId }).sort({ order: 1 });

    // scoreAttempt validates the answers internally (resolveAndValidateAnswers)
    // and throws AppError.badRequest on anything malformed or incomplete.
    const resultPayload = await scoreAttempt(version, questions, answers);

    const resolvedAnswers = answers.map((a) => {
      const q = questions.find((qq) => qq._id.toString() === a.questionId)!;
      const opt = q.answerOptions.find((o) => o._id.toString() === a.answerOptionId)!;
      return {
        questionId: q._id,
        answerOptionId: opt._id,
        numericValueSnapshot: opt.numericalValue ?? null
      };
    });

    const submitted = await TestAttempt.findOneAndUpdate(
      { _id: attemptId, status: 'scoring' },
      {
        $set: {
          answers: resolvedAnswers,
          assessmentSnapshot: resultPayload.assessmentSnapshot,
          status: 'submitted',
          completedAt: new Date(),
          result: resultPayload
        }
      },
      { new: true }
    );

    if (!submitted) {
      // We held the exclusive 'scoring' claim, so this should be unreachable.
      throw AppError.internal('Attempt state changed unexpectedly while scoring.');
    }

    return submitted;
  } catch (err) {
    await TestAttempt.updateOne({ _id: attemptId, status: 'scoring' }, { $set: { status: 'in_progress' } });
    throw err;
  }
}
