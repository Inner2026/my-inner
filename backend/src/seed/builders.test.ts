import {
  buildMbtiQuestions,
  buildMbtiResultDefinitions,
  buildInnerChildQuestions,
  buildInnerChildResultDefinitions,
  buildFiveLoveQuestions,
  buildFiveLoveResultDefinitions,
  buildRelationshipQuestions,
  buildRelationshipResultDefinitions,
  buildSpiritAnimalQuestions,
  buildIqQuestions,
  buildCubeQuestions,
  buildCubeResultDefinitions
} from './builders';
import { containsPlaceholderText } from '../utils/placeholderContent';

describe('seed content fidelity to specification', () => {
  it('MBTI: exactly 60 questions from the client document', () => {
    const qs = buildMbtiQuestions();
    expect(qs).toHaveLength(60);
    for (const q of qs) {
      expect(q.answerOptions).toHaveLength(4);
      expect(['E', 'I', 'S', 'N', 'T', 'F', 'J', 'P']).toContain(q.categoryKey);
    }
    expect(buildMbtiResultDefinitions()).toHaveLength(16); // 16 MBTI-style types
  });

  it('Inner Child: exactly 30 questions with five scored answer meanings', () => {
    const qs = buildInnerChildQuestions();
    expect(qs).toHaveLength(30);
    for (const q of qs) {
      expect(q.answerOptions).toHaveLength(5);
      expect(q.answerOptions.every((o) => typeof o.numericalValue === 'number')).toBe(true);
    }
    const maxPossible = qs.length * 4;
    expect(maxPossible).toBe(120);
    expect(buildInnerChildResultDefinitions()).toHaveLength(5);
  });

  it('Five Love Languages: exactly 30 questions with dual self/partner payloads', () => {
    const qs = buildFiveLoveQuestions();
    expect(qs).toHaveLength(30);
    expect(qs.every((q) => q.answerOptions.every((o) => String(o.resultMapping).startsWith('PARTNER:')))).toBe(true);
    expect(buildFiveLoveResultDefinitions()).toHaveLength(20); // 5 * 4 ordered pairs
  });

  it('Relationship/Compatibility: exactly 30 questions across 8 categories, 24 band definitions', () => {
    const qs = buildRelationshipQuestions();
    expect(qs).toHaveLength(30);
    const categories = new Set(qs.map((q) => q.categoryKey));
    expect(categories.size).toBe(8);
    expect(buildRelationshipResultDefinitions()).toHaveLength(24); // 8 categories * 3 bands
  });

  it('Hidden Animal: seeds the 29 numbered questions in the client document', () => {
    const qs = buildSpiritAnimalQuestions();
    expect(qs).toHaveLength(29);
    for (const q of qs) {
      expect(q.answerOptions.every((o) => Boolean(o.resultMapping))).toBe(true);
    }
  });

  it('IQ/Cognitive: seeds only the 10 provided questions, each with exactly one correct answer', () => {
    const qs = buildIqQuestions();
    expect(qs).toHaveLength(10);
    for (const q of qs) {
      expect(q.answerOptions.filter((o) => o.isCorrect).length).toBe(1);
    }
  });

  it('The Cube: seeds the 15-question client specification with hidden mappings', () => {
    const qs = buildCubeQuestions();
    expect(qs).toHaveLength(15);
    expect(qs.every((q) => q.answerOptions.length === 4)).toBe(true);
    expect(qs.every((q) => q.answerOptions.every((o) => Boolean(o.resultMapping)))).toBe(true);
    expect(buildCubeResultDefinitions()).toHaveLength(12);
    expect(qs.every((q) => q.answerOptions.every((o) => o.scoringWeights))).toBe(true);
  });
});

describe('result content validation', () => {
  it('seeded result copy does not contain development placeholder markers', () => {
    const placeholderSeededDefs = [
      ...buildMbtiResultDefinitions(),
      ...buildInnerChildResultDefinitions(),
      ...buildFiveLoveResultDefinitions(),
      ...buildRelationshipResultDefinitions()
    ];

    expect(placeholderSeededDefs.length).toBeGreaterThan(0);
    for (const def of placeholderSeededDefs) {
      expect(containsPlaceholderText(def.description)).toBe(false);
    }
  });
});
