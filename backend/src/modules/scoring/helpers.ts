import { IQuestion, IAnswerOption } from '../../models/Question';
import { AppError } from '../../utils/AppError';
import { SubmittedAnswer } from './types';

export interface ResolvedAnswer {
  question: IQuestion;
  option: IAnswerOption;
}

/**
 * Validates that every question was answered exactly once with a valid option
 * belonging to that question, and that no unknown questions were submitted.
 * This is the backend-side answer validation -- the frontend's submission is
 * never trusted beyond "which option id did the user click".
 */
export function resolveAndValidateAnswers(questions: IQuestion[], answers: SubmittedAnswer[]): ResolvedAnswer[] {
  const questionsById = new Map(questions.map((q) => [q._id.toString(), q]));

  if (answers.length !== questions.length) {
    throw AppError.badRequest(
      `Expected ${questions.length} answers but received ${answers.length}. All questions must be answered.`
    );
  }

  const seen = new Set<string>();
  const resolved: ResolvedAnswer[] = [];

  for (const answer of answers) {
    if (seen.has(answer.questionId)) {
      throw AppError.badRequest(`Duplicate answer submitted for question ${answer.questionId}.`);
    }
    seen.add(answer.questionId);

    const question = questionsById.get(answer.questionId);
    if (!question) {
      throw AppError.badRequest(`Question ${answer.questionId} does not belong to this test version.`);
    }
    const option = question.answerOptions.find((o) => o._id.toString() === answer.answerOptionId);
    if (!option) {
      throw AppError.badRequest(`Answer option ${answer.answerOptionId} is not valid for question ${answer.questionId}.`);
    }
    resolved.push({ question, option });
  }

  // Ensure every question in the version was answered (not just that counts match).
  for (const q of questions) {
    if (!seen.has(q._id.toString())) {
      throw AppError.badRequest(`Missing answer for question ${q._id.toString()}.`);
    }
  }

  return resolved;
}

export function effectiveValue(option: IAnswerOption): number {
  const base = option.numericalValue ?? 0;
  return option.scoringDirection === 'negative' ? -base : base;
}
