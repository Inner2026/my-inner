import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { listPublicTests, getPublicTestBySlug } from './tests.service';

export const listTests = asyncHandler(async (_req: Request, res: Response) => {
  const tests = await listPublicTests();
  res.json({ tests });
});

export const getTest = asyncHandler(async (req: Request, res: Response) => {
  const test = await getPublicTestBySlug(req.params.slug);
  res.json({ test });
});
