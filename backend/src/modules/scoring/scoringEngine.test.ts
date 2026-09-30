import { Types } from 'mongoose';

jest.mock('../../models/ResultDefinition', () => ({
  ResultDefinition: { find: jest.fn() }
}));

import { ResultDefinition } from '../../models/ResultDefinition';
import { scoreAttempt } from './scoringEngine';

function oid() {
  return new Types.ObjectId();
}

function makeDef(overrides: Record<string, unknown>) {
  return {
    _id: oid(),
    title: 'title',
    description: 'description',
    strengths: null,
    challenges: null,
    communication: null,
    relationships: null,
    recommendations: null,
    ...overrides
  };
}

function makeQuestion(categoryKey: string, numericalValue: number) {
  return {
    _id: oid(),
    categoryKey,
    questionType: 'likert',
    order: 1,
    answerOptions: [{ _id: oid(), numericalValue, order: 1 }]
  };
}

describe('scoreAttempt -- CATEGORY_AVERAGE_BAND multi-result assembly (Relationship-style)', () => {
  it('matches every "<category>:<band>" key against its own ResultDefinition and assembles a combined, traceable result', async () => {
    const trustHigh = makeDef({ resultKey: 'trust:high', title: 'trust -- high', description: 'trust desc' });
    const conflictLow = makeDef({ resultKey: 'conflict:low', title: 'conflict -- low', description: 'conflict desc' });
    (ResultDefinition.find as jest.Mock).mockResolvedValue([trustHigh, conflictLow]);

    const qTrust = makeQuestion('trust', 5); // averages to 5 -> "high" band
    const qConflict = makeQuestion('conflict', 1); // averages to 1 -> "low" band

    const version = {
      _id: oid(),
      scoringMethod: 'CATEGORY_AVERAGE_BAND',
      scoringConfig: {},
      categories: [
        { key: 'trust', name: 'Trust' },
        { key: 'conflict', name: 'Conflict' }
      ]
    } as any;

    const questions = [qTrust, qConflict] as any;
    const answers = [qTrust, qConflict].map((q) => ({
      questionId: q._id.toString(),
      answerOptionId: q.answerOptions[0]._id.toString()
    }));

    const result = await scoreAttempt(version, questions, answers);

    // One ResultDefinition per category/band -- never a joined lookup key.
    expect(ResultDefinition.find).toHaveBeenCalledWith({ testVersionId: version._id });

    // Deterministic, stable combined identifier regardless of category order.
    expect(result.resultKey).toBe('conflict:low|trust:high');

    // Every matched definition is traceable, in deterministic (strategy) order.
    expect(result.resultDefinitionIds).toEqual([trustHigh._id, conflictLow._id]);
    expect(result.resultDefinitionId).toEqual(trustHigh._id);

    // The result page can render each category's own interpretation.
    expect(result.snapshot.results).toHaveLength(2);
    expect(result.snapshot.results.map((r) => r.resultKey)).toEqual(['trust:high', 'conflict:low']);
    expect(result.snapshot.results.map((r) => r.title)).toEqual(['trust -- high', 'conflict -- low']);

    // Top-level snapshot is a readable synthesized summary for multi-result outcomes.
    expect(result.snapshot.title).toBe('Your Combined Result');
    expect(result.snapshot.description).toContain('trust -- high');
    expect(result.snapshot.description).toContain('conflict -- low');
  });

  it('is fully deterministic: identical (version, questions, answers) always produce an identical result', async () => {
    const trustHigh = makeDef({ resultKey: 'trust:high' });
    (ResultDefinition.find as jest.Mock).mockResolvedValue([trustHigh]);

    const qTrust = makeQuestion('trust', 5);
    const version = {
      _id: oid(),
      scoringMethod: 'CATEGORY_AVERAGE_BAND',
      scoringConfig: {},
      categories: [{ key: 'trust', name: 'Trust' }]
    } as any;
    const answers = [{ questionId: qTrust._id.toString(), answerOptionId: qTrust.answerOptions[0]._id.toString() }];

    const result1 = await scoreAttempt(version, [qTrust] as any, answers);
    const result2 = await scoreAttempt(version, [qTrust] as any, answers);

    expect(result1).toEqual(result2);
  });

  it('throws a clear internal error when a produced result key has no matching ResultDefinition (incomplete content)', async () => {
    (ResultDefinition.find as jest.Mock).mockResolvedValue([]); // no definitions seeded at all

    const qTrust = makeQuestion('trust', 5);
    const version = {
      _id: oid(),
      scoringMethod: 'CATEGORY_AVERAGE_BAND',
      scoringConfig: {},
      categories: [{ key: 'trust', name: 'Trust' }]
    } as any;
    const answers = [{ questionId: qTrust._id.toString(), answerOptionId: qTrust.answerOptions[0]._id.toString() }];

    await expect(scoreAttempt(version, [qTrust] as any, answers)).rejects.toThrow(/no matching ResultDefinition/i);
  });
});

describe('scoreAttempt -- single-result strategies stay backward compatible', () => {
  it('populates snapshot.results with exactly one item mirroring the top-level snapshot fields', async () => {
    const highDef = makeDef({ resultKey: 'HIGH', title: 'High score', description: 'high desc', strengths: 'strong' });
    (ResultDefinition.find as jest.Mock).mockResolvedValue([highDef]);

    const question = makeQuestion('uncategorized', 12);
    const version = {
      _id: oid(),
      scoringMethod: 'CATEGORY_SUM_RANGE',
      scoringConfig: {},
      categories: []
    } as any;
    // Give the single ResultDefinition a score range that covers the total.
    (highDef as any).minScore = 0;
    (highDef as any).maxScore = 20;

    const answers = [{ questionId: question._id.toString(), answerOptionId: question.answerOptions[0]._id.toString() }];

    const result = await scoreAttempt(version, [question] as any, answers);

    expect(result.resultDefinitionId).toEqual(highDef._id);
    expect(result.resultDefinitionIds).toEqual([highDef._id]);
    expect(result.snapshot.results).toHaveLength(1);
    expect(result.snapshot.title).toBe('High score');
    expect(result.snapshot.strengths).toBe('strong');
    expect(result.snapshot.results[0]).toMatchObject({ resultKey: 'HIGH', title: 'High score', strengths: 'strong' });
    expect(result.assessmentSnapshot).toMatchObject({
      testVersion: expect.objectContaining({ _id: version._id }),
      questions: expect.any(Array),
      resultDefinitions: expect.any(Array)
    });
  });
});
