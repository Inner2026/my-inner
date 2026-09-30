/* eslint-disable no-console */
import { connectDB, disconnectDB } from '../config/db';
import { Test } from '../models/Test';
import { TestVersion } from '../models/TestVersion';
import { Question } from '../models/Question';
import { ResultDefinition } from '../models/ResultDefinition';
import { User } from '../models/User';
import bcrypt from 'bcrypt';
import { validateTestVersionForActivation } from '../modules/admin/validation.service';
import * as b from './builders';
import { env } from '../config/env';

interface TestSeedSpec {
  slug: string;
  name: string;
  description: string;
  priceCents: number;
  scoringMethod: any;
  scoringConfig: Record<string, unknown>;
  categories: { key: string; name: string }[];
  expectedQuestionCount: number;
  questions: b.QuestionPayload[];
  results: b.ResultDefinitionPayload[];
  attemptPublish: boolean; // false for known-incomplete content
}

const SEEDS: TestSeedSpec[] = [
  {
    slug: 'mbti-style',
    name: 'MBTI-style Personality Test',
    description:
      'A My Inner MBTI-style self-discovery assessment across four dichotomies. This is an original, self-discovery assessment inspired by well-known personality frameworks -- it is not the official proprietary MBTI instrument.',
    priceCents: 499,
    scoringMethod: 'WEIGHTED_DICHOTOMY',
    scoringConfig: b.MBTI_SCORING_CONFIG,
    categories: [
      { key: 'E', name: 'Extraversion' },
      { key: 'I', name: 'Introversion' },
      { key: 'S', name: 'Sensing' },
      { key: 'N', name: 'Intuition' },
      { key: 'T', name: 'Thinking' },
      { key: 'F', name: 'Feeling' },
      { key: 'J', name: 'Judging' },
      { key: 'P', name: 'Perceiving' }
    ],
    expectedQuestionCount: 60,
    questions: b.buildMbtiQuestions(),
    results: b.buildMbtiResultDefinitions(),
    attemptPublish: true
  },
  {
    slug: 'inner-child',
    name: 'Inner Child Self-Reflection Test',
    description: 'Explore emotional and self-reflection patterns. This is not a clinical diagnosis.',
    priceCents: 499,
    scoringMethod: 'CATEGORY_SUM_RANGE',
    scoringConfig: { pendingContentConfirmation: true },
    categories: [
      { key: 'Emotional Safety', name: 'Emotional Safety' },
      { key: 'Self-Worth', name: 'Self-Worth' },
      { key: 'Emotional Expression', name: 'Emotional Expression' },
      { key: 'Trust & Connection', name: 'Trust & Connection' },
      { key: 'Inner Resilience', name: 'Inner Resilience' }
    ],
    expectedQuestionCount: 30,
    questions: b.buildInnerChildQuestions(),
    results: b.buildInnerChildResultDefinitions(),
    attemptPublish: false
  },
  {
    slug: 'five-love-languages',
    name: 'Five Love Languages Test',
    description: 'Discover how you prefer to give and receive love.',
    priceCents: 499,
    scoringMethod: 'CATEGORY_SUM_RANKING',
    scoringConfig: { pendingContentConfirmation: true },
    categories: [
      { key: 'WA', name: 'Words of Affirmation' },
      { key: 'QT', name: 'Quality Time' },
      { key: 'AS', name: 'Acts of Service' },
      { key: 'TG', name: 'Thoughtful Gifts/Gestures' },
      { key: 'PT', name: 'Physical Touch' }
    ],
    expectedQuestionCount: 30,
    questions: b.buildFiveLoveQuestions(),
    results: b.buildFiveLoveResultDefinitions(),
    attemptPublish: false
  },
  {
    slug: 'hidden-animal',
    name: 'The Hidden Animal Test',
    description: 'An entertainment/self-reflection personality experience -- not a scientific diagnosis.',
    priceCents: 499,
    scoringMethod: 'TALLY_MAPPING',
    scoringConfig: { pendingContentConfirmation: true },
    categories: [],
    expectedQuestionCount: 29,
    questions: b.buildSpiritAnimalQuestions(),
    results: b.buildSpiritAnimalResultDefinitions(),
    attemptPublish: false
  },
  {
    slug: 'cube-personality',
    name: 'Cube Personality Test',
    description:
      'A symbolic self-reflection exercise (cube, ladder, horse, flowers, storm). Framed as symbolic/self-reflection content, not scientifically proven psychological fact.',
    priceCents: 499,
    scoringMethod: 'TRAIT_BAND_ASSEMBLY',
    scoringConfig: b.CUBE_SCORING_CONFIG,
    categories: [
      { key: 'Self-Image', name: 'Self-Image' },
      { key: 'Relationships', name: 'Relationships' },
      { key: 'Love Outlook', name: 'Love Outlook' },
      { key: 'Resilience', name: 'Resilience' }
    ],
    expectedQuestionCount: 15,
    questions: b.buildCubeQuestions(),
    results: b.buildCubeResultDefinitions(),
    attemptPublish: true
  }
];

