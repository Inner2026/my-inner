import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { listUserResults, getUserResult } from './results.service';

export const listResults = asyncHandler(async (req: Request, res: Response) => {
  const results = await listUserResults(req.user!.id);
  res.json({ results });
});

export const getResult = asyncHandler(async (req: Request, res: Response) => {
  const result = await getUserResult(req.user!.id, req.params.attemptId);
  res.json({ result });
});
