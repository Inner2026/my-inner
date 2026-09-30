import { Types } from 'mongoose';
import { ITestVersion } from '../../models/TestVersion';
import { IQuestion } from '../../models/Question';
import { ResultDefinition, IResultDefinition } from '../../models/ResultDefinition';
import { scoringStrategyRegistry } from './registry';
import { SubmittedAnswer } from './types';
import { AppError } from '../../utils/AppError';

export interface AttemptResultItemPayload {
  resultKey: string;
  resultDefinitionId: Types.ObjectId;
  imageUrl: string | null;
  title: string;
  description: string;
  strengths: string | null;
  challenges: string | null;
  communication: string | null;
  relationships: string | null;
  recommendations: string | null;
}

export interface AttemptResultPayload {
  resultKey: string;
  rawScores: Record<string, unknown>;
  categoryScores: Record<string, unknown>;
  resultDefinitionId: Types.ObjectId;
  resultDefinitionIds: Types.ObjectId[];
  snapshot: {
    title: string;
    description: string;
    strengths: string | null;
    challenges: string | null;
    communication: string | null;
    relationships: string | null;
    recommendations: string | null;
    results: AttemptResultItemPayload[];
  };
  assessmentSnapshot: Record<string, unknown>;
}

function toResultItem(def: IResultDefinition): AttemptResultItemPayload {
  return {
    resultKey: def.resultKey,
    resultDefinitionId: def._id,
    imageUrl: def.imageUrl ?? null,
    title: def.title,
    description: def.description,
    strengths: def.strengths ?? null,
    challenges: def.challenges ?? null,
    communication: def.communication ?? null,
    relationships: def.relationships ?? null,
    recommendations: def.recommendations ?? null
  };
}

/**
 * Deterministic scoring pipeline: identical (testVersion, answers) always
 * produces an identical result. No randomness, no external calls, no AI.
 *
 * A strategy may return one or many resultKeys (see ScoringOutput.resultKeys).
 * Every key is matched independently against this version's ResultDefinitions
 * -- there is no combined/joined lookup key and no pre-generated cross-product
 * of definitions. The engine assembles whatever definitions matched into a
 * single, generic result payload that works for any strategy, present or
 * future, without any test-specific branching.
 */
export async function scoreAttempt(
  version: ITestVersion,
  questions: IQuestion[],
  answers: SubmittedAnswer[]
): Promise<AttemptResultPayload> {
  const strategy = scoringStrategyRegistry[version.scoringMethod];
  if (!strategy) {
    throw AppError.internal(`No scoring strategy registered for method ${version.scoringMethod}.`);
  }

  const resultDefinitions = await ResultDefinition.find({ testVersionId: version._id });
  const definitionsByKey = new Map(resultDefinitions.map((def) => [def.resultKey, def]));

  const output = strategy.calculate({
    questions,
    answers,
    scoringConfig: version.scoringConfig,
    categories: version.categories,
    resultDefinitions
  });

  if (output.resultKeys.length === 0) {
    throw AppError.internal('Scoring strategy produced no result keys.');
  }

  // Match each key independently and de-duplicate while preserving the
  // strategy's own (deterministic) order -- this is what makes multi-key
  // strategies like CATEGORY_AVERAGE_BAND work: "communication:high",
  // "trust:medium", etc. each resolve to their own seeded ResultDefinition.
  const seen = new Set<string>();
  const matchedDefs: IResultDefinition[] = [];
  const unmatchedKeys: string[] = [];

  for (const key of output.resultKeys) {
    if (seen.has(key)) continue;
    seen.add(key);
    const def = definitionsByKey.get(key);
    if (def) {
      matchedDefs.push(def);
    } else {
      unmatchedKeys.push(key);
    }
  }

  if (matchedDefs.length === 0) {
    throw AppError.internal(
      `Scoring produced result key(s) [${output.resultKeys.join(', ')}] with no matching ResultDefinition. The test version content is incomplete.`
    );
  }
  if (unmatchedKeys.length > 0) {
    throw AppError.internal(
      `Scoring produced result key(s) [${unmatchedKeys.join(', ')}] with no matching ResultDefinition. The test version content is incomplete.`
    );
  }

  // Stable, order-independent identifier for this outcome (e.g. for analytics
  // or dedup) -- sorted so the same set of matched keys always yields the
  // same combined resultKey regardless of category ordering.
  const resultKey = [...seen].sort().join('|');

  const results = matchedDefs.map(toResultItem);

  const snapshot =
    results.length === 1
      ? {
          title: results[0].title,
          description: results[0].description,
          strengths: results[0].strengths,
          challenges: results[0].challenges,
          communication: results[0].communication,
          relationships: results[0].relationships,
          recommendations: results[0].recommendations,
          results
        }
      : {
          title: 'Your Combined Result',
          description: results.map((r) => `${r.title}: ${r.description}`).join('\n\n'),
          strengths: results.map((r) => r.strengths).filter(Boolean).join('\n') || null,
          challenges: results.map((r) => r.challenges).filter(Boolean).join('\n') || null,
          communication: results.map((r) => r.communication).filter(Boolean).join('\n') || null,
          relationships: results.map((r) => r.relationships).filter(Boolean).join('\n') || null,
          recommendations: results.map((r) => r.recommendations).filter(Boolean).join('\n') || null,
          results
        };

  return {
    resultKey,
    rawScores: output.rawScores,
    categoryScores: output.categoryScores,
    resultDefinitionId: matchedDefs[0]._id,
    resultDefinitionIds: matchedDefs.map((d) => d._id),
    snapshot,
    assessmentSnapshot: {
      testVersion: typeof (version as any).toObject === 'function' ? (version as any).toObject() : version,
      questions: questions.map((question) => typeof (question as any).toObject === 'function' ? (question as any).toObject() : question),
      resultDefinitions: resultDefinitions.map((definition) => typeof (definition as any).toObject === 'function' ? (definition as any).toObject() : definition)
    }
  };
}
