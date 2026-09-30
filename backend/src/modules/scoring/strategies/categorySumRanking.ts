import { ScoringInput, ScoringOutput, ScoringStrategy } from '../types';
import { resolveAndValidateAnswers, effectiveValue } from '../helpers';

/**
 * Five Love Languages-style scoring: sum answers per category, rank
 * categories, resultKey = "<primary>+<secondary>".
 */
export const categorySumRankingStrategy: ScoringStrategy = {
  calculate(input: ScoringInput): ScoringOutput {
    const resolved = resolveAndValidateAnswers(input.questions, input.answers);

    const categorySums: Record<string, number> = {};
    const partnerCategorySums: Record<string, number> = {};
    for (const cat of input.categories) categorySums[cat.key] = 0;

    for (const { question, option } of resolved) {
      const cat = question.categoryKey;
      if (!cat) continue;
      categorySums[cat] = (categorySums[cat] ?? 0) + effectiveValue(option);
      const partnerMapping = option.resultMapping?.match(/^PARTNER:([^:]+):(-?\d+(?:\.\d+)?)$/);
      if (partnerMapping) {
        const [, partnerCategory, partnerScore] = partnerMapping;
        partnerCategorySums[partnerCategory] = (partnerCategorySums[partnerCategory] ?? 0) + Number(partnerScore);
      }
    }

    const ranked = Object.entries(categorySums).sort((a, b) => b[1] - a[1]);
    const [primary, secondary] = ranked;

    if (ranked.length > 1 && ranked[0][1] === ranked[1][1]) {
      throw new Error('MISSING FROM CLIENT SPECIFICATION — tie-breaking rule not defined for Love Languages.');
    }

    return {
      resultKeys: [`${primary[0]}+${secondary[0]}`],
      rawScores: { categorySums, partnerCategorySums },
      categoryScores: categorySums
    };
  }
};
