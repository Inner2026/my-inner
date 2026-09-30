import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { createAttempt, getAttempt, listAttempts, getAttemptQuestions, submitAttempt } from './attempts.controller';

export const attemptsRouter = Router();

attemptsRouter.use(requireAuth);
attemptsRouter.post('/', createAttempt);
attemptsRouter.get('/', listAttempts);
attemptsRouter.get('/:attemptId', getAttempt);
attemptsRouter.get('/:attemptId/questions', getAttemptQuestions);
attemptsRouter.post('/:attemptId/submit', submitAttempt);
