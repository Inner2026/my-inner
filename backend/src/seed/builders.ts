import mbtiData from './data/mbti.json';
import fiveLoveData from './data/fiveLoveLanguages.json';
import innerChildData from './data/innerChild.json';
import relationshipData from './data/relationship.json';
import spiritAnimalData from './data/spiritAnimal.json';
import iqData from './data/iq.json';

export interface QuestionPayload {
  categoryKey: string | null;
  questionText: string;
  questionType: 'likert' | 'multiple_choice';
  order: number;
  answerOptions: Array<{
    text: string;
    numericalValue?: number | null;
    isCorrect?: boolean | null;
    scoringCategory?: string | null;
    scoringDirection?: 'positive' | 'negative' | null;
    resultMapping?: string | null;
    scoringWeights?: Record<string, number> | null;
    order: number;
  }>;
}

export interface ResultDefinitionPayload {
  resultKey: string;
  imageUrl?: string;
  minScore?: number | null;
  maxScore?: number | null;
  title: string;
  description: string;
  strengths?: string | null;
  challenges?: string | null;
  communication?: string | null;
  relationships?: string | null;
  recommendations?: string | null;
}

const LOVE_LANGUAGE_NAMES: Record<string, string> = {
  WA: 'Words of Affirmation', QT: 'Quality Time', AS: 'Acts of Service', TG: 'Gifts', PT: 'Physical Touch'
};
const TEMPORARY_RESULT_NOTICE =
  'This is a temporary self-reflection description while the final content is being reviewed. ' +
  'It is not a clinical diagnosis or a prediction of future outcomes.';

// ---------------------------------------------------------------------------
// 1. MBTI-style (WEIGHTED_DICHOTOMY) -- 60 questions from the approved assessment.
// ---------------------------------------------------------------------------

export function buildMbtiQuestions(): QuestionPayload[] {
  return (mbtiData as Array<{ n: number; text: string; tag: string; options: Array<{ letter: string; text: string }> }>).map((q) => ({
    categoryKey: q.tag,
    questionText: q.text,
    questionType: 'multiple_choice',
    order: q.n,
    answerOptions: q.options.map((opt, idx) => ({
      text: opt.text,
      numericalValue: 1,
      scoringCategory: idx % 2 === 0 ? q.tag : ({ E: 'I', S: 'N', T: 'F', J: 'P' } as Record<string, string>)[q.tag],
      scoringDirection: 'positive',
      order: idx + 1
    }))
  }));
}

const MBTI_TYPES = [
  'ISTJ', 'ISFJ', 'INFJ', 'INTJ',
  'ISTP', 'ISFP', 'INFP', 'INTP',
  'ESTP', 'ESFP', 'ENFP', 'ENTP',
  'ESTJ', 'ESFJ', 'ENFJ', 'ENTJ'
];

