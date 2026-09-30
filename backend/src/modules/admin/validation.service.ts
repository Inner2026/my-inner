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

/**
 * Method-specific completeness rules, keyed by scoringMethod -- never by test id.
 * This mirrors the scoring engine's own dispatch design (see scoring/registry.ts).
 */
function validateByScoringMethod(
  version: ITestVersion,
  questions: IQuestion[],
  resultCount: number,
  issues: ValidationIssue[]
) {
  const allOptions = questions.flatMap((q) => q.answerOptions);

  switch (version.scoringMethod) {
    case 'WEIGHTED_DICHOTOMY': {
      if (version.categories.length === 0) fail(issues, 'categories', 'Dichotomy poles (categories) are required.');
      const dichotomies = (version.scoringConfig as Record<string, unknown>)?.dichotomies;
      if (!Array.isArray(dichotomies) || dichotomies.length === 0) {
        fail(issues, 'scoringConfig', 'scoringConfig.dichotomies (e.g. [["E","I"], ...]) is required for this scoring method.');
      }
      const missingWeights = allOptions.filter((o) => o.numericalValue === null || o.numericalValue === undefined);
      if (missingWeights.length > 0) fail(issues, 'answerOptions', 'All answer options must have a numericalValue (weight).');
      const missingPole = questions.filter((q) => q.answerOptions.some((o) => !o.scoringCategory || !o.scoringDirection));
      if (missingPole.length > 0) fail(issues, 'answerOptions', 'Every answer option needs a scoringCategory and scoringDirection.');
      if (resultCount === 0) fail(issues, 'resultDefinitions', 'At least one result definition is required (e.g. one per personality type).');
      break;
    }
    case 'CATEGORY_SUM_RANGE': {
      if ((version.scoringConfig as Record<string, unknown>)?.pendingContentConfirmation === true) {
        fail(issues, 'scoringConfig', 'MISSING FROM CLIENT SPECIFICATION: deterministic Inner Child result bands/analysis are not defined.');
      }
      const missingValue = allOptions.some((o) => o.numericalValue === null || o.numericalValue === undefined);
      if (missingValue) fail(issues, 'answerOptions', 'All answer options must have a numericalValue.');
      if (resultCount === 0) fail(issues, 'resultDefinitions', 'At least one score-range result definition is required.');
      break;
    }
    case 'CATEGORY_SUM_RANKING': {
      if ((version.scoringConfig as Record<string, unknown>)?.pendingContentConfirmation === true) {
        fail(issues, 'scoringConfig', 'MISSING FROM CLIENT SPECIFICATION: deterministic SELF/PARTNER comparison and final interpretation are not defined.');
      }
      if (version.categories.length < 2) fail(issues, 'categories', 'At least two categories are required for a ranking test.');
      const missingValue = allOptions.some((o) => o.numericalValue === null || o.numericalValue === undefined);
      if (missingValue) fail(issues, 'answerOptions', 'All answer options must have a numericalValue.');
      const missingCategory = questions.some((q) => !q.categoryKey);
      if (missingCategory) fail(issues, 'questions', 'Every question must be assigned a category.');
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
      const missingMapping = allOptions.some((o) => !o.resultMapping);
      if (missingMapping) fail(issues, 'answerOptions', 'Every answer option must have a resultMapping (e.g. an animal key).');
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
      const missingValue = allOptions.some((o) => o.numericalValue === null || o.numericalValue === undefined);
      if (missingValue) fail(issues, 'answerOptions', 'All answer options must have a numericalValue.');
      if (resultCount === 0) fail(issues, 'resultDefinitions', 'Band-based result definitions are required per category.');
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
      fail(issues, 'questions', 'Question order values must be unique.');
    }
    const emptyOptions = questions.filter((q) => !q.answerOptions || q.answerOptions.length < 2);
    if (emptyOptions.length > 0) {
      fail(issues, 'answerOptions', 'Every question needs at least two answer options.');
    }

    validateByScoringMethod(version, questions, resultCount, issues);
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
