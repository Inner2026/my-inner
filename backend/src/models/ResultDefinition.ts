import { Schema, model, Document, Types } from 'mongoose';

export interface IResultDefinition extends Document {
  _id: Types.ObjectId;
  testVersionId: Types.ObjectId;
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

const resultDefinitionSchema = new Schema<IResultDefinition>(
  {
    testVersionId: { type: Schema.Types.ObjectId, ref: 'TestVersion', required: true },
    resultKey: { type: String, required: true, trim: true },
    imageUrl: { type: String, trim: true, default: '' },
    minScore: { type: Number, default: null },
    maxScore: { type: Number, default: null },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    strengths: { type: String, default: null },
    challenges: { type: String, default: null },
    communication: { type: String, default: null },
    relationships: { type: String, default: null },
    recommendations: { type: String, default: null }
  },
  { timestamps: true }
);

resultDefinitionSchema.index({ testVersionId: 1, resultKey: 1 }, { unique: true });

export const ResultDefinition = model<IResultDefinition>('ResultDefinition', resultDefinitionSchema);
