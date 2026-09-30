import { ScoringMethod, ScoringStrategy } from './types';
import { weightedDichotomyStrategy } from './strategies/weightedDichotomy';
import { categorySumRangeStrategy } from './strategies/categorySumRange';
import { categorySumRankingStrategy } from './strategies/categorySumRanking';
import { correctAnswerPercentageStrategy } from './strategies/correctAnswerPercentage';
import { tallyMappingStrategy } from './strategies/tallyMapping';
import { categoryAverageBandStrategy } from './strategies/categoryAverageBand';
import { frameworkSnippetAssemblyStrategy } from './strategies/frameworkSnippetAssembly';
import { traitBandAssemblyStrategy } from './strategies/traitBandAssembly';

/**
 * The ONLY place that maps a scoring method to its implementation.
 * Adding a future test means either reusing one of these methods or adding
 * exactly one new entry here -- never a test-id branch anywhere else.
 */
export const scoringStrategyRegistry: Record<ScoringMethod, ScoringStrategy> = {
  WEIGHTED_DICHOTOMY: weightedDichotomyStrategy,
  CATEGORY_SUM_RANGE: categorySumRangeStrategy,
  CATEGORY_SUM_RANKING: categorySumRankingStrategy,
  CORRECT_ANSWER_PERCENTAGE: correctAnswerPercentageStrategy,
  TALLY_MAPPING: tallyMappingStrategy,
  CATEGORY_AVERAGE_BAND: categoryAverageBandStrategy,
  FRAMEWORK_SNIPPET_ASSEMBLY: frameworkSnippetAssemblyStrategy,
  TRAIT_BAND_ASSEMBLY: traitBandAssemblyStrategy
};
