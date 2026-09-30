import { Types } from 'mongoose';
import { Test } from '../../models/Test';
import { TestVersion, ITestVersion } from '../../models/TestVersion';
import { Question } from '../../models/Question';
import { ResultDefinition } from '../../models/ResultDefinition';
import { AppError } from '../../utils/AppError';
import { validateTestVersionForActivation } from './validation.service';
import { scoreAttempt } from '../scoring/scoringEngine';
import { SubmittedAnswer } from '../scoring/types';

async function getEditableVersion(testVersionId: string): Promise<ITestVersion> {
  const version = await TestVersion.findById(testVersionId);
  if (!version) throw AppError.notFound('Test version not found.');
  if (version.status === 'published' || version.status === 'archived') {
    throw AppError.forbidden('Published or archived test versions are immutable. Create a new version to make changes.');
  }
  return version;
}

// ---- Tests ----

export async function createTest(input: { slug: string; name: string; description: string; imageUrl?: string; priceCents: number }) {
  if (!input.slug?.trim() || !input.name?.trim() || !input.description?.trim()) throw AppError.badRequest('Slug, name, and description are required.');
  if (!Number.isInteger(input.priceCents) || input.priceCents < 0) throw AppError.badRequest('Price must be a non-negative integer in cents.');
  return Test.create({
    slug: input.slug.trim().toLowerCase(),
    name: input.name,
    description: input.description,
    imageUrl: input.imageUrl?.trim() ?? '',
    price: { amount: input.priceCents, currency: 'usd' },
    active: false,
    currentVersionId: null
  });
}

export async function updateTest(testId: string, patch: Partial<{ name: string; description: string; imageUrl: string; priceCents: number; active: boolean }>) {
  const test = await Test.findById(testId);
  if (!test) throw AppError.notFound('Test not found.');
  if (patch.name !== undefined) { if (!patch.name.trim()) throw AppError.badRequest('Name cannot be empty.'); test.name = patch.name.trim(); }
  if (patch.description !== undefined) { if (!patch.description.trim()) throw AppError.badRequest('Description cannot be empty.'); test.description = patch.description.trim(); }
  if (patch.imageUrl !== undefined) {
    const imageUrl = patch.imageUrl.trim();
    if (imageUrl && !/^https?:\/\//i.test(imageUrl) && !imageUrl.startsWith('/')) {
      throw AppError.badRequest('Image URL must be an https URL or an app path starting with /.');
    }
    test.imageUrl = imageUrl;
  }
  if (patch.priceCents !== undefined) { if (!Number.isInteger(patch.priceCents) || patch.priceCents < 0) throw AppError.badRequest('Price must be a non-negative integer in cents.'); test.price.amount = patch.priceCents; }
  if (patch.active !== undefined) {
    if (patch.active === true) {
      if (!test.currentVersionId) {
        throw AppError.badRequest('Cannot activate a test with no current published version.');
      }
      const currentVersion = await TestVersion.findById(test.currentVersionId);
      if (!currentVersion || currentVersion.status !== 'published') {
        throw AppError.badRequest('The current version must be published before the test can be activated.');
      }
    }
    test.active = patch.active;
  }
  await test.save();
  return test;
}

/** Archive instead of physically deleting: historical purchases and results keep their test reference. */
export async function archiveTest(testId: string) {
  const test = await Test.findById(testId);
  if (!test) throw AppError.notFound('Test not found.');
  test.active = false;
  await test.save();
  return test;
}

export async function listTestsAdmin(input: { search?: string; active?: boolean; page: number; pageSize: number }) {
  const query: Record<string, unknown> = {};
  const search = input.search?.trim();
  if (search) { const safe = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); query.$or = [{ name: new RegExp(safe, 'i') }, { slug: new RegExp(safe, 'i') }]; }
  if (input.active !== undefined) query.active = input.active;
  const skip = (input.page - 1) * input.pageSize;
  const [tests, total] = await Promise.all([Test.find(query).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(input.pageSize).lean(), Test.countDocuments(query)]);
  return { tests, pagination: { page: input.page, pageSize: input.pageSize, total, pages: Math.ceil(total / input.pageSize) } };
}