const MBTI_RESULT_COPY: Record<string, { name: string; description: string }> = {
  ISTJ: { name: 'The Inspector', description: 'Practical, dependable, systematic, and attentive to responsibilities. Often values accuracy, consistency, and proven methods.' },
  ISFJ: { name: 'The Defender', description: 'Steady, considerate, observant, and responsible. Often attentive to practical needs and the impact of actions on people.' },
  INFJ: { name: 'The Advocate', description: 'Reflective, future-oriented, values-driven, and focused on meaning and human development.' },
  INTJ: { name: 'The Architect', description: 'Strategic, independent, analytical, and future-focused. Often interested in systems, long-range goals, and improving how things work.' },
  ISTP: { name: 'The Troubleshooter', description: 'Analytical, adaptable, hands-on, and independent. Often prefers understanding how things work and responding directly to circumstances.' },
  ISFP: { name: 'The Adventurer', description: 'Observant, flexible, personal, and quietly values-driven. Often responsive to immediate experience and individual authenticity.' },
  INFP: { name: 'The Mediator', description: 'Reflective, imaginative, values-centered, and open to possibilities. Often seeks authenticity and alignment with deeply held principles.' },
  INTP: { name: 'The Analyst', description: 'Analytical, curious, independent, and concept-oriented. Often explores systems, explanations, and logical possibilities.' },
  ESTP: { name: 'The Dynamo', description: 'Practical, responsive, energetic, and action-oriented. Often learns through direct experience and adapts quickly to changing conditions.' },
  ESFP: { name: 'The Entertainer', description: 'Engaging, observant, flexible, and responsive to people and present experience. Often brings energy and immediacy to situations.' },
  ENFP: { name: 'The Inspirer', description: 'Possibility-oriented, curious, energetic, and values-driven. Often explores connections, meanings, and new directions.' },
  ENTP: { name: 'The Debater', description: 'Inventive, analytical, exploratory, and verbally agile. Often enjoys questioning assumptions and developing alternative possibilities.' },
  ESTJ: { name: 'The Organizer', description: 'Organized, direct, practical, and goal-oriented. Often focuses on clear standards, execution, and dependable results.' },
  ESFJ: { name: 'The Supporter', description: 'People-aware, organized, practical, and supportive. Often attentive to shared expectations and the wellbeing of a group.' },
  ENFJ: { name: 'The Mentor', description: 'People-focused, organized, future-oriented, and values-driven. Often interested in developing people and creating shared direction.' },
  ENTJ: { name: 'The Strategist', description: 'Strategic, decisive, analytical, and goal-oriented. Often focuses on systems, resources, and turning long-range aims into action.' }
};

export function buildMbtiResultDefinitions(): ResultDefinitionPayload[] {
  return MBTI_TYPES.map((type) => ({
    resultKey: type,
    ...(type === 'ENFP' ? { imageUrl: '/test-results/enfp.png' } : type === 'INTJ' ? { imageUrl: '/test-results/intj.png' } : type === 'ISTP' ? { imageUrl: '/test-results/istp.png' } : type === 'ISFP' ? { imageUrl: '/test-results/isfp.png' } : type === 'ESTP' ? { imageUrl: '/test-results/estp.png' } : type === 'ESFP' ? { imageUrl: '/test-results/esfp.png' } : type === 'ISTJ' ? { imageUrl: '/test-results/istj.png' } : type === 'ISFJ' ? { imageUrl: '/test-results/isfj.png' } : type === 'ESTJ' ? { imageUrl: '/test-results/estj.png' } : type === 'ESFJ' ? { imageUrl: '/test-results/esfj.png' } : type === 'INTP' ? { imageUrl: '/test-results/intp.png' } : type === 'ENTJ' ? { imageUrl: '/test-results/entj.png' } : type === 'ENTP' ? { imageUrl: '/test-results/entp.png' } : type === 'INFP' ? { imageUrl: '/test-results/infp.png' } : type === 'INFJ' ? { imageUrl: '/test-results/infj.png' } : {}),
    title: `${type} — ${MBTI_RESULT_COPY[type].name}`,
    description: MBTI_RESULT_COPY[type].description,
    strengths: `Your ${type} profile may naturally support the qualities described above, especially when you have room to work in your own way.`,
    challenges: `You may find growth in noticing when your preferred approach is no longer the only useful approach.`,
    communication: `Share the patterns, ideas, and practical needs that matter to you, while making space for how others communicate differently.`,
    relationships: `Use this profile as a conversation starter about what helps you feel understood, supported, and respected.`,
    recommendations: `Keep what feels useful, compare it with your lived experience, and treat the result as a flexible reflection rather than a fixed label.`
  }));
}

export const MBTI_SCORING_CONFIG = {
  preferenceCountMode: true,
  dichotomies: [
    ['E', 'I'],
    ['S', 'N'],
    ['T', 'F'],
    ['J', 'P']
  ]
};

export const MBTI_CATEGORIES = [
  { key: 'E', name: 'Extraversion' },
  { key: 'I', name: 'Introversion' },
  { key: 'S', name: 'Sensing' },
  { key: 'N', name: 'Intuition' },
  { key: 'T', name: 'Thinking' },
  { key: 'F', name: 'Feeling' },
  { key: 'J', name: 'Judging' },
  { key: 'P', name: 'Perceiving' }
];

