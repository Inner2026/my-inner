import { ScoringInput, ScoringOutput, ScoringStrategy } from '../types';
import { resolveAndValidateAnswers, effectiveValue } from '../helpers';

/**
 * MBTI-style scoring.
 * scoringConfig.dichotomies: [["E","I"], ["S","N"], ["T","F"], ["J","P"]]
 *
 * ASSUMPTION (flagged, not silently chosen): the specification states weighted
 * values are summed per pole and "normalized to percentages" but does not give
 * the exact normalization formula. We normalize each pole's average response
 * (range -2..+2) onto a 0..4 scale, then express each pole as a percentage of
 * the pair's combined 0..4 scores. This reproduces the spec's worked example
 * shape (e.g. 38%/62%) without inventing psychological content.
 */
export const weightedDichotomyStrategy: ScoringStrategy = {
  calculate(input: ScoringInput): ScoringOutput {
    const resolved = resolveAndValidateAnswers(input.questions, input.answers);
    const dichotomies = (input.scoringConfig.dichotomies as [string, string][]) ?? [];

    const sums: Record<string, number> = {};
    const counts: Record<string, number> = {};

    for (const { option } of resolved) {
      const pole = option.scoringCategory;
      if (!pole) continue;
      sums[pole] = (sums[pole] ?? 0) + effectiveValue(option);
      counts[pole] = (counts[pole] ?? 0) + 1;
    }

    const categoryScores: Record<string, number> = {};
    let resultKey = '';

    const preferenceCountMode = input.scoringConfig.preferenceCountMode === true;
    for (const [poleA, poleB] of dichotomies) {
      if (preferenceCountMode) {
        const total = (counts[poleA] ?? 0) + (counts[poleB] ?? 0) || 1;
        const pctA = Math.round(((counts[poleA] ?? 0) / total) * 100);
        categoryScores[poleA] = pctA;
        categoryScores[poleB] = 100 - pctA;
        resultKey += pctA >= categoryScores[poleB] ? poleA : poleB;
        continue;
      }
      const avgA = counts[poleA] ? sums[poleA] / counts[poleA] : 0; // -2..2
      const avgB = counts[poleB] ? sums[poleB] / counts[poleB] : 0;
      const scaledA = avgA + 2; // 0..4
      const scaledB = avgB + 2;
      const total = scaledA + scaledB || 1;
      const pctA = Math.round((scaledA / total) * 100);
      const pctB = 100 - pctA;
      categoryScores[poleA] = pctA;
      categoryScores[poleB] = pctB;
      resultKey += pctA >= pctB ? poleA : poleB;
    }

    return {
      resultKeys: [resultKey],
      rawScores: { sums, counts },
      categoryScores
    };
  }
};
