import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import * as svc from './testContent.service';
import { validateTestVersionForActivation } from './validation.service';
import multer from 'multer';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { env } from '../../config/env';

const uploadDirectory = path.resolve(process.cwd(), env.uploadDir);
const isVercel = process.env.VERCEL === '1';
if (!isVercel) fs.mkdirSync(uploadDirectory, { recursive: true });

// Vercel's function filesystem is not persistent and its deployed bundle is
// not writable. Keep uploads in memory there until a cloud storage provider is
// configured; local development continues to use the uploads directory.
const imageUpload = multer({
  storage: isVercel
    ? multer.memoryStorage()
    : multer.diskStorage({ destination: uploadDirectory, filename: (_req, file, cb) => cb(null, `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`) }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, ['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.mimetype))
});

export const createTest = asyncHandler(async (req: Request, res: Response) => {
  const test = await svc.createTest(req.body);
  res.status(201).json({ test });
});

export const updateTest = asyncHandler(async (req: Request, res: Response) => {
  const test = await svc.updateTest(req.params.testId, req.body);
  res.json({ test });
});

export const archiveTest = asyncHandler(async (req: Request, res: Response) => {
  res.json({ test: await svc.archiveTest(req.params.testId) });
});

export const listTests = asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page ?? 1) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize ?? 25) || 25));
  const active = req.query.active === 'true' ? true : req.query.active === 'false' ? false : undefined;
  res.json(await svc.listTestsAdmin({ search: String(req.query.search ?? ''), active, page, pageSize }));
});

export function hasValidImageSignature(filePathOrBuffer: string | Buffer, mimeType: string) {
  const bytes = Buffer.isBuffer(filePathOrBuffer) ? filePathOrBuffer : fs.readFileSync(filePathOrBuffer);
  if (mimeType === 'image/png') return bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (mimeType === 'image/jpeg') return bytes.length >= 3 && bytes.subarray(0, 3).equals(Buffer.from([255, 216, 255]));
  if (mimeType === 'image/gif') return bytes.subarray(0, 6).toString('ascii') === 'GIF87a' || bytes.subarray(0, 6).toString('ascii') === 'GIF89a';
  if (mimeType === 'image/webp') return bytes.length >= 12 && bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP';
  return false;
}

export const uploadImage = [imageUpload.single('image'), asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) { res.status(400).json({ error: { message: 'Please upload a PNG, JPEG, WEBP, or GIF image up to 5MB.' } }); return; }
  const imageData = isVercel ? req.file.buffer : req.file.path;
  if (!hasValidImageSignature(imageData, req.file.mimetype)) {
    if (!isVercel) fs.unlinkSync(req.file.path);
    res.status(400).json({ error: { message: 'The uploaded file content does not match its image type.' } });
    return;
  }
  if (isVercel) {
    res.status(503).json({ error: { message: 'Image uploads require persistent cloud storage on this deployment.' } });
    return;
  }
  res.status(201).json({ imageUrl: `${env.publicApiUrl}/uploads/${req.file.filename}` });
})];

export const listVersions = asyncHandler(async (req: Request, res: Response) => {
  res.json({ versions: await svc.listVersions(req.params.testId) });
});

export const createVersion = asyncHandler(async (req: Request, res: Response) => {
  const version = await svc.createVersion(req.body);
  res.status(201).json({ version });
});

export const updateVersion = asyncHandler(async (req: Request, res: Response) => {
  const version = await svc.updateVersion(req.params.versionId, req.body);
  res.json({ version });
});

export const cloneVersion = asyncHandler(async (req: Request, res: Response) => {
  const version = await svc.cloneVersion(req.params.versionId, req.body.versionLabel);
  res.status(201).json({ version });
});

export const validateVersion = asyncHandler(async (req: Request, res: Response) => {
  const report = await validateTestVersionForActivation(req.params.versionId);
  res.json(report);
});

export const previewVersion = asyncHandler(async (req: Request, res: Response) => {
  const result = await svc.previewVersion(req.params.versionId, req.body.answers ?? []);
  res.json({ result });
});

export const publishVersion = asyncHandler(async (req: Request, res: Response) => {
  const version = await svc.publishVersion(req.params.versionId);
  res.json({ version });
});

export const addQuestion = asyncHandler(async (req: Request, res: Response) => {
  const question = await svc.addQuestion(req.body);
  res.status(201).json({ question });
});

export const updateQuestion = asyncHandler(async (req: Request, res: Response) => {
  const question = await svc.updateQuestion(req.params.questionId, req.body);
  res.json({ question });
});

export const deleteQuestion = asyncHandler(async (req: Request, res: Response) => {
  await svc.deleteQuestion(req.params.questionId);
  res.status(204).send();
});

export const listQuestions = asyncHandler(async (req: Request, res: Response) => {
  res.json({ questions: await svc.listQuestions(req.params.versionId) });
});

export const bulkSetQuestions = asyncHandler(async (req: Request, res: Response) => {
  const questions = await svc.bulkSetQuestions(req.params.versionId, req.body.questions ?? []);
  res.json({ questions });
});

export const upsertResult = asyncHandler(async (req: Request, res: Response) => {
  const result = await svc.upsertResultDefinition(req.body);
  res.status(201).json({ result });
});

export const deleteResult = asyncHandler(async (req: Request, res: Response) => {
  await svc.deleteResultDefinition(req.params.resultId);
  res.status(204).send();
});

export const listResults = asyncHandler(async (req: Request, res: Response) => {
  res.json({ results: await svc.listResultDefinitions(req.params.versionId) });
});
