import { Router } from 'express';
import { listPublished, getPublished } from './articles.controller';

export const articlesRouter = Router();

articlesRouter.get('/', listPublished);
articlesRouter.get('/:slug', getPublished);
