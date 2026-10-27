import { Types } from 'mongoose';

jest.mock('../../models/TestVersion', () => ({ TestVersion: { findById: jest.fn() } }));
jest.mock('../../models/Question', () => ({ Question: { find: jest.fn() } }));
jest.mock('../../models/ResultDefinition', () => ({ ResultDefinition: { find: jest.fn() } }));

import { TestVersion } from '../../models/TestVersion';
import { Question } from '../../models/Question';
import { ResultDefinition } from '../../models/ResultDefinition';
import { validateTestVersionForActivation } from './validation.service';

const KEYS = ['Dolphin', 'Dog', 'Fox', 'Peacock', 'Black Panther', 'Lion'];
const categories = KEYS.map((key) => ({ key, name: key }));

function questions() {
  return Array.from({ length: 8 }, (_, i) => ({
    order: i + 1,
    categoryKey: null,
    answerOptions: KEYS.map((key, j) => ({ text: `Answer ${j}`, numericalValue: 1, scoringCategory: key, scoringDirection: null, resultMapping: key }))
  }));
}
const results = () => KEYS.map((key) => ({ resultKey: key, title: key, description: 'Your aura...', minScore: 2, maxScore: 8 }));

function setup(qs: any[], rs: any[], versionOverrides: Record<string, unknown> = {}) {
  (TestVersion.findById as jest.Mock).mockResolvedValue({ _id: new Types.ObjectId(), scoringMethod: 'CATEGORY_HIGHEST_SCORE', scoringConfig: {}, categories, expectedQuestionCount: 8, ...versionOverrides });
  (Question.find as jest.Mock).mockReturnValue({ sort: jest.fn().mockResolvedValue(qs) });
  (ResultDefinition.find as jest.Mock).mockResolvedValue(rs);
}

describe('validation -- CATEGORY_HIGHEST_SCORE', () => {
  beforeEach(() => jest.clearAllMocks());

  it('passes the Energy test without dichotomies, directions or question categories', async () => {
    setup(questions(), results());
    const report = await validateTestVersionForActivation(new Types.ObjectId());
    expect(report).toEqual({ valid: true, issues: [] });
  });

  it('names the exact question and answer missing a numerical value', async () => {
    const qs = questions();
    qs[5].answerOptions.forEach((o: any) => { o.numericalValue = null; });
    setup(qs, results());
    const report = await validateTestVersionForActivation(new Types.ObjectId());
    expect(report.valid).toBe(false);
    expect(report.issues).toHaveLength(6);
    expect(report.issues[0].message).toMatch(/^Question 6, Answer A/);
    expect(report.issues[5].message).toMatch(/^Question 6, Answer F/);
  });

  it('flags misspelled categories and missing/unlinked results', async () => {
    const qs = questions();
    qs[2].answerOptions[4].scoringCategory = 'Black panther';
    const rs = results().filter((r) => r.resultKey !== 'Lion');
    rs.push({ resultKey: 'Lion King', title: 'Lion', description: 'x', minScore: null as any, maxScore: null as any });
    setup(qs, rs);
    const messages = (await validateTestVersionForActivation(new Types.ObjectId())).issues.map((i) => i.message);
    expect(messages.some((m) => /Question 3, Answer E.*"Black panther"/.test(m))).toBe(true);
    expect(messages.some((m) => /Category "Lion" has no result/.test(m))).toBe(true);
    expect(messages.some((m) => /"Lion King", which does not match/.test(m))).toBe(true);
  });

  it('requires categories to be registered', async () => {
    setup(questions(), results(), { categories: [] });
    const report = await validateTestVersionForActivation(new Types.ObjectId());
    expect(report.issues.some((i) => i.field === 'categories')).toBe(true);
  });
});