// ---------------------------------------------------------------------------
// 2. Inner Child (CATEGORY_SUM_RANGE) -- 30 questions, verbatim from spec.
//
// NOTE / FLAGGED GAP: the specification lists 7 categories and a "Questions"
// list, but never states which of the 30 questions belongs to which category.
// Category-level breakdown therefore cannot be computed correctly without
// guessing a mapping the spec does not provide. Questions are seeded with
// categoryKey: null; the scoring itself (total -> range) is unaffected and
// fully spec-compliant, since ranges are defined against the total score only.
// ---------------------------------------------------------------------------

const INNER_CHILD_LIKERT_OPTIONS: Array<{ text: string; value: number }> = [
  { text: 'Never', value: 0 },
  { text: 'Rarely', value: 1 },
  { text: 'Sometimes', value: 2 },
  { text: 'Often', value: 3 },
  { text: 'Almost Always', value: 4 }
];

export function buildInnerChildQuestions(): QuestionPayload[] {
  return (innerChildData as Array<{ n: number; text: string; options: Array<{ text: string; category: string; score: number; meaning: string }> }>).map((q) => ({
    categoryKey: null,
    questionText: q.text,
    questionType: 'multiple_choice',
    order: q.n,
    answerOptions: q.options.map((opt, idx) => ({
      text: opt.text,
      numericalValue: opt.score,
      scoringCategory: opt.category,
      scoringDirection: opt.score < 0 ? 'negative' : 'positive',
      resultMapping: opt.meaning,
      order: idx + 1
    }))
  }));
}

const INNER_CHILD_RANGES: Array<{ key: string; min: number; max: number }> = [
  { key: 'SECURE_EMOTIONAL_FOUNDATION', min: 0, max: 24 },
  { key: 'MILD_EMOTIONAL_SENSITIVITY', min: 25, max: 48 },
  { key: 'UNRESOLVED_EMOTIONAL_PATTERNS', min: 49, max: 72 },
  { key: 'STRONG_EMOTIONAL_SENSITIVITY', min: 73, max: 96 },
  { key: 'DEEP_EMOTIONAL_SENSITIVITY', min: 97, max: 120 }
];

const INNER_CHILD_TITLES: Record<string, string> = {
  SECURE_EMOTIONAL_FOUNDATION: 'Secure Emotional Foundation',
  MILD_EMOTIONAL_SENSITIVITY: 'Mild Emotional Sensitivity',
  UNRESOLVED_EMOTIONAL_PATTERNS: 'Unresolved Emotional Patterns',
  STRONG_EMOTIONAL_SENSITIVITY: 'Strong Emotional Sensitivity',
  DEEP_EMOTIONAL_SENSITIVITY: 'Deep Emotional Sensitivity'
};

export function buildInnerChildResultDefinitions(): ResultDefinitionPayload[] {
  return INNER_CHILD_RANGES.map((r) => ({
    resultKey: r.key,
    minScore: r.min,
    maxScore: r.max,
    title: INNER_CHILD_TITLES[r.key],
    description: `This self-reflection result (score range ${r.min}-${r.max}) is not a clinical diagnosis. ${TEMPORARY_RESULT_NOTICE}`
  }));
}

// ---------------------------------------------------------------------------
// 3. Five Love Languages (CATEGORY_SUM_RANKING) -- 25 questions, verbatim.
// ---------------------------------------------------------------------------

const FIVE_LOVE_LIKERT_OPTIONS: Array<{ text: string; value: number }> = [
  { text: 'Not important to me', value: 1 },
  { text: 'Slightly important', value: 2 },
  { text: 'Moderately important', value: 3 },
  { text: 'Very important', value: 4 },
  { text: 'Extremely important', value: 5 }
];

