import { ScoringInput, ScoringOutput, ScoringStrategy } from '../types';
import { resolveAndValidateAnswers } from '../helpers';

/** IQ/Cognitive-style scoring: percent correct, matched to a score-range result. */
export const correctAnswerPercentageStrategy: ScoringStrategy = {
  calculate(input: ScoringInput): ScoringOutput {
    const resolved = resolveAndValidateAnswers(input.questions, input.answers);

    const correctCount = resolved.filter(({ option }) => option.isCorrect === true).length;
    const percentage = Math.round((correctCount / resolved.length) * 100);

    const match = input.resultDefinitions.find(
      (def) =>
        def.minScore !== null &&
        def.minScore !== undefined &&
        def.maxScore !== null &&
        def.maxScore !== undefined &&
        percentage >= def.minScore &&
        percentage <= def.maxScore
    );

    if (!match) {
      throw new Error(`No result range defined that covers percentage score ${percentage}.`);
    }

    return {
      resultKeys: [match.resultKey],
      rawScores: { correctCount, totalQuestions: resolved.length, percentage },
      categoryScores: { percentage }
    };
  }
};
