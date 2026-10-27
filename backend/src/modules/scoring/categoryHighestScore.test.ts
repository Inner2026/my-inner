import { Types } from 'mongoose';
import { scoringStrategyRegistry } from './registry';

const strategy = scoringStrategyRegistry.CATEGORY_HIGHEST_SCORE;

const CATEGORIES = [
  { key: 'Dolphin', name: 'Dolphin – Sunshine Energy' },
  { key: 'Dog', name: 'Dog – Golden Energy' },
  { key: 'Fox', name: 'Fox – Charming Energy' },
  { key: 'Peacock', name: 'Peacock – Spotlight Energy' },
  { key: 'Black Panther', name: 'Black Panther – Magnetic Energy' },
  { key: 'Lion', name: 'Lion – Power Energy' }
];
const KEYS = CATEGORIES.map((c) => c.key);

/** 8 questions, options A-F mapped to the six animals, 1 point each (the Energy test). */
function energyTest() {
  return Array.from({ length: 8 }, (_, i) => ({
    _id: new Types.ObjectId(),
    order: i + 1,
    categoryKey: null,
    questionType: 'multiple_choice',
    answerOptions: KEYS.map((key, j) => ({
      _id: new Types.ObjectId(),
      text: `Option ${j + 1}`,
      numericalValue: 1,
      scoringCategory: key,
      scoringDirection: null,
      resultMapping: key,
      order: j + 1
    }))
  }));
}

function run(picks: string[]) {
  const questions = energyTest();
  const answers = questions.map((q, i) => ({
    questionId: q._id.toString(),
    answerOptionId: q.answerOptions.find((o) => o.scoringCategory === picks[i])!._id.toString()
  }));
  return strategy.calculate({ questions: questions as any, answers, scoringConfig: {}, categories: CATEGORIES, resultDefinitions: [] });
}

describe('CATEGORY_HIGHEST_SCORE (highest category wins)', () => {
  it('scores the brief example: Fox primary, Black Panther secondary, percentages of 8', () => {
    const out = run(['Dolphin', 'Dog', 'Fox', 'Fox', 'Fox', 'Fox', 'Black Panther', 'Black Panther']);
    expect(out.resultKeys).toEqual(['Fox']);
    expect(out.rawScores.counts).toEqual({ Dolphin: 1, Dog: 1, Fox: 4, Peacock: 0, 'Black Panther': 2, Lion: 0 });
    expect(out.rawScores.secondaryKeys).toEqual(['Black Panther']);
    expect(out.rawScores.outcome).toBe('single');
    expect(out.categoryScores).toEqual({ Dolphin: 12.5, Dog: 12.5, Fox: 50, Peacock: 0, 'Black Panther': 25, Lion: 0 });
    expect(out.title).toBeUndefined();
  });

  it('always totals 8 points', () => {
    const out = run(['Lion', 'Dog', 'Fox', 'Peacock', 'Black Panther', 'Lion', 'Dolphin', 'Lion']);
    const total = Object.values(out.rawScores.counts as Record<string, number>).reduce((a, b) => a + b, 0);
    expect(total).toBe(8);
    expect(out.rawScores.total).toBe(8);
  });

  it('has no minimum: a 2-point leader still wins', () => {
    // With 8 answers a sole 2-point leader is impossible (2+1*5=7), so use 7 questions.
    const questions = energyTest().slice(0, 7);
    const picks = ['Fox', 'Fox', 'Dolphin', 'Dog', 'Peacock', 'Black Panther', 'Lion'];
    const answers = questions.map((q, i) => ({
      questionId: q._id.toString(),
      answerOptionId: q.answerOptions.find((o) => o.scoringCategory === picks[i])!._id.toString()
    }));
    const out = strategy.calculate({ questions: questions as any, answers, scoringConfig: {}, categories: CATEGORIES, resultDefinitions: [] });
    expect(out.resultKeys).toEqual(['Fox']);
    expect(out.rawScores.secondaryKeys).toEqual(['Dolphin', 'Dog', 'Peacock', 'Black Panther', 'Lion']);
  });

  it('a 2-2 tie at the top of 8 answers is a blend', () => {
    const out = run(['Dolphin', 'Dog', 'Fox', 'Peacock', 'Black Panther', 'Lion', 'Lion', 'Fox']);
    expect(out.resultKeys).toEqual(['Fox', 'Lion']);
  });

  it('rejects an answer linked to an unknown category with the question number', () => {
    const questions = energyTest();
    (questions[5].answerOptions[0] as any).scoringCategory = 'Dolphn';
    const answers = questions.map((q) => ({ questionId: q._id.toString(), answerOptionId: q.answerOptions[0]._id.toString() }));
    expect(() => strategy.calculate({ questions: questions as any, answers, scoringConfig: {}, categories: CATEGORIES, resultDefinitions: [] })).toThrow(/Question 6/);
  });

  it('returns a blended result for a two-way tie (never random)', () => {
    const out = run(['Fox', 'Fox', 'Fox', 'Lion', 'Lion', 'Lion', 'Dog', 'Dolphin']);
    expect(out.resultKeys).toEqual(['Fox', 'Lion']);
    expect(out.rawScores.outcome).toBe('blend');
    expect(out.title).toBe('Blended Energy: Fox & Lion');
    expect(out.rawScores.secondaryKeys).toEqual([]);
  });

  it('returns a mixed result listing every category in a 3+ way tie', () => {
    const out = run(['Fox', 'Fox', 'Lion', 'Lion', 'Dog', 'Dog', 'Peacock', 'Dolphin']);
    expect(out.resultKeys).toEqual(['Dog', 'Fox', 'Lion']);
    expect(out.rawScores.outcome).toBe('mixed');
    expect(out.title).toBe('Mixed Energy: Dog, Fox & Lion');
  });

  it('handles 8/8 in one category with no secondary', () => {
    const out = run(Array(8).fill('Lion'));
    expect(out.resultKeys).toEqual(['Lion']);
    expect(out.rawScores.secondaryKeys).toEqual([]);
    expect(out.categoryScores.Lion).toBe(100);
  });

  it('is deterministic for identical answers', () => {
    const picks = ['Peacock', 'Dog', 'Fox', 'Peacock', 'Black Panther', 'Lion', 'Peacock', 'Dog'];
    expect(run(picks).resultKeys).toEqual(run(picks).resultKeys);
  });
});
