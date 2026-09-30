import { Types } from 'mongoose';

jest.mock('../../models/TestVersion', () => ({
  TestVersion: { findById: jest.fn() }
}));
jest.mock('../../models/Question', () => ({
  Question: { find: jest.fn() }
}));
jest.mock('../../models/ResultDefinition', () => ({
  ResultDefinition: { find: jest.fn() }
}));

import { TestVersion } from '../../models/TestVersion';
import { Question } from '../../models/Question';
import { ResultDefinition } from '../../models/ResultDefinition';
import { validateTestVersionForActivation } from './validation.service';

function oid() {
  return new Types.ObjectId();
}

function baseVersion(overrides: Record<string, unknown> = {}) {
  return {
    _id: oid(),
    scoringMethod: 'CATEGORY_SUM_RANGE',
    scoringConfig: { someConfig: true },
    categories: [],
    expectedQuestionCount: 1,
    ...overrides
  };
}

function baseQuestion() {
  return {
    order: 1,
    answerOptions: [
      { numericalValue: 1 },
      { numericalValue: 2 }
    ]
  };
}

function mockFindReturning(model: { find: jest.Mock }, docs: unknown[]) {
  model.find.mockReturnValue({ sort: jest.fn().mockResolvedValue(docs) });
}

describe('validateTestVersionForActivation -- placeholder content gate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fails activation when a ResultDefinition contains placeholder text, generically -- no test-id check involved', async () => {
    const version = baseVersion();
    (TestVersion.findById as jest.Mock).mockResolvedValue(version);
    mockFindReturning(Question as any, [baseQuestion()]);
    (ResultDefinition.find as jest.Mock).mockResolvedValue([
      {
        resultKey: 'HIGH',
        minScore: 0,
        maxScore: 10,
        title: 'High',
        description: '[PLACEHOLDER TEXT -- not provided by the specification. Replace before publishing.]'
      }
    ]);

    const report = await validateTestVersionForActivation(version._id);

    expect(report.valid).toBe(false);
    expect(report.issues.some((i) => i.field === 'resultDefinitions' && /placeholder/i.test(i.message))).toBe(true);
  });

  it('passes activation once the placeholder text is replaced with real copy (same generic check)', async () => {
    const version = baseVersion();
    (TestVersion.findById as jest.Mock).mockResolvedValue(version);
    mockFindReturning(Question as any, [baseQuestion()]);
    (ResultDefinition.find as jest.Mock).mockResolvedValue([
      {
        resultKey: 'HIGH',
        minScore: 0,
        maxScore: 10,
        title: 'High',
        description: 'A real, approved description of this outcome.'
      }
    ]);

    const report = await validateTestVersionForActivation(version._id);

    expect(report.valid).toBe(true);
  });

  it('flags placeholder markers (TODO/TBD/lorem ipsum) in any result text field, not just description', async () => {
    const version = baseVersion();
    (TestVersion.findById as jest.Mock).mockResolvedValue(version);
    mockFindReturning(Question as any, [baseQuestion()]);
    (ResultDefinition.find as jest.Mock).mockResolvedValue([
      {
        resultKey: 'HIGH',
        minScore: 0,
        maxScore: 10,
        title: 'High',
        description: 'Fine.',
        strengths: 'TODO: write real strengths copy'
      }
    ]);

    const report = await validateTestVersionForActivation(version._id);

    expect(report.valid).toBe(false);
    expect(report.issues.some((i) => i.field === 'resultDefinitions')).toBe(true);
  });
});

