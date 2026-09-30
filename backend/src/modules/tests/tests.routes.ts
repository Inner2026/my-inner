import { Router } from 'express';
import { listTests, getTest } from './tests.controller';
import { getRatings, rateTest } from './ratings.controller';
import { optionalAuth, requireAuth } from '../../middleware/auth';

export const testsRouter = Router();

testsRouter.get('/', listTests);
testsRouter.get('/:slug/ratings', optionalAuth, getRatings);
testsRouter.post('/:slug/ratings', requireAuth, rateTest);
testsRouter.get('/:slug', getTest);
