import { Test } from '../../models/Test';
import { TestVersion } from '../../models/TestVersion';
import { AppError } from '../../utils/AppError';

/**
 * Public catalog contains only active tests. Draft and retired/legacy tests
 * stay available to admins and historical result lookups, but must not appear
 * to customers.
 */
export async function listPublicTests() {
  const tests = await Test.find({ active: true }).sort({ createdAt: 1 }).lean();
  const withPublishedVersion = [];
  for (const test of tests) {
    const version = test.currentVersionId
      ? await TestVersion.findById(test.currentVersionId).lean()
      : await TestVersion.findOne({ testId: test._id }).sort({ createdAt: -1 }).lean();
    if (!version) continue;
    withPublishedVersion.push({
      id: test._id,
      slug: test.slug,
      name: test.name,
      description: test.description,
      imageUrl: test.imageUrl || '',
      price: test.price,
      categories: version.categories,
      questionCount: version.expectedQuestionCount,
      versionLabel: version.versionLabel,
      available: test.active && version.status === 'published'
    });
  }
  return withPublishedVersion;
}

export async function getPublicTestBySlug(slug: string) {
  const test = await Test.findOne({ slug }).lean();
  if (!test) {
    throw AppError.notFound('Test not found.');
  }
  const version = test.currentVersionId
    ? await TestVersion.findById(test.currentVersionId).lean()
    : await TestVersion.findOne({ testId: test._id }).sort({ createdAt: -1 }).lean();
  if (!version) {
    throw AppError.notFound('Test not found.');
  }
  return {
    id: test._id,
    slug: test.slug,
    name: test.name,
    description: test.description,
    imageUrl: test.imageUrl || '',
    price: test.price,
    categories: version.categories,
    questionCount: version.expectedQuestionCount,
    versionLabel: version.versionLabel,
    versionId: version._id,
    available: test.active && version.status === 'published'
  };
}