export function buildFiveLoveQuestions(): QuestionPayload[] {
  return (fiveLoveData as Array<{ n: number; text: string; options: Array<{ text: string; selfCategory: string; selfScore: number; partnerCategory: string; partnerScore: number }> }>).map((q) => ({
    categoryKey: q.options[0]?.selfCategory ?? null,
    questionText: q.text,
    questionType: 'multiple_choice',
    order: q.n,
    answerOptions: q.options.map((opt, idx) => ({
      text: opt.text,
      numericalValue: opt.selfScore,
      scoringCategory: opt.selfCategory,
      scoringDirection: opt.selfScore < 0 ? 'negative' : 'positive',
      resultMapping: `PARTNER:${opt.partnerCategory}:${opt.partnerScore}`,
      order: idx + 1
    }))
  }));
}

const FIVE_LOVE_CATEGORIES = ['WA', 'QT', 'AS', 'TG', 'PT'];

export function buildFiveLoveResultDefinitions(): ResultDefinitionPayload[] {
  const defs: ResultDefinitionPayload[] = [];
  for (const primary of FIVE_LOVE_CATEGORIES) {
    for (const secondary of FIVE_LOVE_CATEGORIES) {
      if (primary === secondary) continue;
      const key = `${primary}+${secondary}`;
      defs.push({
        resultKey: key,
        title: `Primary: ${LOVE_LANGUAGE_NAMES[primary]}, Secondary: ${LOVE_LANGUAGE_NAMES[secondary]}`,
        description: `${LOVE_LANGUAGE_NAMES[primary]} appears to be the clearest way you tend to notice care and feel emotionally connected. ${LOVE_LANGUAGE_NAMES[secondary]} adds another meaningful layer to that pattern.\n\nYou may feel especially supported when people express care in these ways, and you may naturally offer the same kinds of signals to people close to you. Use this result as a conversation starter: tell someone what makes you feel appreciated, and stay curious about the ways they receive care.\n\nThis is a self-reflection tool, not a clinical diagnosis or a fixed description of who you are.`
      });
    }
  }
  return defs;
}

// ---------------------------------------------------------------------------
// 4. Relationship / Compatibility (CATEGORY_AVERAGE_BAND) -- 30 questions.
// ---------------------------------------------------------------------------

const RELATIONSHIP_LIKERT_OPTIONS: Array<{ text: string; value: number }> = [
  { text: 'Strongly Disagree', value: 1 },
  { text: 'Disagree', value: 2 },
  { text: 'Neutral', value: 3 },
  { text: 'Agree', value: 4 },
  { text: 'Strongly Agree', value: 5 }
];

const RELATIONSHIP_CATEGORY_KEYS: Record<string, string> = {
  Communication: 'communication',
  Trust: 'trust',
  'Emotional Connection': 'emotional_connection',
  Conflict: 'conflict',
  Independence: 'independence',
  Affection: 'affection',
  Commitment: 'commitment',
  Compatibility: 'compatibility'
};

export function buildRelationshipQuestions(): QuestionPayload[] {
  let order = 1;
  return (relationshipData as Array<{ category: string; n: number; text: string }>).map((q) => ({
    categoryKey: RELATIONSHIP_CATEGORY_KEYS[q.category] ?? q.category.toLowerCase(),
    questionText: q.text,
    questionType: 'likert' as const,
    order: order++,
    answerOptions: RELATIONSHIP_LIKERT_OPTIONS.map((opt, idx) => ({
      text: opt.text,
      numericalValue: opt.value,
      scoringDirection: 'positive' as const,
      order: idx + 1
    }))
  }));
}

const RELATIONSHIP_BANDS = ['low', 'medium', 'high'];

export function buildRelationshipResultDefinitions(): ResultDefinitionPayload[] {
  const defs: ResultDefinitionPayload[] = [];
  for (const categoryKey of Object.values(RELATIONSHIP_CATEGORY_KEYS)) {
    for (const band of RELATIONSHIP_BANDS) {
      defs.push({
        resultKey: `${categoryKey}:${band}`,
        title: `${categoryKey} -- ${band}`,
        description: `Your ${categoryKey.replace(/_/g, ' ')} score band is "${band}". This does not predict relationship success or failure. ${TEMPORARY_RESULT_NOTICE}`
      });
    }
  }
  return defs;
}