export async function listVersions(testId: string) {
  const test = await Test.findById(testId);
  if (!test) throw AppError.notFound('Test not found.');
  return TestVersion.find({ testId }).sort({ createdAt: -1 }).lean();
}

export async function previewVersion(versionId: string, answers: SubmittedAnswer[]) {
  const version = await TestVersion.findById(versionId);
  if (!version) throw AppError.notFound('Test version not found.');
  const questions = await Question.find({ testVersionId: version._id }).sort({ order: 1 });
  if (questions.length === 0) throw AppError.badRequest('Add questions before previewing this version.');
  if (!Array.isArray(answers)) throw AppError.badRequest('Answers must be an array.');
  return scoreAttempt(version, questions, answers);
}

// ---- Test Versions ----

export async function createVersion(input: {
  testId: string;
  versionLabel: string;
  expectedQuestionCount: number;
  scoringMethod: ITestVersion['scoringMethod'];
  scoringConfig?: Record<string, unknown>;
  categories?: { key: string; name: string }[];
}) {
  const test = await Test.findById(input.testId);
  if (!test) throw AppError.notFound('Test not found.');
  if (!input.versionLabel?.trim()) throw AppError.badRequest('Version label is required.');
  if (!Number.isInteger(input.expectedQuestionCount) || input.expectedQuestionCount < 1) throw AppError.badRequest('Expected question count must be a positive integer.');

  return TestVersion.create({
    testId: test._id,
    versionLabel: input.versionLabel,
    status: 'draft',
    isCurrent: false,
    expectedQuestionCount: input.expectedQuestionCount,
    scoringMethod: input.scoringMethod,
    scoringConfig: input.scoringConfig ?? {},
    categories: input.categories ?? []
  });
}

export async function updateVersion(versionId: string, patch: Partial<{
  versionLabel: string;
  expectedQuestionCount: number;
  scoringMethod: ITestVersion['scoringMethod'];
  scoringConfig: Record<string, unknown>;
  categories: { key: string; name: string }[];
}>) {
  const version = await getEditableVersion(versionId);
  if (patch.versionLabel !== undefined) { if (!patch.versionLabel.trim()) throw AppError.badRequest('Version label cannot be empty.'); version.versionLabel = patch.versionLabel.trim(); }
  if (patch.expectedQuestionCount !== undefined) { if (!Number.isInteger(patch.expectedQuestionCount) || patch.expectedQuestionCount < 1) throw AppError.badRequest('Expected question count must be a positive integer.'); version.expectedQuestionCount = patch.expectedQuestionCount; }
  if (patch.scoringMethod !== undefined) version.scoringMethod = patch.scoringMethod;
  if (patch.scoringConfig !== undefined) version.scoringConfig = patch.scoringConfig;
  if (patch.categories !== undefined) version.categories = patch.categories;
  await version.save();
  return version;
}

export async function cloneVersion(sourceVersionId: string, newVersionLabel: string) {
  const source = await TestVersion.findById(sourceVersionId);
  if (!source) throw AppError.notFound('Source test version not found.');

  const clone = await TestVersion.create({
    testId: source.testId,
    versionLabel: newVersionLabel,
    status: 'draft',
    isCurrent: false,
    expectedQuestionCount: source.expectedQuestionCount,
    scoringMethod: source.scoringMethod,
    scoringConfig: source.scoringConfig,
    categories: source.categories
  });

  const questions = await Question.find({ testVersionId: source._id }).lean();
  if (questions.length > 0) {
    await Question.insertMany(
      questions.map((q) => ({
        testVersionId: clone._id,
        categoryKey: q.categoryKey,
        questionText: q.questionText,
        questionType: q.questionType,
        order: q.order,
        answerOptions: q.answerOptions.map((o) => ({ ...o, _id: new Types.ObjectId() }))
      }))
    );
  }

  const results = await ResultDefinition.find({ testVersionId: source._id }).lean();
  if (results.length > 0) {
    await ResultDefinition.insertMany(
      results.map((r) => ({
        testVersionId: clone._id,
        resultKey: r.resultKey,
        minScore: r.minScore,
        maxScore: r.maxScore,
        title: r.title,
        description: r.description,
        strengths: r.strengths,
        challenges: r.challenges,
        communication: r.communication,
        relationships: r.relationships,
        recommendations: r.recommendations
        ,imageUrl: r.imageUrl ?? ''
      }))
    );
  }

  return clone;
}

