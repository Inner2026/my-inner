import { ScoringInput, ScoringOutput, ScoringStrategy } from '../types';
import { resolveAndValidateAnswers } from '../helpers';

type Band = { key: string; min: number; max: number };

/** Deterministic Cube scoring from the client-provided trait weights. */
export const traitBandAssemblyStrategy: ScoringStrategy = {
  calculate(input: ScoringInput): ScoringOutput {
    const resolved = resolveAndValidateAnswers(input.questions, input.answers);
    const bands = (input.scoringConfig.bands as Record<string, Band[]> | undefined) ?? {};
    const totals: Record<string, number> = {};

    for (const { option } of resolved) {
      for (const [trait, value] of Object.entries(option.scoringWeights ?? {})) {
        totals[trait] = (totals[trait] ?? 0) + value;
      }
    }

    const resultKeys = input.categories.map((category) => {
      const total = totals[category.key] ?? 0;
      const band = (bands[category.key] ?? []).find((candidate) => total >= candidate.min && total <= candidate.max);
      if (!band) throw new Error(`No result band defined for ${category.key} score ${total}.`);
      return `${category.key}:${band.key}`;
    });

    return { resultKeys, rawScores: { totals }, categoryScores: totals };
  }
};