export const RELATIONSHIP_CATEGORIES = Object.values(RELATIONSHIP_CATEGORY_KEYS).map((key) => ({
  key,
  name: key.replace(/_/g, ' ')
}));

// ---------------------------------------------------------------------------
// 5. Spirit Animal (TALLY_MAPPING)
// ---------------------------------------------------------------------------

export function buildSpiritAnimalQuestions(): QuestionPayload[] {
  return (spiritAnimalData as Array<{ n: number; stem: string; options: Array<{ label: string; text: string; animal: string }> }>).map(
    (q) => ({
      categoryKey: null,
      questionText: q.stem,
      questionType: 'multiple_choice' as const,
      order: q.n,
      answerOptions: q.options.map((o, idx) => ({
        text: o.text,
        resultMapping: o.animal,
        order: idx + 1
      }))
    })
  );
}

export function buildSpiritAnimalResultDefinitions(): ResultDefinitionPayload[] {
  const animals = ['Wolf', 'Eagle', 'Fox', 'Serpent', 'Lion', 'Panther', 'Dragon', 'Unicorn', 'Phoenix', 'Bear', 'Owl', 'Stag'];
  return animals.flatMap((primary) => animals.filter((secondary) => secondary !== primary).map((secondary) => ({
    resultKey: `${primary}+${secondary}`,
    title: `${primary} + ${secondary}`,
    description: `Your symbolic primary animal is ${primary}, with ${secondary} as a secondary influence. This is an entertainment and self-reflection result, not a clinical assessment.`
  })));
}

// ---------------------------------------------------------------------------
// 6. Cognitive Reasoning / IQ-style (CORRECT_ANSWER_PERCENTAGE) -- DRAFT:
//    only 10 sample questions are given; final target count is undefined.
// ---------------------------------------------------------------------------

export function buildIqQuestions(): QuestionPayload[] {
  return (iqData as Array<{ n: number; stem: string; options: Array<{ label: string; text: string }>; correct: string }>).map((q) => ({
    categoryKey: null,
    questionText: q.stem,
    questionType: 'multiple_choice' as const,
    order: q.n,
    answerOptions: q.options.map((o, idx) => ({
      text: o.text,
      isCorrect: o.label === q.correct,
      order: idx + 1
    }))
  }));
}

// ---------------------------------------------------------------------------
// 7. The Cube (15 questions from the client specification).
// Each answer keeps its reflection as a stable result-mapping key. The
// scoring engine therefore remains deterministic and the hidden payload is
// never sent to the participant.
// ---------------------------------------------------------------------------

