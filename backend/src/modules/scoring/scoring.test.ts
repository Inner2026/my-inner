import { Types } from 'mongoose';
import { scoringStrategyRegistry } from './registry';
import { ScoringInput } from './types';

function oid() {
  return new Types.ObjectId();
}

function makeQuestion(overrides: any) {
  return {
    _id: oid(),
    categoryKey: null,
    questionType: 'likert',
    order: 1,
    answerOptions: [],
    ...overrides
  };
}

describe('WEIGHTED_DICHOTOMY (MBTI-style)', () => {
  it('leans toward the pole with the higher average agreement, and is deterministic', () => {
    const qE = makeQuestion({
      categoryKey: 'E',
      answerOptions: [{ _id: oid(), numericalValue: 2, scoringCategory: 'E', scoringDirection: 'positive', order: 1 }]
    });
    const qI = makeQuestion({
      categoryKey: 'I',
      answerOptions: [{ _id: oid(), numericalValue: -1, scoringCategory: 'I', scoringDirection: 'positive', order: 1 }]
    });

    const input: ScoringInput = {
      questions: [qE, qI] as any,
      answers: [
        { questionId: qE._id.toString(), answerOptionId: qE.answerOptions[0]._id.toString() },
        { questionId: qI._id.toString(), answerOptionId: qI.answerOptions[0]._id.toString() }
      ],
      scoringConfig: { dichotomies: [['E', 'I']] },
      categories: [],
      resultDefinitions: []
    };

    const result1 = scoringStrategyRegistry.WEIGHTED_DICHOTOMY.calculate(input);
    const result2 = scoringStrategyRegistry.WEIGHTED_DICHOTOMY.calculate(input);

    expect(result1).toEqual(result2); // determinism
    expect(result1.resultKeys[0]).toBe('E'); // E scored +2 (agree), I scored -1 (disagree with I) -> E wins
    expect(result1.categoryScores.E).toBeGreaterThan(result1.categoryScores.I as number);
  });

  it('throws if an answer references a question that does not belong to the version', () => {
    const q = makeQuestion({ answerOptions: [{ _id: oid(), numericalValue: 1, scoringCategory: 'E', order: 1 }] });
    const input: ScoringInput = {
      questions: [q] as any,
      answers: [{ questionId: oid().toString(), answerOptionId: oid().toString() }],
      scoringConfig: { dichotomies: [['E', 'I']] },
      categories: [],
      resultDefinitions: []
    };
    expect(() => scoringStrategyRegistry.WEIGHTED_DICHOTOMY.calculate(input)).toThrow();
  });
});

describe('CATEGORY_SUM_RANGE (Inner Child-style)', () => {
  it('matches the total score to the correct predefined range', () => {
    const questions = Array.from({ length: 3 }, (_, i) =>
      makeQuestion({
        categoryKey: 'Trust',
        answerOptions: [{ _id: oid(), numericalValue: 4, scoringDirection: 'positive', order: 1 }]
      })
    );
    const input: ScoringInput = {
      questions: questions as any,
      answers: questions.map((q: any) => ({ questionId: q._id.toString(), answerOptionId: q.answerOptions[0]._id.toString() })),
      scoringConfig: {},
      categories: [],
      resultDefinitions: [
        { resultKey: 'LOW', minScore: 0, maxScore: 5 },
        { resultKey: 'HIGH', minScore: 6, maxScore: 12 }
      ] as any
    };
    // total = 4+4+4 = 12
    const result = scoringStrategyRegistry.CATEGORY_SUM_RANGE.calculate(input);
    expect(result.resultKeys).toEqual(['HIGH']);
    expect(result.rawScores.total).toBe(12);
  });
});

