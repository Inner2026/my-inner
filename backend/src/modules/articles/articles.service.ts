import { Types } from 'mongoose';
import { Article, IArticle } from '../../models/Article';
import { Test } from '../../models/Test';
import { AppError } from '../../utils/AppError';
import { ArticleInput, ArticlePatch, slugify } from './articles.validation';

const publicListFields = 'slug title excerpt coverImageUrl coverImageAlt relatedTestSlug publishedAt updatedAt';

function toPublic(article: Pick<IArticle, 'slug' | 'title' | 'excerpt' | 'coverImageUrl' | 'coverImageAlt' | 'relatedTestSlug' | 'publishedAt' | 'updatedAt'> & { content?: string }) {
  return {
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt,
    ...(article.content !== undefined ? { content: article.content } : {}),
    coverImageUrl: article.coverImageUrl || '',
    coverImageAlt: article.coverImageAlt || '',
    relatedTestSlug: article.relatedTestSlug || '',
    publishedAt: article.publishedAt,
    updatedAt: article.updatedAt
  };
}

export async function listPublishedArticles() {
  const articles = await Article.find({ status: 'published' }).sort({ publishedAt: -1 }).select(publicListFields).lean();
  return articles.map(toPublic);
}

export async function getPublishedArticle(slug: string) {
  const article = await Article.findOne({ slug: slug.toLowerCase(), status: 'published' }).lean();
  if (!article) throw AppError.notFound('Article not found.');
  return toPublic(article);
}

export async function listAllArticles() {
  return Article.find().sort({ updatedAt: -1 }).select('-content').lean();
}

export async function getArticleById(id: string) {
  if (!Types.ObjectId.isValid(id)) throw AppError.notFound('Article not found.');
  const article = await Article.findById(id).lean();
  if (!article) throw AppError.notFound('Article not found.');
  return article;
}

async function assertSlugAvailable(slug: string, exceptId?: string) {
  const existing = await Article.findOne({ slug }).select('_id').lean();
  if (existing && String(existing._id) !== exceptId) throw AppError.conflict('Another article already uses this URL. Please change the URL slug.');
}

async function assertRelatedTestExists(relatedTestSlug?: string) {
  if (!relatedTestSlug) return;
  const exists = await Test.exists({ slug: relatedTestSlug });
  if (!exists) throw AppError.badRequest('The selected related test does not exist.');
}

export async function createArticle(input: ArticleInput) {
  const slug = input.slug || slugify(input.title);
  if (!slug) throw AppError.badRequest('Please add an English title or a URL slug.');
  await assertSlugAvailable(slug);
  await assertRelatedTestExists(input.relatedTestSlug);
  const article = await Article.create({ ...input, slug, publishedAt: input.status === 'published' ? new Date() : null });
  return article.toObject();
}

export async function updateArticle(id: string, patch: ArticlePatch) {
  const article = await Article.findById(Types.ObjectId.isValid(id) ? id : null);
  if (!article) throw AppError.notFound('Article not found.');
  const wasPublished = article.status === 'published';
  const previousSlug = article.slug;
  if (patch.slug !== undefined && patch.slug !== '' && patch.slug !== article.slug) await assertSlugAvailable(patch.slug, id);
  if (patch.relatedTestSlug) await assertRelatedTestExists(patch.relatedTestSlug);
  const { slug, ...rest } = patch;
  Object.assign(article, rest);
  if (slug) article.slug = slug;
  // Keep the original publish date when an article is edited or re-published.
  if (article.status === 'published' && !article.publishedAt) article.publishedAt = new Date();
  await article.save();
  return { article: article.toObject(), wasPublished, previousSlug };
}

export async function deleteArticle(id: string) {
  const article = await Article.findByIdAndDelete(Types.ObjectId.isValid(id) ? id : null).lean();
  if (!article) throw AppError.notFound('Article not found.');
  return article;
}