const CUBE_QUESTIONS = [
  ['The Cube: Size', 'You see a cube in the desert. How big is it?', ['Massive, towering above you', 'Larger than a car', 'About human-sized', 'Small, almost easy to miss']],
  ['The Cube: Material', 'What is the cube made of?', ['Clear glass', 'Solid metal', 'Wood', 'Sand or eroding stone']],
  ['The Cube: Position', 'Where is the cube?', ['Floating above the ground', 'Half-buried in the sand', 'Sitting firmly on the surface', 'Cracked and sinking']],
  ['The Cube: Transparency', 'Can you see through the cube?', ['Completely transparent', 'Partly transparent', 'Opaque but reflective', 'Completely opaque']],
  ['The Ladder', 'A ladder appears near the cube. What is its relationship to the cube?', ['Leaning directly against it', 'A few steps away', 'Lying on the ground, unused', 'There is no ladder']],
  ['The Ladder: Condition', 'What condition is the ladder in?', ['New and sturdy', 'Old but usable', 'Damaged and difficult to climb', 'Broken beyond use']],
  ['The Horse', 'A horse appears. What is it doing?', ['Running freely toward you', 'Grazing calmly nearby', 'Standing still far away', 'Running away from you']],
  ['The Horse: Trust', 'Would you approach the horse?', ['Immediately', 'Slowly, letting it come to me', 'Only if it clearly allows me to', 'I would keep my distance']],
  ['The Flowers', 'Are there flowers near the horse?', ['Many, bright and in full bloom', 'A few scattered flowers', 'Very few, almost hidden', 'None']],
  ['The Flowers: Condition', 'What are the flowers like?', ['Wild and growing everywhere', 'Carefully arranged', 'Wilted but still alive', 'Dead and scattered']],
  ['Your Distance', 'How far are you from the cube?', ['Standing right beside it', 'A short distance away', 'Far away but able to see it', 'I can barely see it']],
  ['The Storm', 'A storm is visible. What is happening?', ['It is passing far away', 'It is approaching but still far', 'It is directly over you', 'There is no storm']],
  ['The Storm: Your Response', 'What do you do when you notice the storm?', ['Keep walking', 'Find shelter', 'Watch it carefully before deciding', 'Change direction immediately']],
  ['The Desert', 'What does the desert feel like to you?', ['Empty but peaceful', 'Beautiful but unforgiving', 'Lonely and endless', 'Mysterious and full of possibilities']],
  ['The Final Image', 'If you could change one thing in the scene, what would you change?', ['Bring the cube closer to me', 'Bring the horse closer', 'Remove the storm', 'Leave everything exactly as it is']]
] as const;

const CUBE_WEIGHTS: Record<number, Array<Record<string, number>>> = {
  1: [{ 'Self-Image': 3 }, { 'Self-Image': 2 }, { 'Self-Image': 1 }, { 'Self-Image': 0 }],
  2: [{ 'Self-Image': 1, Resilience: 1 }, { 'Self-Image': 3 }, { 'Self-Image': 2 }, { 'Self-Image': 0, Resilience: -1 }],
  3: [{ 'Self-Image': 2, Resilience: -1 }, { 'Self-Image': -1, Resilience: 2 }, { 'Self-Image': 2, Resilience: 2 }, { 'Self-Image': -2, Resilience: -2 }],
  4: [{ 'Self-Image': 2, Relationships: 2 }, { 'Self-Image': 1, Relationships: 1 }, { 'Self-Image': 2, Relationships: 0 }, { 'Self-Image': 1, Relationships: -1 }],
  5: [{ Relationships: 3 }, { Relationships: 2 }, { Relationships: 0 }, { Relationships: -2 }],
  6: [{ Relationships: 2 }, { Relationships: 1 }, { Relationships: -1 }, { Relationships: -2 }],
  7: [{ 'Love Outlook': 3 }, { 'Love Outlook': 2 }, { 'Love Outlook': 0 }, { 'Love Outlook': -2 }],
  8: [{ 'Love Outlook': 2, Relationships: 1 }, { 'Love Outlook': 2, Relationships: 2 }, { 'Love Outlook': 1, Relationships: 2 }, { 'Love Outlook': -1, Relationships: -1 }],
  9: [{ 'Love Outlook': 2 }, { 'Love Outlook': 1 }, { 'Love Outlook': 0 }, { 'Love Outlook': -1 }],
  10: [{ 'Love Outlook': 2, Resilience: 1 }, { 'Love Outlook': 2, Relationships: 1 }, { 'Love Outlook': 0, Resilience: 1 }, { 'Love Outlook': -1, Resilience: -1 }],
  11: [{ 'Self-Image': 2, Relationships: 1 }, { 'Self-Image': 1, Relationships: 1 }, { 'Self-Image': 0, Relationships: -1 }, { 'Self-Image': -1, Relationships: -1 }],
  12: [{ Resilience: 2 }, { Resilience: 0 }, { Resilience: -3 }, { Resilience: 3 }],
  13: [{ Resilience: 3 }, { Resilience: 2 }, { Resilience: 1 }, { Resilience: 1, 'Self-Image': 1 }],
  14: [{ Resilience: 2, 'Self-Image': 1 }, { Resilience: 1, 'Love Outlook': 1 }, { Resilience: -1, Relationships: -1 }, { Resilience: 2, 'Self-Image': 1 }],
  15: [{ 'Self-Image': 2, Relationships: 1 }, { 'Love Outlook': 3, Relationships: 1 }, { Resilience: 3 }, { Resilience: 2, 'Self-Image': 1 }]
};

