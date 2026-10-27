import { Types } from 'mongoose';
import { TestVersion, ITestVersion } from '../../models/TestVersion';
import { Question, IQuestion } from '../../models/Question';
import { ResultDefinition, IResultDefinition } from '../../models/ResultDefinition';
import { containsPlaceholderText } from '../../utils/placeholderContent';

export interface ValidationIssue {
  field: string;
  message: string;
}

export interface ValidationReport {
  valid: boolean;
  issues: ValidationIssue[];
}

function fail(issues: ValidationIssue[], field: string, message: string) {
  issues.push({ field, message });
}

const OPTION_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/** "Answer B" for the 2nd option -- matches how admins read the editor. */
function answerLabel(question: IQuestion, optionIndex: number) {
  const option = question.answerOptions[optionIndex];
  const letter = OPTION_LETTERS[optionIndex] ?? String(optionIndex + 1);
  const text = option?.text?.trim();
  const short = text ? ` ("${text.length > 40 ? `${text.slice(0, 40)}...` : text}")` : '';
  return `Answer ${letter}${short}`;
}

/** Lists every question/answer failing a check, e.g. "Question 6: Answer A, Answer B". */
function describeOptionLocations(questions: IQuestion[], predicate: (option: IQuestion['answerOptions'][number]) => boolean, limit = 6) {
  const parts: string[] = [];
  for (const question of questions) {
    const bad = question.answerOptions
      .map((option, index) => (predicate(option) ? OPTION_LETTERS[index] ?? String(index + 1) : null))
      .filter((v): v is string => v !== null);
    if (bad.length > 0) parts.push(`Question ${question.order}: answer${bad.length > 1 ? 's' : ''} ${bad.join(', ')}`);
  }
  if (parts.length === 0) return '';
  const shown = parts.slice(0, limit).join('; ');
  return parts.length > limit ? `${shown}; and ${parts.length - limit} more question(s)` : shown;
}

const missingNumber = (o: { numericalValue?: number | null }) => o.numericalValue === null || o.numericalValue === undefined || Number.isNaN(o.numericalValue);

/**
 * "Highest category wins" (CATEGORY_HIGHEST_SCORE): each answer belongs to one
 * category and adds its numericalValue to it. Dichotomy pairs, scoring
 * directions, question category keys and score ranges are NOT used and are
 * therefore never required here.
 */
function validateHighestScore(
  version: ITestVersion,
  questions: IQuestion[],
  resultDefinitions: IResultDefinition[],
  issues: ValidationIssue[]
) {
  const keys = version.categories.map((c) => c.key?.trim()).filter(Boolean) as string[];
  if (keys.length < 2) {
    fail(issues, 'categories', 'Add at least two scoring categories (for example Dolphin, Dog, Fox...) in the version settings.');
  }
  const duplicates = keys.filter((key, index) => keys.indexOf(key) !== index);
  if (duplicates.length > 0) {
    fail(issues, 'categories', `Category keys must be unique. Duplicated: ${[...new Set(duplicates)].join(', ')}.`);
  }
  const known = new Set(keys);

  for (const question of questions) {
    question.answerOptions.forEach((option, index) => {
      const where = `Question ${question.order}, ${answerLabel(question, index)}`;
      if (missingNumber(option)) {
        fail(issues, 'answerOptions', `${where}: enter a numerical value (use 1 for one point).`);
      } else if ((option.numericalValue as number) < 0) {
        fail(issues, 'answerOptions', `${where}: the numerical value cannot be negative.`);
      }
      const category = (option.scoringCategory ?? option.resultMapping ?? '').trim();
      if (!category) {
        fail(issues, 'answerOptions', `${where}: choose a scoring category.`);
      } else if (keys.length > 0 && !known.has(category)) {
        fail(issues, 'answerOptions', `${where}: category "${category}" is not one of this test's categories (${keys.join(', ')}). Check the spelling.`);
      }
    });
  }

  const resultKeys = new Set(resultDefinitions.map((r) => r.resultKey));
  for (const key of keys) {
    if (!resultKeys.has(key)) {
      fail(issues, 'resultDefinitions', `Category "${key}" has no result. Add a result whose Result key is exactly "${key}".`);
    }
  }
  for (const definition of resultDefinitions) {
    if (keys.length > 0 && !known.has(definition.resultKey)) {
      fail(issues, 'resultDefinitions', `Result "${definition.title || definition.resultKey}" uses Result key "${definition.resultKey}", which does not match any category (${keys.join(', ')}).`);
    }
  }
}

/**
 * Method-specific completeness rules, keyed by scoringMethod -- never by test id.
 * This mirrors the scoring engine's own dispatch design (see scoring/registry.ts).
 */
