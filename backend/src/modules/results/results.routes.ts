import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { listResults, getResult } from './results.controller';

export const resultsRouter = Router();

resultsRouter.use(requireAuth);
resultsRouter.get('/', listResults);
resultsRouter.get('/:attemptId', getResult);
