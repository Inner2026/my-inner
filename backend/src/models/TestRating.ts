import { Schema, model, Document, Types } from 'mongoose';

export interface ITestRating extends Document {
  _id: Types.ObjectId;
  testId: Types.ObjectId;
  userId: Types.ObjectId;
  rating: number;
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
}

const testRatingSchema = new Schema<ITestRating>(
  {
    testId: { type: Schema.Types.ObjectId, ref: 'Test', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5, validate: Number.isInteger },
    comment: { type: String, trim: true, maxlength: 500, default: '' }
  },
  { timestamps: true }
);

testRatingSchema.index({ testId: 1, userId: 1 }, { unique: true });

export const TestRating = model<ITestRating>('TestRating', testRatingSchema);