function validateByScoringMethod(
  version: ITestVersion,
  questions: IQuestion[],
  resultDefinitions: IResultDefinition[],
  issues: ValidationIssue[]
) {
  const resultCount = resultDefinitions.length;
  const allOptions = questions.flatMap((q) => q.answerOptions);

  switch (version.scoringMethod) {
    case 'WEIGHTED_DICHOTOMY': {
      if (version.categories.length === 0) fail(issues, 'categories', 'Dichotomy poles (categories) are required.');
      const dichotomies = (version.scoringConfig as Record<string, unknown>)?.dichotomies;
      if (!Array.isArray(dichotomies) || dichotomies.length === 0) {
        fail(issues, 'scoringConfig', 'scoringConfig.dichotomies (e.g. [["E","I"], ...]) is required for this scoring method.');
      }
      const missingWeights = describeOptionLocations(questions, missingNumber);
      if (missingWeights) fail(issues, 'answerOptions', `All answer options must have a numericalValue (weight). Missing on ${missingWeights}.`);
      const missingPole = describeOptionLocations(questions, (o) => !o.scoringCategory || !o.scoringDirection);
      if (missingPole) fail(issues, 'answerOptions', `Every answer option needs a scoringCategory and scoringDirection. Missing on ${missingPole}.`);
      if (resultCount === 0) fail(issues, 'resultDefinitions', 'At least one result definition is required (e.g. one per personality type).');
      break;
    }
    case 'CATEGORY_SUM_RANGE': {
      if ((version.scoringConfig as Record<string, unknown>)?.pendingContentConfirmation === true) {
        fail(issues, 'scoringConfig', 'MISSING FROM CLIENT SPECIFICATION: deterministic Inner Child result bands/analysis are not defined.');
      }
      const missingValue = describeOptionLocations(questions, missingNumber);
      if (missingValue) fail(issues, 'answerOptions', `All answer options must have a numericalValue. Missing on ${missingValue}.`);
      if (resultCount === 0) fail(issues, 'resultDefinitions', 'At least one score-range result definition is required.');
      break;
    }
    case 'CATEGORY_SUM_RANKING': {
      if ((version.scoringConfig as Record<string, unknown>)?.pendingContentConfirmation === true) {
        fail(issues, 'scoringConfig', 'MISSING FROM CLIENT SPECIFICATION: deterministic SELF/PARTNER comparison and final interpretation are not defined.');
      }
      if (version.categories.length < 2) fail(issues, 'categories', 'At least two categories are required for a ranking test.');
      const missingValue = describeOptionLocations(questions, missingNumber);
      if (missingValue) fail(issues, 'answerOptions', `All answer options must have a numericalValue. Missing on ${missingValue}.`);
      const missingCategory = questions.filter((q) => !q.categoryKey).map((q) => q.order);
      if (missingCategory.length > 0) fail(issues, 'questions', `Every question must be assigned a category. Missing on question${missingCategory.length > 1 ? 's' : ''} ${missingCategory.join(', ')}. (For tests where each answer belongs to a different category, use the "Highest category wins" scoring method instead.)`);
      break;
    }
    case 'CORRECT_ANSWER_PERCENTAGE': {
      const badQuestions = questions.filter((q) => q.answerOptions.filter((o) => o.isCorrect === true).length !== 1);
      if (badQuestions.length > 0) fail(issues, 'answerOptions', 'Every question must have exactly one answer option marked isCorrect.');
      if (resultCount === 0) fail(issues, 'resultDefinitions', 'At least one score-range result definition is required.');
      break;
    }
    case 'TALLY_MAPPING': {
      if ((version.scoringConfig as Record<string, unknown>)?.pendingContentConfirmation === true) {
        fail(issues, 'scoringConfig', 'MISSING FROM CLIENT FILES: Question 30 and its answer mappings.');
      }
      const missingMapping = describeOptionLocations(questions, (o) => !o.resultMapping);
      if (missingMapping) fail(issues, 'answerOptions', `Every answer option must have a resultMapping (e.g. an animal key). Missing on ${missingMapping}.`);
      if (resultCount === 0) fail(issues, 'resultDefinitions', 'Result definitions are required for the possible primary/secondary combinations.');
      break;
    }
    case 'FRAMEWORK_SNIPPET_ASSEMBLY': {
      const missingMapping = allOptions.some((o) => !o.resultMapping);
      if (missingMapping) fail(issues, 'answerOptions', 'Every answer option must have a resultMapping (a trait snippet key).');
      if (version.categories.length === 0) fail(issues, 'categories', 'Symbolic elements (categories) are required (e.g. cube, ladder, horse...).');
      break;
    }
    case 'TRAIT_BAND_ASSEMBLY': {
      if (version.categories.length === 0) fail(issues, 'categories', 'Trait categories are required for band assembly.');
      const missingWeights = allOptions.some((o) => !o.scoringWeights || Object.keys(o.scoringWeights).length === 0);
      if (missingWeights) fail(issues, 'answerOptions', 'Every answer option must have one or more scoringWeights.');
      if (resultCount === 0) fail(issues, 'resultDefinitions', 'Trait-band result definitions are required.');
      break;
    }
    case 'CATEGORY_AVERAGE_BAND': {
      if (version.categories.length === 0) fail(issues, 'categories', 'Categories are required for average-band scoring.');
      const missingValue = describeOptionLocations(questions, missingNumber);
      if (missingValue) fail(issues, 'answerOptions', `All answer options must have a numericalValue. Missing on ${missingValue}.`);
      if (resultCount === 0) fail(issues, 'resultDefinitions', 'Band-based result definitions are required per category.');
      break;
    }
    case 'CATEGORY_HIGHEST_SCORE': {
      validateHighestScore(version, questions, resultDefinitions, issues);
      break;
    }
    default:
      fail(issues, 'scoringMethod', `Unknown scoring method: ${version.scoringMethod}`);
  }
}

