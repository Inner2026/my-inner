import { ScoringInput, ScoringOutput, ScoringStrategy } from '../types';
import { resolveAndValidateAnswers } from '../helpers';

/**
 * Spirit Animal-style scoring: each chosen answer option is pre-mapped
 * (resultMapping) to exactly one outcome (e.g. an animal). Tally points,
 * rank, resultKey = "<primary>+<secondary>".
 */
export const tallyMappingStrategy: ScoringStrategy = {
  calculate(input: ScoringInput): ScoringOutput {
    const resolved = resolveAndValidateAnswers(input.questions, input.answers);

    const tally: Record<string, number> = {};
    for (const { option } of resolved) {
      const key = option.resultMapping;
      if (!key) continue;
      for (const animal of key.split('+')) {
        tally[animal] = (tally[animal] ?? 0) + 1;
      }
    }

    const ranked = Object.entries(tally).sort((a, b) => b[1] - a[1]);
    if (ranked.length === 0) {
      throw new Error('No answer options carried a resultMapping; cannot tally a result.');
    }
    const max = ranked[0][1];
    const tiedForFirst = ranked.filter(([, score]) => score === max).map(([animal]) => animal);
    let primary = ranked[0][0];
    let secondary = ranked.length > 1 ? ranked[1][0] : ranked[0][0];

    // The client key specifies that the final question is the tie-breaker.
    // The final answer is the last resolved answer, and may award a point to
    // one or more animals. If it cannot separate the tied leaders, preserve
    // both leaders as the combined result instead of inventing a preference.
    if (tiedForFirst.length > 1) {
      const finalMapping = resolved[resolved.length - 1].option.resultMapping?.split('+') ?? [];
      const tieBreakers = tiedForFirst.filter((animal) => finalMapping.includes(animal));
      if (tieBreakers.length === 1) {
        primary = tieBreakers[0];
        secondary = tiedForFirst.find((animal) => animal !== primary) ?? ranked.find(([animal]) => animal !== primary)?.[0] ?? primary;
      } else {
        primary = tiedForFirst[0];
        secondary = tiedForFirst[1];
      }
    }

    return {
      resultKeys: [`${primary}+${secondary}`],
      rawScores: { tally },
      categoryScores: tally
    };
  }
};
