import { ScoringInput, ScoringOutput, ScoringStrategy } from '../types';
import { resolveAndValidateAnswers } from '../helpers';
import { AppError } from '../../../utils/AppError';

export type HighestScoreOutcome = 'single' | 'blend' | 'mixed';

/**
 * "Highest category wins" scoring for pick-one personality tests (e.g. the
 * Energy Animal test): every answer option belongs to ONE category
 * (option.scoringCategory, falling back to option.resultMapping) and adds its
 * numericalValue (default 1) to that category.
 *
 * - The single highest category is the result, whatever its score
 *   (there is no minimum threshold and score ranges are ignored).
 * - The next-highest category is reported as the secondary energy.
 * - A two-way tie for first returns both results as a blended outcome;
 *   a three-or-more-way tie returns every tied result as a mixed outcome.
 *   Ties are never broken randomly.
 * - Percentages are categoryScore / totalPoints x 100 (with one point per
 *   question this is categoryScore / questionCount x 100).
 *
 * Ordering within ties follows the version's category order so results are
 * deterministic.
 */
export const categoryHighestScoreStrategy: ScoringStrategy = {
  calculate(input: ScoringInput): ScoringOutput {
    const resolved = resolveAndValidateAnswers(input.questions, input.answers);

    const categoryOrder = input.categories.map((c) => c.key);
    if (categoryOrder.length < 2) {
      throw AppError.badRequest('This test needs at least two scoring categories before it can be scored.');
    }
    const namesByKey = new Map(input.categories.map((c) => [c.key, c.name]));
    const counts: Record<string, number> = {};
    for (const key of categoryOrder) counts[key] = 0;

    for (const { question, option } of resolved) {
      const key = (option.scoringCategory ?? option.resultMapping ?? '').trim();
      if (!key || !(key in counts)) {
        throw AppError.badRequest(
          `Question ${question.order}: the selected answer is linked to category "${key || '(none)'}", which is not one of this test's categories.`
        );
      }
      const value = option.numericalValue ?? 1;
      counts[key] += value;
    }

    const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
    const percentages: Record<string, number> = {};
    for (const key of categoryOrder) {
      percentages[key] = total > 0 ? Math.round((counts[key] / total) * 1000) / 10 : 0;
    }

    // Stable rank: higher score first, then the admin-defined category order.
    const ranked = [...categoryOrder].sort(
      (a, b) => counts[b] - counts[a] || categoryOrder.indexOf(a) - categoryOrder.indexOf(b)
    );
    const topScore = counts[ranked[0]];
    const primaryKeys = ranked.filter((key) => counts[key] === topScore);

    let secondaryKeys: string[] = [];
    if (primaryKeys.length === 1) {
      const rest = ranked.filter((key) => counts[key] < topScore && counts[key] > 0);
      if (rest.length > 0) {
        const secondScore = counts[rest[0]];
        secondaryKeys = rest.filter((key) => counts[key] === secondScore);
      }
    }

    const outcome: HighestScoreOutcome =
      primaryKeys.length === 1 ? 'single' : primaryKeys.length === 2 ? 'blend' : 'mixed';

    const label = (key: string) => key;
    const joinNames = (keys: string[]) =>
      keys.length <= 2 ? keys.map(label).join(' & ') : `${keys.slice(0, -1).map(label).join(', ')} & ${label(keys[keys.length - 1])}`;

    const title =
      outcome === 'blend'
        ? `Blended Energy: ${joinNames(primaryKeys)}`
        : outcome === 'mixed'
          ? `Mixed Energy: ${joinNames(primaryKeys)}`
          : undefined;

    return {
      resultKeys: primaryKeys,
      title,
      rawScores: {
        method: 'CATEGORY_HIGHEST_SCORE',
        counts,
        total,
        percentages,
        outcome,
        primaryKeys,
        secondaryKeys,
        categoryNames: Object.fromEntries(categoryOrder.map((key) => [key, namesByKey.get(key) ?? key]))
      },
      // Percentages (0-100) so every result page renders them as bars.
      categoryScores: percentages
    };
  }
};