describe('CATEGORY_SUM_RANKING (Five Love Languages-style)', () => {
  it('ranks categories and returns primary+secondary', () => {
    const qWords = makeQuestion({ categoryKey: 'Words', answerOptions: [{ _id: oid(), numericalValue: 5, order: 1 }] });
    const qActs = makeQuestion({ categoryKey: 'Acts', answerOptions: [{ _id: oid(), numericalValue: 3, order: 1 }] });
    const qGifts = makeQuestion({ categoryKey: 'Gifts', answerOptions: [{ _id: oid(), numericalValue: 1, order: 1 }] });

    const input: ScoringInput = {
      questions: [qWords, qActs, qGifts] as any,
      answers: [qWords, qActs, qGifts].map((q: any) => ({
        questionId: q._id.toString(),
        answerOptionId: q.answerOptions[0]._id.toString()
      })),
      scoringConfig: {},
      categories: [{ key: 'Words', name: 'Words' }, { key: 'Acts', name: 'Acts' }, { key: 'Gifts', name: 'Gifts' }],
      resultDefinitions: []
    };

    const result = scoringStrategyRegistry.CATEGORY_SUM_RANKING.calculate(input);
    expect(result.resultKeys).toEqual(['Words+Acts']);
  });

  it('keeps the client-defined partner totals separate from self totals', () => {
    const q = makeQuestion({
      categoryKey: 'WA',
      answerOptions: [{ _id: oid(), numericalValue: 2, resultMapping: 'PARTNER:QT:3', order: 1 }]
    });
    const result = scoringStrategyRegistry.CATEGORY_SUM_RANKING.calculate({
      questions: [q] as any,
      answers: [{ questionId: q._id.toString(), answerOptionId: q.answerOptions[0]._id.toString() }],
      scoringConfig: {}, categories: [{ key: 'WA', name: 'Words' }, { key: 'QT', name: 'Time' }], resultDefinitions: []
    });
    expect(result.rawScores.partnerCategorySums).toEqual({ QT: 3 });
  });

  it('does not invent a Love Languages tie-break rule', () => {
    const questions = ['A', 'B'].map((category) => makeQuestion({ categoryKey: category, answerOptions: [{ _id: oid(), numericalValue: 1, order: 1 }] }));
    expect(() => scoringStrategyRegistry.CATEGORY_SUM_RANKING.calculate({
      questions: questions as any,
      answers: questions.map((q: any) => ({ questionId: q._id.toString(), answerOptionId: q.answerOptions[0]._id.toString() })),
      scoringConfig: {}, categories: [], resultDefinitions: []
    })).toThrow('MISSING FROM CLIENT SPECIFICATION');
  });
});

describe('CORRECT_ANSWER_PERCENTAGE (IQ-style)', () => {
  it('computes percentage correct and matches the score band', () => {
    const correctOpt = { _id: oid(), isCorrect: true, order: 1 };
    const wrongOpt = { _id: oid(), isCorrect: false, order: 2 };
    const q1 = makeQuestion({ questionType: 'multiple_choice', answerOptions: [correctOpt, wrongOpt] });
    const q2 = makeQuestion({ questionType: 'multiple_choice', answerOptions: [{ ...correctOpt, _id: oid() }, { ...wrongOpt, _id: oid() }] });

    const input: ScoringInput = {
      questions: [q1, q2] as any,
      answers: [
        { questionId: q1._id.toString(), answerOptionId: q1.answerOptions[0]._id.toString() }, // correct
        { questionId: q2._id.toString(), answerOptionId: q2.answerOptions[1]._id.toString() } // wrong
      ],
      scoringConfig: {},
      categories: [],
      resultDefinitions: [{ resultKey: 'MID', minScore: 40, maxScore: 60 }] as any
    };

    const result = scoringStrategyRegistry.CORRECT_ANSWER_PERCENTAGE.calculate(input);
    expect(result.rawScores.percentage).toBe(50);
    expect(result.resultKeys).toEqual(['MID']);
  });
});

