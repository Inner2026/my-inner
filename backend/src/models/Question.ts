import { Schema, model, Document, Types } from 'mongoose';

export type QuestionType = 'likert' | 'multiple_choice';
export type ScoringDirection = 'positive' | 'negative';

export interface IAnswerOption {
  _id: Types.ObjectId;
  text: string;
  numericalValue?: number | null;
  isCorrect?: boolean | null;
  scoringCategory?: string | null;
  scoringDirection?: ScoringDirection | null;
  resultMapping?: string | null;
  scoringWeights?: Record<string, number> | null;
  order: number;
}

export interface IQuestion extends Document {
  _id: Types.ObjectId;
  testVersionId: Types.ObjectId;
  categoryKey?: string | null;
  questionText: string;
  questionType: QuestionType;
  order: number;
  answerOptions: IAnswerOption[];
}

const answerOptionSchema = new Schema<IAnswerOption>({
  text: { type: String, required: true, trim: true },
  numericalValue: { type: Number, default: null },
  isCorrect: { type: Boolean, default: null },
  scoringCategory: { type: String, default: null, trim: true },
  scoringDirection: { type: String, enum: ['positive', 'negative', null], default: null },
  resultMapping: { type: String, default: null, trim: true },
  scoringWeights: { type: Schema.Types.Mixed, default: null },
  order: { type: Number, required: true }
});

const questionSchema = new Schema<IQuestion>(
  {
    testVersionId: { type: Schema.Types.ObjectId, ref: 'TestVersion', required: true },
    categoryKey: { type: String, default: null, trim: true },
    questionText: { type: String, required: true, trim: true },
    questionType: { type: String, enum: ['likert', 'multiple_choice'], required: true },
    order: { type: Number, required: true },
    answerOptions: {
      type: [answerOptionSchema],
      validate: {
        validator: (v: IAnswerOption[]) => Array.isArray(v) && v.length >= 2,
        message: 'A question needs at least two answer options.'
      }
    }
  },
  { timestamps: true }
);

questionSchema.index({ testVersionId: 1, order: 1 }, { unique: true });

export const Question = model<IQuestion>('Question', questionSchema);
