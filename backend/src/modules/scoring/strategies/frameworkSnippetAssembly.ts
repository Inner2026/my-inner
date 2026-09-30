import { ScoringInput, ScoringOutput, ScoringStrategy } from '../types';
import { resolveAndValidateAnswers } from '../helpers';

/**
 * Cube Personality-style scoring: purely symbolic, no numeric score. Every
 * chosen answer option is pre-mapped (resultMapping) to a fixed, pre-written
 * trait snippet key. The engine looks up one ResultDefinition per selected
 * snippet key and concatenates them into the final description -- there is
 * no dynamic generation, per the specification.
 */
export const frameworkSnippetAssemblyStrategy: ScoringStrategy = {
  calculate(input: ScoringInput): ScoringOutput {
    const resolved = resolveAndValidateAnswers(input.questions, input.answers);

    const snippetKeys: string[] = [];
    const byCategory: Record<string, string[]> = {};

    for (const { question, option } of resolved) {
      if (!option.resultMapping) continue;
      snippetKeys.push(option.resultMapping);
      const cat = question.categoryKey ?? 'uncategorized';
      byCategory[cat] = byCategory[cat] ?? [];
      byCategory[cat].push(option.resultMapping);
    }

    if (snippetKeys.length === 0) {
      throw new Error('No answer options carried a resultMapping; cannot assemble a symbolic result.');
    }

    return {
      resultKeys: snippetKeys,
      rawScores: { snippetKeys },
      categoryScores: byCategory
    };
  }
};
