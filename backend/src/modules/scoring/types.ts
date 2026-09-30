import { IQuestion } from '../../models/Question';
import { IResultDefinition } from '../../models/ResultDefinition';
import { ICategory, ScoringMethod } from '../../models/TestVersion';

export interface SubmittedAnswer {
  questionId: string;
  answerOptionId: string;
}

export interface ScoringInput {
  questions: IQuestion[];
  answers: SubmittedAnswer[];
  scoringConfig: Record<string, unknown>;
  categories: ICategory[];
  /**
   * All ResultDefinitions belonging to this test version, fetched once by the
   * scoring engine. Passed in (rather than queried by each strategy) so every
   * strategy remains a pure, synchronous, easily unit-testable function.
   */
  resultDefinitions: IResultDefinition[];
}

export interface ScoringOutput {
  /** One or more ResultDefinition.resultKey values this outcome matches. */
  resultKeys: string[];
  rawScores: Record<string, unknown>;
  categoryScores: Record<string, unknown>;
}

export interface ScoringStrategy {
  calculate(input: ScoringInput): ScoringOutput;
}

export type { ScoringMethod };
