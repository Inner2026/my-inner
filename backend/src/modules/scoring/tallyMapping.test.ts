import { Types } from 'mongoose';
import { tallyMappingStrategy, requiredTallyResultKeys } from './strategies/tallyMapping';
import { buildSpiritAnimalQuestions, buildSpiritAnimalResultDefinitions } from '../../seed/builders';

const animals = ['lion', 'owl', 'dolphin', 'wolf'];
function questions(count = 8) {
  return Array.from({ length: count }, (_, i) => ({
    _id: new Types.ObjectId(), order: i + 1, categoryKey: null,
    answerOptions: animals.map((animal, j) => ({ _id: new Types.ObjectId(), text: animal, order: j + 1, resultMapping: animal }))
  }));
}
function answers(qs: ReturnType<typeof questions>, picks: string[]) {
  return picks.map((animal, i) => ({ questionId: String(qs[i]._id), answerOptionId: String(qs[i].answerOptions[animals.indexOf(animal)]._id) }));
}
const calc = (qs: any, picks: string[], scoringConfig: Record<string, unknown>) =>
  tallyMappingStrategy.calculate({ questions: qs, answers: answers(qs, picks), scoringConfig, categories: [], resultDefinitions: [] } as any);

describe('TALLY_MAPPING single result mode', () => {
  it('returns only the most chosen outcome', () => {
    const qs = questions();
    expect(calc(qs, ['lion', 'lion', 'lion', 'owl', 'owl', 'lion', 'dolphin', 'lion'], { resultMode: 'single' }).resultKeys).toEqual(['lion']);
  });

  it('uses the final answer to break a tie', () => {
    const qs = questions();
    expect(calc(qs, ['lion', 'owl', 'lion', 'owl', 'lion', 'owl', 'dolphin', 'owl'], { resultMode: 'single' }).resultKeys).toEqual(['owl']);
  });

  it('keeps the pair format by default (Hidden Animal behaviour unchanged)', () => {
    const qs = questions();
    expect(calc(qs, ['lion', 'lion', 'lion', 'owl', 'owl', 'lion', 'dolphin', 'lion'], {}).resultKeys).toEqual(['lion+owl']);
  });
});

describe('requiredTallyResultKeys', () => {
  it('needs one result per outcome in single mode', () => {
    expect(requiredTallyResultKeys(questions(), { resultMode: 'single' }).sort()).toEqual([...animals].sort());
  });

  it('needs every ordered pair, plus "x+x" when one outcome can win alone, in pair mode', () => {
    const keys = requiredTallyResultKeys(questions(), {});
    expect(keys).toHaveLength(4 * 3 + 4);
    expect(keys).toEqual(expect.arrayContaining(['lion+owl', 'owl+lion', 'lion+lion']));
  });

  it('is fully covered by the seeded Hidden Animal results, so its validation still passes', () => {
    const required = requiredTallyResultKeys(buildSpiritAnimalQuestions() as any, {});
    const defined = new Set(buildSpiritAnimalResultDefinitions().map((definition) => definition.resultKey));
    expect(required.filter((key) => !defined.has(key))).toEqual([]);
  });
});