export async function publishVersion(testVersionId: string) {
  const version = await TestVersion.findById(testVersionId);
  if (!version) throw AppError.notFound('Test version not found.');
  if (version.status === 'published') throw AppError.badRequest('This version is already published.');

  const report = await validateTestVersionForActivation(version._id);
  if (!report.valid) {
    throw AppError.badRequest('Test version failed activation validation.', report.issues);
  }

  version.status = 'published';
  version.publishedAt = new Date();
  await version.save();

  // Make it current: archive the previous current version, update the parent Test pointer.
  const previousCurrent = await TestVersion.findOne({ testId: version.testId, isCurrent: true, _id: { $ne: version._id } });
  if (previousCurrent) {
    previousCurrent.isCurrent = false;
    previousCurrent.status = 'archived';
    previousCurrent.archivedAt = new Date();
    await previousCurrent.save();
  }
  version.isCurrent = true;
  await version.save();

  await Test.findByIdAndUpdate(version.testId, { currentVersionId: version._id });

  return version;
}

// ---- Questions ----

export async function addQuestion(input: {
  testVersionId: string;
  categoryKey?: string | null;
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
    order: number;
  }>;
}) {
  await getEditableVersion(input.testVersionId);
  return Question.create({
    testVersionId: input.testVersionId,
    categoryKey: input.categoryKey ?? null,
    questionText: input.questionText,
    questionType: input.questionType,
    order: input.order,
    answerOptions: input.answerOptions
  });
}

export async function updateQuestion(questionId: string, patch: Partial<{
  categoryKey: string | null;
  questionText: string;
  order: number;
  answerOptions: unknown[];
}>) {
  const question = await Question.findById(questionId);
  if (!question) throw AppError.notFound('Question not found.');
  await getEditableVersion(question.testVersionId.toString());

  if (patch.categoryKey !== undefined) question.categoryKey = patch.categoryKey;
  if (patch.questionText !== undefined) question.questionText = patch.questionText;
  if (patch.order !== undefined) question.order = patch.order;
  if (patch.answerOptions !== undefined) question.set('answerOptions', patch.answerOptions);

  await question.save();
  return question;
}

export async function deleteQuestion(questionId: string) {
  const question = await Question.findById(questionId);
  if (!question) throw AppError.notFound('Question not found.');
  await getEditableVersion(question.testVersionId.toString());
  await question.deleteOne();
}

export async function listQuestions(testVersionId: string) {
  return Question.find({ testVersionId }).sort({ order: 1 }).lean();
}

/** Bulk replace all questions for a draft version -- practical for authoring 25-93 questions at once via JSON. */
export async function bulkSetQuestions(testVersionId: string, questions: Array<Record<string, unknown>>) {
  await getEditableVersion(testVersionId);
  await Question.deleteMany({ testVersionId });
  if (questions.length === 0) return [];
  const docs = questions.map((q, idx) => ({ ...q, testVersionId, order: (q.order as number) ?? idx + 1 }));
  return Question.insertMany(docs);
}

// ---- Result Definitions ----

export async function upsertResultDefinition(input: {
  testVersionId: string;
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
}) {
  await getEditableVersion(input.testVersionId);
  if (input.imageUrl && !/^https?:\/\//i.test(input.imageUrl.trim()) && !input.imageUrl.trim().startsWith('/')) {
    throw AppError.badRequest('Image URL must be an https URL or an app path starting with /.');
  }
  return ResultDefinition.findOneAndUpdate(
    { testVersionId: input.testVersionId, resultKey: input.resultKey },
    { $set: { ...input, imageUrl: input.imageUrl?.trim() ?? '' } },
    { upsert: true, new: true, runValidators: true }
  );
}

export async function deleteResultDefinition(resultDefinitionId: string) {
  const def = await ResultDefinition.findById(resultDefinitionId);
  if (!def) throw AppError.notFound('Result definition not found.');
  await getEditableVersion(def.testVersionId.toString());
  await def.deleteOne();
}

export async function listResultDefinitions(testVersionId: string) {
  return ResultDefinition.find({ testVersionId }).lean();
}
