import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { AppError } from '../../utils/AppError';
import * as svc from './attempts.service';

export const createAttempt = asyncHandler(async (req: Request, res: Response) => {
  const { purchaseId } = req.body ?? {};
  if (!purchaseId) throw AppError.badRequest('purchaseId is required.');
  const attempt = await svc.createAttemptFromPurchase(req.user!.id, purchaseId);
  res.status(201).json({ attempt });
});

export const getAttempt = asyncHandler(async (req: Request, res: Response) => {
  const attempt = await svc.getOwnedAttempt(req.user!.id, req.params.attemptId);
  res.json({ attempt });
});

export const listAttempts = asyncHandler(async (req: Request, res: Response) => {
  const attempts = await svc.listOwnedAttempts(req.user!.id);
  res.json({ attempts });
});

export const getAttemptQuestions = asyncHandler(async (req: Request, res: Response) => {
  const questions = await svc.getAttemptQuestions(req.user!.id, req.params.attemptId);
  res.json({ questions });
});

export const submitAttempt = asyncHandler(async (req: Request, res: Response) => {
  const { answers } = req.body ?? {};
  if (!Array.isArray(answers)) throw AppError.badRequest('answers must be an array.');
  const attempt = await svc.submitAttempt(req.user!.id, req.params.attemptId, answers);
  res.json({ attempt });
});
