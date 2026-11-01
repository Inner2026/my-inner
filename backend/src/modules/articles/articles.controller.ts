import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { AppError } from '../../utils/AppError';
import * as svc from './articles.service';
import { articleInputSchema, articlePatchSchema, formatIssues } from './articles.validation';
import { triggerFrontendRebuild } from './deployHook';

// Public
export const listPublished = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ articles: await svc.listPublishedArticles() });
});

export const getPublished = asyncHandler(async (req: Request, res: Response) => {
  res.json({ article: await svc.getPublishedArticle(req.params.slug) });
});

// Admin
export const adminList = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ articles: await svc.listAllArticles() });
});

export const adminGet = asyncHandler(async (req: Request, res: Response) => {
  res.json({ article: await svc.getArticleById(req.params.articleId) });
});

export const adminCreate = asyncHandler(async (req: Request, res: Response) => {
  const parsed = articleInputSchema.safeParse(req.body);
  if (!parsed.success) throw AppError.badRequest(formatIssues(parsed.error));
  const article = await svc.createArticle(parsed.data);
  const rebuildTriggered = article.status === 'published' ? await triggerFrontendRebuild(`publish ${article.slug}`) : false;
  res.status(201).json({ article, rebuildTriggered });
});

export const adminUpdate = asyncHandler(async (req: Request, res: Response) => {
  const parsed = articlePatchSchema.safeParse(req.body);
  if (!parsed.success) throw AppError.badRequest(formatIssues(parsed.error));
  const { article, wasPublished } = await svc.updateArticle(req.params.articleId, parsed.data);
  // Rebuild whenever the public site changes: publishing, unpublishing, or editing a live article.
  const rebuildTriggered = wasPublished || article.status === 'published' ? await triggerFrontendRebuild(`update ${article.slug}`) : false;
  res.json({ article, rebuildTriggered });
});

export const adminDelete = asyncHandler(async (req: Request, res: Response) => {
  const article = await svc.deleteArticle(req.params.articleId);
  if (article.status === 'published') await triggerFrontendRebuild(`delete ${article.slug}`);
  res.status(204).end();
});
