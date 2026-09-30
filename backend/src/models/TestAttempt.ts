import { Schema, model, Document, Types } from 'mongoose';

export type AttemptStatus = 'in_progress' | 'scoring' | 'submitted';

export interface IAttemptAnswer {
  questionId: Types.ObjectId;
  answerOptionId: Types.ObjectId;
  numericValueSnapshot?: number | null;
}

/**
 * One matched ResultDefinition's frozen content. Single-result strategies
 * (e.g. WEIGHTED_DICHOTOMY) produce exactly one of these; multi-result
 * strategies (e.g. CATEGORY_AVERAGE_BAND) produce one per matched key
 * (e.g. one per relationship category), in deterministic match order.
 */
export interface IAttemptResultItem {
  resultKey: string;
  resultDefinitionId: Types.ObjectId;
  imageUrl?: string | null;
  title: string;
  description: string;
  strengths?: string | null;
  challenges?: string | null;
  communication?: string | null;
  relationships?: string | null;
  recommendations?: string | null;
}

export interface IAttemptResultSnapshot {
  title: string;
  description: string;
  strengths?: string | null;
  challenges?: string | null;
  communication?: string | null;
  relationships?: string | null;
  recommendations?: string | null;
  /**
   * Full per-result breakdown, always populated (length 1 for single-result
   * strategies). Lets the result page render category-level interpretations
   * for multi-result strategies without depending on live ResultDefinitions.
   */
  results: IAttemptResultItem[];
}

export interface IAttemptResult {
  resultKey: string;
  rawScores: Record<string, unknown>;
  categoryScores: Record<string, unknown>;
  /** Primary/first matched definition -- kept for simple single-result traceability. */
  resultDefinitionId: Types.ObjectId;
  /** Every matched definition, in deterministic match order -- full traceability for multi-result strategies. */
  resultDefinitionIds: Types.ObjectId[];
  snapshot: IAttemptResultSnapshot;
}

export interface ITestAttempt extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  purchaseId: Types.ObjectId;
  testId: Types.ObjectId;
  testVersionId: Types.ObjectId;
  status: AttemptStatus;
  startedAt: Date;
  completedAt?: Date | null;
  answers: IAttemptAnswer[];
  /** Complete immutable definition used when this attempt was scored. */
  assessmentSnapshot?: Record<string, unknown> | null;
  result?: IAttemptResult | null;
}

const attemptAnswerSchema = new Schema<IAttemptAnswer>(
  {
    questionId: { type: Schema.Types.ObjectId, required: true },
    answerOptionId: { type: Schema.Types.ObjectId, required: true },
    numericValueSnapshot: { type: Number, default: null }
  },
  { _id: false }
);

const attemptResultItemSchema = new Schema<IAttemptResultItem>(
  {
    resultKey: { type: String, required: true },
    resultDefinitionId: { type: Schema.Types.ObjectId, ref: 'ResultDefinition', required: true },
    imageUrl: { type: String, default: null },
    title: { type: String, required: true },
    description: { type: String, required: true },
    strengths: { type: String, default: null },
    challenges: { type: String, default: null },
    communication: { type: String, default: null },
    relationships: { type: String, default: null },
    recommendations: { type: String, default: null }
  },
  { _id: false }
);

const attemptResultSnapshotSchema = new Schema<IAttemptResultSnapshot>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    strengths: { type: String, default: null },
    challenges: { type: String, default: null },
    communication: { type: String, default: null },
    relationships: { type: String, default: null },
    recommendations: { type: String, default: null },
    results: {
      type: [attemptResultItemSchema],
      required: true,
      validate: {
        validator: (v: IAttemptResultItem[]) => Array.isArray(v) && v.length >= 1,
        message: 'A result snapshot must contain at least one matched result item.'
      }
    }
  },
  { _id: false }
);

const attemptResultSchema = new Schema<IAttemptResult>(
  {
    resultKey: { type: String, required: true },
    rawScores: { type: Schema.Types.Mixed, required: true },
    categoryScores: { type: Schema.Types.Mixed, required: true },
    resultDefinitionId: { type: Schema.Types.ObjectId, ref: 'ResultDefinition', required: true },
    resultDefinitionIds: {
      type: [{ type: Schema.Types.ObjectId, ref: 'ResultDefinition' }],
      required: true,
      validate: {
        validator: (v: Types.ObjectId[]) => Array.isArray(v) && v.length >= 1,
        message: 'A result must reference at least one ResultDefinition.'
      }
    },
    snapshot: { type: attemptResultSnapshotSchema, required: true }
  },
  { _id: false }
);

const testAttemptSchema = new Schema<ITestAttempt>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  // One paid purchase grants unlimited attempts, so this is intentionally not unique.
  purchaseId: { type: Schema.Types.ObjectId, ref: 'Purchase', required: true },
  testId: { type: Schema.Types.ObjectId, ref: 'Test', required: true },
  testVersionId: { type: Schema.Types.ObjectId, ref: 'TestVersion', required: true },
  status: { type: String, enum: ['in_progress', 'scoring', 'submitted'], default: 'in_progress' },
  startedAt: { type: Date, default: () => new Date() },
  completedAt: { type: Date, default: null },
  answers: { type: [attemptAnswerSchema], default: [] },
  assessmentSnapshot: { type: Schema.Types.Mixed, default: null },
  result: { type: attemptResultSchema, default: null }
});

testAttemptSchema.index({ userId: 1, completedAt: -1 });
testAttemptSchema.index({ testVersionId: 1 });

export const TestAttempt = model<ITestAttempt>('TestAttempt', testAttemptSchema);
