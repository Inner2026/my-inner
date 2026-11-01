import { Schema, model, Document, Types } from 'mongoose';

export type ArticleStatus = 'draft' | 'published';

export interface IArticle extends Document {
  _id: Types.ObjectId;
  slug: string;
  title: string;
  /** Shown on the blog list and used as the Google meta description. */
  excerpt: string;
  /** Article body in Markdown. Rendered and sanitized on the client. */
  content: string;
  coverImageUrl?: string;
  coverImageAlt?: string;
  /** Optional slug of a test promoted at the end of the article. */
  relatedTestSlug?: string;
  status: ArticleStatus;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const articleSchema = new Schema<IArticle>(
  {
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    title: { type: String, required: true, trim: true },
    excerpt: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    coverImageUrl: { type: String, trim: true, default: '' },
    coverImageAlt: { type: String, trim: true, default: '' },
    relatedTestSlug: { type: String, trim: true, lowercase: true, default: '' },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    publishedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

articleSchema.index({ status: 1, publishedAt: -1 });

export const Article = model<IArticle>('Article', articleSchema);
