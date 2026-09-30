import { ScoringInput, ScoringOutput, ScoringStrategy } from '../types';
import { resolveAndValidateAnswers, effectiveValue } from '../helpers';

interface Band {
  key: string;
  min: number;
  max: number;
}

/**
 * Relationship/Compatibility-style scoring: average per category, each
 * average matched independently to a band (low/medium/high, etc.), then
 * ResultDefinitions are looked up per "<categoryKey>:<bandKey>" combination
 * and the engine assembles all matched descriptions together.
 *
 * ASSUMPTION (flagged): the specification shows worked-example category
 * averages but does not define numeric band thresholds for this test (unlike
 * Inner Child, which gives explicit ranges). Bands must be supplied via
 * scoringConfig.bands; if omitted, a neutral 3-band default (low/medium/high
 * split evenly across the 1-5 scale) is used and should be confirmed by an
 * admin before this test version is published.
 */
const DEFAULT_BANDS: Band[] = [
  { key: 'low', min: 1, max: 2.33 },
  { key: 'medium', min: 2.34, max: 3.66 },
  { key: 'high', min: 3.67, max: 5 }
];

export const categoryAverageBandStrategy: ScoringStrategy = {
  calculate(input: ScoringInput): ScoringOutput {
    const resolved = resolveAndValidateAnswers(input.questions, input.answers);
    const bands = (input.scoringConfig.bands as Band[] | undefined) ?? DEFAULT_BANDS;

    const sums: Record<string, number> = {};
    const counts: Record<string, number> = {};
    for (const { question, option } of resolved) {
      const cat = question.categoryKey ?? 'uncategorized';
      sums[cat] = (sums[cat] ?? 0) + effectiveValue(option);
      counts[cat] = (counts[cat] ?? 0) + 1;
    }

    const categoryScores: Record<string, number> = {};
    const resultKeys: string[] = [];

    for (const cat of input.categories) {
      const avg = counts[cat.key] ? sums[cat.key] / counts[cat.key] : 0;
      categoryScores[cat.key] = Math.round(avg * 100) / 100;
      const band = bands.find((b) => avg >= b.min && avg <= b.max) ?? bands[bands.length - 1];
      resultKeys.push(`${cat.key}:${band.key}`);
    }

    return {
      resultKeys,
      rawScores: { sums, counts },
      categoryScores
    };
  }
};
