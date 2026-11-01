import { ScoringInput, ScoringOutput, ScoringStrategy } from '../types';
import { resolveAndValidateAnswers } from '../helpers';

/**
 * How a tally test reports its outcome (scoringConfig.resultMode):
 * - 'pair' (default, used by Hidden Animal): resultKey = "<primary>+<secondary>",
 *   so every possible pair needs its own result definition.
 * - 'single': resultKey = "<primary>", so each outcome needs one result definition.
 */
export type TallyResultMode = 'pair' | 'single';

export function tallyResultMode(scoringConfig: unknown): TallyResultMode {
  return (scoringConfig as Record<string, unknown> | null | undefined)?.resultMode === 'single' ? 'single' : 'pair';
}

function splitMapping(mapping: string | null | undefined): string[] {
  return (mapping ?? '').split('+').map((part) => part.trim()).filter(Boolean);
}

/**
 * Lists every resultKey this test can produce, so validation can block
 * publishing until each one has a result definition (otherwise a paying
 * customer hits "no matching ResultDefinition" after answering).
 */
export function requiredTallyResultKeys(
  questions: Array<{ answerOptions: Array<{ resultMapping?: string | null }> }>,
  scoringConfig: unknown
): string[] {
  const outcomes = [...new Set(questions.flatMap((q) => q.answerOptions.flatMap((o) => splitMapping(o.resultMapping))))];
  if (tallyResultMode(scoringConfig) === 'single') return outcomes;

  const keys: string[] = [];
  for (const primary of outcomes) {
    for (const secondary of outcomes) {
      if (primary !== secondary) keys.push(`${primary}+${secondary}`);
    }
  }
  // "<x>+<x>" only happens when every chosen answer points to x alone, which
  // requires each question to offer an answer mapped to exactly x.
  for (const outcome of outcomes) {
    const reachableAlone = questions.every((q) => q.answerOptions.some((o) => {
      const parts = splitMapping(o.resultMapping);
      return parts.length === 1 && parts[0] === outcome;
    }));
    if (reachableAlone) keys.push(`${outcome}+${outcome}`);
  }
  return keys;
}

/**
 * Spirit Animal-style scoring: each chosen answer option is pre-mapped
 * (resultMapping) to one or more outcomes (e.g. an animal). Tally points and
 * rank; see TallyResultMode for the resultKey format.
 */
export const tallyMappingStrategy: ScoringStrategy = {
  calculate(input: ScoringInput): ScoringOutput {
    const resolved = resolveAndValidateAnswers(input.questions, input.answers);

    const tally: Record<string, number> = {};
    for (const { option } of resolved) {
      for (const animal of splitMapping(option.resultMapping)) {
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
      const finalMapping = splitMapping(resolved[resolved.length - 1].option.resultMapping);
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
      resultKeys: [tallyResultMode(input.scoringConfig) === 'single' ? primary : `${primary}+${secondary}`],
      rawScores: { tally },
      categoryScores: tally
    };
  }
};