async function seedTest(spec: TestSeedSpec) {
  console.log(`\n[seed] ${spec.slug} ------------------------------------`);

  let test = await Test.findOne({ slug: spec.slug });
  if (!test) {
    test = await Test.create({
      slug: spec.slug,
      name: spec.name,
      description: spec.description,
      price: { amount: spec.priceCents, currency: 'usd' },
      active: false,
      currentVersionId: null
    });
    console.log(`  created Test ${test._id}`);
  } else {
    console.log(`  Test already exists (${test._id}), reusing`);
  }

  let version = await TestVersion.findOne({ testId: test._id, versionLabel: '1.0' });
  if (!version) {
    version = await TestVersion.create({
      testId: test._id,
      versionLabel: '1.0',
      status: 'draft',
      isCurrent: false,
      expectedQuestionCount: spec.expectedQuestionCount,
      scoringMethod: spec.scoringMethod,
      scoringConfig: spec.scoringConfig,
      categories: spec.categories
    });
    console.log(`  created TestVersion 1.0 (${version._id})`);
  } else {
    console.log(`  TestVersion 1.0 already exists (${version._id}), reusing`);
  }

  if (version.status === 'draft') {
    // Keep an existing draft in sync when a seed definition is completed.
    version.expectedQuestionCount = spec.expectedQuestionCount;
    version.scoringMethod = spec.scoringMethod;
    version.scoringConfig = spec.scoringConfig;
    version.categories = spec.categories;
    await version.save();
    await Question.deleteMany({ testVersionId: version._id });
    await Question.insertMany(spec.questions.map((q) => ({ ...q, testVersionId: version!._id })));
    console.log(`  seeded ${spec.questions.length} question(s)`);

    await ResultDefinition.deleteMany({ testVersionId: version._id });
    if (spec.results.length > 0) {
      await ResultDefinition.insertMany(spec.results.map((r) => ({ ...r, testVersionId: version!._id })));
    }
    console.log(`  seeded ${spec.results.length} result definition(s)`);
  } else {
    console.log('  version is not draft -- skipping content overwrite (immutability rule)');
    // Editorial copy can be refreshed without changing scoring or questions.
    // This keeps already-published Five Love Languages attempts readable while
    // preserving their frozen answer/result snapshots.
    if (spec.slug === 'five-love-languages' || spec.slug === 'cube-personality' || spec.slug === 'mbti-style') {
      await ResultDefinition.bulkWrite(
        spec.results.map((result) => ({
          updateOne: {
            filter: { testVersionId: version!._id, resultKey: result.resultKey },
            update: { $set: { title: result.title, description: result.description, strengths: result.strengths ?? null, challenges: result.challenges ?? null, communication: result.communication ?? null, relationships: result.relationships ?? null, recommendations: result.recommendations ?? null, ...(result.imageUrl !== undefined ? { imageUrl: result.imageUrl } : {}) } }
          }
        }))
      );
      console.log(`  refreshed ${spec.slug} result copy`);
    }
  }

  const report = await validateTestVersionForActivation(version._id);
  console.log(`  validation: ${report.valid ? 'PASS' : 'FAIL'}`);
  if (!report.valid) {
    for (const issue of report.issues) console.log(`    - [${issue.field}] ${issue.message}`);
  }

  if (spec.attemptPublish && report.valid && version.status === 'draft') {
    version.status = 'published';
    version.isCurrent = true;
    version.publishedAt = new Date();
    await version.save();
    test.currentVersionId = version._id;
    test.active = true;
    await test.save();
    console.log('  PUBLISHED and ACTIVATED.');
  } else if (!spec.attemptPublish) {
    console.log('  left as DRAFT/INACTIVE by design (incomplete specification content).');
  } else if (!report.valid) {
    console.log('  left as DRAFT -- validation failed, will not auto-publish.');
  }
}

async function seedAdmin() {
  const configuredEmail = process.env.SEED_ADMIN_EMAIL;
  const configuredPassword = process.env.SEED_ADMIN_PASSWORD;
  if (env.isProd && (!configuredEmail || !configuredPassword)) {
    throw new Error('SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD are required in production.');
  }
  const email = configuredEmail || 'admin@myinner.local';
  const password = configuredPassword || 'Admin@12345';
  if (env.isProd && (email === 'admin@myinner.local' || password === 'Admin@12345')) {
    throw new Error('Unsafe default admin credentials are not allowed in production.');
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const existing = await User.findOne({ email });
  if (existing) {
    existing.role = 'admin';
    // An explicitly supplied password is an intentional development/test reset.
    // Never rotate an existing credential from an implicit default.
    if (configuredPassword) existing.passwordHash = passwordHash;
    await existing.save();
    console.log(`\n[seed] Admin already exists: ${email}`);
    return;
  }
  await User.create({ username: 'admin', email, passwordHash, role: 'admin' });
  console.log(`\n[seed] Created admin: ${email}`);
}

async function main() {
  await connectDB();
  await seedAdmin();
  // Keep legacy catalog entries out of the customer-facing catalog. Their
  // historical attempts remain untouched for reproducibility.
  await Test.updateMany(
    { slug: { $in: ['relationship-compatibility', 'cognitive-reasoning', 'spirit-animal'] } },
    { $set: { active: false, currentVersionId: null } }
  );
  for (const spec of SEEDS) {
    await seedTest(spec);
  }
  console.log('\n[seed] Done.');
  await disconnectDB();
}

main().catch(async (err) => {
  console.error('[seed] Fatal error:', err);
  await disconnectDB();
  process.exit(1);
});