/**
 * Generic placeholder-content guard: scans every text field of every
 * ResultDefinition for this version for obvious dev/placeholder markers
 * (see utils/placeholderContent.ts). Never keyed by test id or slug -- any
 * test, current or future, is blocked from activation while its result
 * copy is still a placeholder.
 */
function validateNoPlaceholderContent(resultDefinitions: IResultDefinition[], issues: ValidationIssue[]) {
  const textFields: Array<keyof IResultDefinition> = [
    'title',
    'description',
    'strengths',
    'challenges',
    'communication',
    'relationships',
    'recommendations'
  ];

  for (const def of resultDefinitions) {
    const hasPlaceholder = textFields.some((field) => containsPlaceholderText(def[field]));
    if (hasPlaceholder) {
      fail(
        issues,
        'resultDefinitions',
        `Result definition "${def.resultKey}" contains placeholder text and cannot be published. Replace it with approved copy via the admin panel first.`
      );
    }
  }
}

export async function validateTestVersionForActivation(testVersionId: Types.ObjectId | string): Promise<ValidationReport> {
  const issues: ValidationIssue[] = [];

  const version = await TestVersion.findById(testVersionId);
  if (!version) {
    return { valid: false, issues: [{ field: 'testVersionId', message: 'Test version not found.' }] };
  }

  const questions = await Question.find({ testVersionId: version._id }).sort({ order: 1 });
  const resultDefinitions = await ResultDefinition.find({ testVersionId: version._id });
  const resultCount = resultDefinitions.length;

  validateNoPlaceholderContent(resultDefinitions, issues);

  const invertedRanges = resultDefinitions.filter(
    (definition) =>
      definition.minScore !== null &&
      definition.minScore !== undefined &&
      definition.maxScore !== null &&
      definition.maxScore !== undefined &&
      definition.minScore > definition.maxScore
  );
  if (invertedRanges.length > 0) {
    fail(issues, 'resultDefinitions', 'Every score range must have minScore less than or equal to maxScore.');
  }

  if (questions.length === 0) {
    fail(issues, 'questions', 'The test version has no questions.');
  } else {
    if (questions.length !== version.expectedQuestionCount) {
      fail(
        issues,
        'questions',
        `Question count mismatch: expected ${version.expectedQuestionCount}, found ${questions.length}.`
      );
    }
    const orders = questions.map((q) => q.order);
    const uniqueOrders = new Set(orders);
    if (uniqueOrders.size !== orders.length) {
      const dupes = [...new Set(orders.filter((order, index) => orders.indexOf(order) !== index))];
      fail(issues, 'questions', `Question order values must be unique. Used more than once: ${dupes.join(', ')}.`);
    }
    const emptyOptions = questions.filter((q) => !q.answerOptions || q.answerOptions.length < 2);
    if (emptyOptions.length > 0) {
      fail(issues, 'answerOptions', `Every question needs at least two answer options. Check question${emptyOptions.length > 1 ? 's' : ''} ${emptyOptions.map((q) => q.order).join(', ')}.`);
    }

    validateByScoringMethod(version, questions, resultDefinitions, issues);
  }

  // NOTE: an empty scoringConfig is not, by itself, a validation failure --
  // most strategies (CATEGORY_SUM_RANGE, CATEGORY_SUM_RANKING,
  // CORRECT_ANSWER_PERCENTAGE, TALLY_MAPPING, FRAMEWORK_SNIPPET_ASSEMBLY)
  // never read scoringConfig at all, and CATEGORY_AVERAGE_BAND has a
  // documented default band split when scoringConfig.bands is omitted (see
  // strategies/categoryAverageBand.ts). Only WEIGHTED_DICHOTOMY actually
  // requires config content, and that is checked above, in
  // validateByScoringMethod, where the requirement actually lives.

  if (version.scoringConfig && (version.scoringConfig as Record<string, unknown>).pendingContentConfirmation === true) {
    fail(
      issues,
      'scoringConfig',
      'This version is explicitly flagged pendingContentConfirmation and cannot be published until an admin clears that flag.'
    );
  }

  return { valid: issues.length === 0, issues };
}
