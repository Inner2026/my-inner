import { Schema, model, Document, Types } from 'mongoose';

export type ScoringMethod =
  | 'WEIGHTED_DICHOTOMY'
  | 'CATEGORY_SUM_RANGE'
  | 'CATEGORY_SUM_RANKING'
  | 'CORRECT_ANSWER_PERCENTAGE'
  | 'TALLY_MAPPING'
  | 'CATEGORY_AVERAGE_BAND'
  | 'FRAMEWORK_SNIPPET_ASSEMBLY'
  | 'TRAIT_BAND_ASSEMBLY';

export type TestVersionStatus = 'draft' | 'complete' | 'published' | 'archived';

export interface ICategory {
  key: string;
  name: string;
}

export interface ITestVersion extends Document {
  _id: Types.ObjectId;
  testId: Types.ObjectId;
  versionLabel: string;
  status: TestVersionStatus;
  isCurrent: boolean;
  expectedQuestionCount: number;
  scoringMethod: ScoringMethod;
  scoringConfig: Record<string, unknown>;
  categories: ICategory[];
  createdAt: Date;
  publishedAt?: Date | null;
  archivedAt?: Date | null;
}

const categorySchema = new Schema<ICategory>(
  {
    key: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true }
  },
  { _id: false }
);

const testVersionSchema = new Schema<ITestVersion>(
  {
    testId: { type: Schema.Types.ObjectId, ref: 'Test', required: true },
    versionLabel: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['draft', 'complete', 'published', 'archived'],
      default: 'draft',
      required: true
    },
    isCurrent: { type: Boolean, default: false },
    expectedQuestionCount: { type: Number, required: true, min: 1 },
    scoringMethod: {
      type: String,
      enum: [
        'WEIGHTED_DICHOTOMY',
        'CATEGORY_SUM_RANGE',
        'CATEGORY_SUM_RANKING',
        'CORRECT_ANSWER_PERCENTAGE',
        'TALLY_MAPPING',
        'CATEGORY_AVERAGE_BAND',
        'FRAMEWORK_SNIPPET_ASSEMBLY',
        'TRAIT_BAND_ASSEMBLY'
      ],
      required: true
    },
    scoringConfig: { type: Schema.Types.Mixed, default: {} },
    categories: { type: [categorySchema], default: [] },
    publishedAt: { type: Date, default: null },
    archivedAt: { type: Date, default: null }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

testVersionSchema.index({ testId: 1, versionLabel: 1 }, { unique: true });
// Partial unique index: only one isCurrent:true version per test.
testVersionSchema.index(
  { testId: 1, isCurrent: 1 },
  { unique: true, partialFilterExpression: { isCurrent: true } }
);

export const TestVersion = model<ITestVersion>('TestVersion', testVersionSchema);