describe('TALLY_MAPPING (Spirit Animal-style)', () => {
  it('tallies mapped outcomes and returns primary+secondary', () => {
    const q1 = makeQuestion({ answerOptions: [{ _id: oid(), resultMapping: 'Fox', order: 1 }] });
    const q2 = makeQuestion({ answerOptions: [{ _id: oid(), resultMapping: 'Fox', order: 1 }] });
    const q3 = makeQuestion({ answerOptions: [{ _id: oid(), resultMapping: 'Owl', order: 1 }] });

    const input: ScoringInput = {
      questions: [q1, q2, q3] as any,
      answers: [q1, q2, q3].map((q: any) => ({ questionId: q._id.toString(), answerOptionId: q.answerOptions[0]._id.toString() })),
      scoringConfig: {},
      categories: [],
      resultDefinitions: []
    };

    const result = scoringStrategyRegistry.TALLY_MAPPING.calculate(input);
    expect(result.resultKeys).toEqual(['Fox+Owl']);
  });
});

describe('CATEGORY_AVERAGE_BAND (Relationship-style)', () => {
  it('bands each category average independently', () => {
    const qTrustHigh = makeQuestion({ categoryKey: 'Trust', answerOptions: [{ _id: oid(), numericalValue: 5, order: 1 }] });
    const qConflictLow = makeQuestion({ categoryKey: 'Conflict', answerOptions: [{ _id: oid(), numericalValue: 1, order: 1 }] });

    const input: ScoringInput = {
      questions: [qTrustHigh, qConflictLow] as any,
      answers: [qTrustHigh, qConflictLow].map((q: any) => ({
        questionId: q._id.toString(),
        answerOptionId: q.answerOptions[0]._id.toString()
      })),
      scoringConfig: {},
      categories: [{ key: 'Trust', name: 'Trust' }, { key: 'Conflict', name: 'Conflict' }],
      resultDefinitions: []
    };

    const result = scoringStrategyRegistry.CATEGORY_AVERAGE_BAND.calculate(input);
    expect(result.resultKeys).toContain('Trust:high');
    expect(result.resultKeys).toContain('Conflict:low');
  });
});

describe('FRAMEWORK_SNIPPET_ASSEMBLY (Cube-style)', () => {
  it('assembles all selected snippet keys without any numeric score', () => {
    const q1 = makeQuestion({ categoryKey: 'cube', answerOptions: [{ _id: oid(), resultMapping: 'cube_large', order: 1 }] });
    const q2 = makeQuestion({ categoryKey: 'storm', answerOptions: [{ _id: oid(), resultMapping: 'storm_severe', order: 1 }] });

    const input: ScoringInput = {
      questions: [q1, q2] as any,
      answers: [q1, q2].map((q: any) => ({ questionId: q._id.toString(), answerOptionId: q.answerOptions[0]._id.toString() })),
      scoringConfig: {},
      categories: [],
      resultDefinitions: []
    };

    const result = scoringStrategyRegistry.FRAMEWORK_SNIPPET_ASSEMBLY.calculate(input);
    expect(result.resultKeys.sort()).toEqual(['cube_large', 'storm_severe']);
  });
});

describe('TRAIT_BAND_ASSEMBLY (Cube client scoring)', () => {
  it('calculates supplied trait weights and maps inclusive bands', () => {
    const q = makeQuestion({ answerOptions: [{ _id: oid(), scoringWeights: { Self: 2 }, order: 1 }] });
    const result = scoringStrategyRegistry.TRAIT_BAND_ASSEMBLY.calculate({
      questions: [q] as any,
      answers: [{ questionId: q._id.toString(), answerOptionId: q.answerOptions[0]._id.toString() }],
      scoringConfig: { bands: { Self: [{ key: 'balanced', min: -1, max: 2 }] } },
      categories: [{ key: 'Self', name: 'Self' }], resultDefinitions: []
    });
    expect(result.rawScores.totals).toEqual({ Self: 2 });
    expect(result.resultKeys).toEqual(['Self:balanced']);
  });
});