describe('validateTestVersionForActivation -- scoringConfig requirements are per-strategy, not a blanket "must be non-empty"', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('an empty scoringConfig does NOT block activation for a strategy that has its own built-in defaults (e.g. CATEGORY_SUM_RANGE)', async () => {
    // Regression test: an earlier version of this check failed activation
    // whenever scoringConfig was `{}`, regardless of scoringMethod -- which
    // would have permanently blocked every strategy except WEIGHTED_DICHOTOMY
    // from ever publishing, even with fully complete content.
    const version = baseVersion({ scoringConfig: {} });
    (TestVersion.findById as jest.Mock).mockResolvedValue(version);
    mockFindReturning(Question as any, [baseQuestion()]);
    (ResultDefinition.find as jest.Mock).mockResolvedValue([
      { resultKey: 'HIGH', minScore: 0, maxScore: 10, title: 'High', description: 'A real, approved description.' }
    ]);

    const report = await validateTestVersionForActivation(version._id);

    expect(report.valid).toBe(true);
  });

  it('WEIGHTED_DICHOTOMY fails activation when scoringConfig.dichotomies is missing/empty', async () => {
    const version = baseVersion({
      scoringMethod: 'WEIGHTED_DICHOTOMY',
      scoringConfig: {},
      categories: [{ key: 'E', name: 'E' }, { key: 'I', name: 'I' }]
    });
    (TestVersion.findById as jest.Mock).mockResolvedValue(version);
    mockFindReturning(Question as any, [
      { order: 1, answerOptions: [{ numericalValue: 1, scoringCategory: 'E', scoringDirection: 'positive' }, { numericalValue: 2, scoringCategory: 'I', scoringDirection: 'positive' }] }
    ]);
    (ResultDefinition.find as jest.Mock).mockResolvedValue([
      { resultKey: 'E', minScore: 0, maxScore: 10, title: 'E type', description: 'Real copy.' }
    ]);

    const report = await validateTestVersionForActivation(version._id);

    expect(report.valid).toBe(false);
    expect(report.issues.some((i) => i.field === 'scoringConfig' && /dichotomies/i.test(i.message))).toBe(true);
  });

  it('WEIGHTED_DICHOTOMY passes activation once scoringConfig.dichotomies is provided', async () => {
    const version = baseVersion({
      scoringMethod: 'WEIGHTED_DICHOTOMY',
      scoringConfig: { dichotomies: [['E', 'I']] },
      categories: [{ key: 'E', name: 'E' }, { key: 'I', name: 'I' }]
    });
    (TestVersion.findById as jest.Mock).mockResolvedValue(version);
    mockFindReturning(Question as any, [
      { order: 1, answerOptions: [{ numericalValue: 1, scoringCategory: 'E', scoringDirection: 'positive' }, { numericalValue: 2, scoringCategory: 'I', scoringDirection: 'positive' }] }
    ]);
    (ResultDefinition.find as jest.Mock).mockResolvedValue([
      { resultKey: 'E', minScore: 0, maxScore: 10, title: 'E type', description: 'Real copy.' }
    ]);

    const report = await validateTestVersionForActivation(version._id);

    expect(report.valid).toBe(true);
  });
});

describe('validateTestVersionForActivation -- incomplete client result specifications', () => {
  beforeEach(() => jest.clearAllMocks());

  it('blocks Inner Child publication without inventing deterministic bands or analysis', async () => {
    const version = baseVersion({ scoringConfig: { pendingContentConfirmation: true } });
    (TestVersion.findById as jest.Mock).mockResolvedValue(version);
    mockFindReturning(Question as any, [baseQuestion()]);
    (ResultDefinition.find as jest.Mock).mockResolvedValue([{ resultKey: 'x', minScore: 0, maxScore: 10, title: 'x', description: 'approved' }]);
    const report = await validateTestVersionForActivation(version._id);
    expect(report.valid).toBe(false);
    expect(report.issues.some((issue) => /Inner Child result bands/i.test(issue.message))).toBe(true);
  });

  it('blocks Hidden Animal publication while question 30 is missing', async () => {
    const version = baseVersion({ scoringMethod: 'TALLY_MAPPING', scoringConfig: { pendingContentConfirmation: true } });
    (TestVersion.findById as jest.Mock).mockResolvedValue(version);
    mockFindReturning(Question as any, [{ order: 1, answerOptions: [{ resultMapping: 'Wolf' }, { resultMapping: 'Fox' }] }]);
    (ResultDefinition.find as jest.Mock).mockResolvedValue([{ resultKey: 'Wolf+Fox', title: 'x', description: 'approved' }]);
    const report = await validateTestVersionForActivation(version._id);
    expect(report.valid).toBe(false);
    expect(report.issues.some((issue) => /Question 30/i.test(issue.message))).toBe(true);
  });
});
