import { ScoringInput, ScoringOutput, ScoringStrategy } from '../types';
import { resolveAndValidateAnswers, effectiveValue } from '../helpers';

/**
 * Inner Child-style scoring: sum all answers to a total score (0..max),
 * then match the total against pre-defined [minScore, maxScore] ranges
 * (one ResultDefinition per range, e.g. "0-24", "25-48", ...).
 */
export const categorySumRangeStrategy: ScoringStrategy = {
  calculate(input: ScoringInput): ScoringOutput {
    const resolved = resolveAndValidateAnswers(input.questions, input.answers);

    let total = 0;
    const categorySums: Record<string, number> = {};

    for (const { question, option } of resolved) {
      const value = effectiveValue(option);
      total += value;
      // Inner Child stores the client-defined dimension on each answer
      // option, because a question can offer answers from different hidden
      // dimensions.
      const cat = option.scoringCategory ?? question.categoryKey ?? 'uncategorized';
      categorySums[cat] = (categorySums[cat] ?? 0) + value;
    }

    const match = input.resultDefinitions.find(
      (def) =>
        def.minScore !== null &&
        def.minScore !== undefined &&
        def.maxScore !== null &&
        def.maxScore !== undefined &&
        total >= def.minScore &&
        total <= def.maxScore
    );

    if (!match) {
      throw new Error(`No result range defined that covers total score ${total}.`);
    }

    return {
      resultKeys: [match.resultKey],
      rawScores: { total },
      categoryScores: categorySums
    };
  }
};