export function buildCubeQuestions(): QuestionPayload[] {
  return CUBE_QUESTIONS.map(([category, text, options], questionIndex) => ({
    categoryKey: category,
    questionText: text,
    questionType: 'multiple_choice' as const,
    order: questionIndex + 1,
    answerOptions: options.map((option, optionIndex) => ({
      text: option,
      resultMapping: `cube_q${questionIndex + 1}_${String.fromCharCode(65 + optionIndex)}`,
      scoringWeights: CUBE_WEIGHTS[questionIndex + 1][optionIndex],
      order: optionIndex + 1
    }))
  }));
}

export function buildCubeResultDefinitions(): ResultDefinitionPayload[] {
  const bands: Record<string, Array<{ key: string; title: string; description: string }>> = {
    'Self-Image': [
      { key: 'low', title: 'Self-Image — Low', description: 'Your answers suggest a more private or change-sensitive relationship with your sense of self.' },
      { key: 'balanced', title: 'Self-Image — Balanced', description: 'Your answers suggest a flexible relationship with identity: neither highly dominant nor strongly withdrawn.' },
      { key: 'high', title: 'Self-Image — High', description: 'Your answers suggest a strong sense of personal presence, identity, and boundaries.' }
    ],
    Relationships: [
      { key: 'low', title: 'Relationships — Low', description: 'You may place greater emphasis on self-reliance, caution, or emotional distance.' },
      { key: 'balanced', title: 'Relationships — Balanced', description: 'You appear open to connection while retaining meaningful boundaries.' },
      { key: 'high', title: 'Relationships — High', description: 'Connection, trust, and dependable support appear central to your imagined landscape.' }
    ],
    'Love Outlook': [
      { key: 'cautious', title: 'Love Outlook — Cautious', description: 'Your answers suggest that closeness may be approached with caution, distance, or awareness of loss.' },
      { key: 'balanced', title: 'Love Outlook — Balanced', description: 'You appear to hold both openness and caution around intimacy.' },
      { key: 'open', title: 'Love Outlook — Open', description: 'Your answers suggest a relatively open and positive orientation toward closeness and emotional connection.' }
    ],
    Resilience: [
      { key: 'strained', title: 'Resilience — Strained', description: 'Your imagined landscape places considerable weight on pressure, disruption, or vulnerability.' },
      { key: 'adaptive', title: 'Resilience — Adaptive', description: 'You appear to balance awareness of difficulty with the ability to adjust.' },
      { key: 'strong', title: 'Resilience — Strong', description: 'Your answers suggest confidence in enduring, adapting to, or moving through difficulty.' }
    ]
  };
  return Object.values(bands).flatMap((items) => items.map((item) => ({ resultKey: `${item.title.split(' — ')[0]}:${item.key}`, title: item.title, description: item.description })));
}

export const CUBE_SCORING_CONFIG = {
  bands: {
    'Self-Image': [{ key: 'low', min: -99, max: -2 }, { key: 'balanced', min: -1, max: 4 }, { key: 'high', min: 5, max: 99 }],
    Relationships: [{ key: 'low', min: -99, max: -2 }, { key: 'balanced', min: -1, max: 4 }, { key: 'high', min: 5, max: 99 }],
    'Love Outlook': [{ key: 'cautious', min: -99, max: -2 }, { key: 'balanced', min: -1, max: 4 }, { key: 'open', min: 5, max: 99 }],
    Resilience: [{ key: 'strained', min: -99, max: -2 }, { key: 'adaptive', min: -1, max: 4 }, { key: 'strong', min: 5, max: 99 }]
  }
};
