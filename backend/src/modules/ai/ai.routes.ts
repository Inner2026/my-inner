import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import { env } from '../../config/env';
import { requireAuth } from '../../middleware/auth';
import { rateLimit } from '../../middleware/rateLimit';
import { asyncHandler } from '../../utils/asyncHandler';
import { AppError } from '../../utils/AppError';
import { Test } from '../../models/Test';
import { TestAttempt } from '../../models/TestAttempt';
import { getUserResult } from '../results/results.service';
import { MY_INNER_INSTRUCTIONS, REALTIME_TOOLS } from './ai.prompt';

export const aiRouter = Router();

/**
 * POST /api/ai/session
 * Mints a short-lived OpenAI Realtime client secret for one browser voice session.
 * The permanent OPENAI_API_KEY never leaves the server.
 */
aiRouter.post(
  '/session',
  rateLimit({ windowMs: 60 * 60 * 1000, max: env.aiMaxSessionsPerHour, message: 'Voice is busy right now. Please try again later.' }),
  asyncHandler(async (_req: Request, res: Response) => {
    if (!env.aiEnabled) throw new AppError('Voice guide is currently offline.', 503);
    if (!env.openaiApiKey) throw new AppError('Voice guide is not configured.', 503);

    const upstream = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.openaiApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        expires_after: { anchor: 'created_at', seconds: env.aiSessionSeconds },
        session: {
          type: 'realtime',
          model: env.openaiRealtimeModel,
          instructions: MY_INNER_INSTRUCTIONS,
          tools: REALTIME_TOOLS,
          tool_choice: 'auto',
          audio: {
            input: {
              turn_detection: { type: 'server_vad', silence_duration_ms: 600 },
              transcription: { model: 'gpt-4o-mini-transcribe' }
            },
            output: { voice: env.openaiRealtimeVoice }
          }
        }
      })
    });

    if (!upstream.ok) {
      // Status only — never log keys, audio or transcripts.
      console.error('[ai/session] OpenAI error', upstream.status);
      throw new AppError('Voice guide is unavailable right now.', 502);
    }
    const data = (await upstream.json()) as { value: string; expires_at: number };
    console.info('[ai/session] issued', { model: env.openaiRealtimeModel, voice: env.openaiRealtimeVoice });
    res.setHeader('Cache-Control', 'no-store');
    res.json({ clientSecret: data.value, expiresAt: data.expires_at });
  })
);

/**
 * GET /api/ai/result?slug=<test-slug>
 * The signed-in visitor's own latest verified result (optionally for one test),
 * read from the frozen snapshot written by the existing scoring engine.
 * The AI never computes or changes scores.
 */
aiRouter.get(
  '/result',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id as Types.ObjectId;
    const slug = typeof req.query.slug === 'string' ? req.query.slug : undefined;

    const filter: Record<string, unknown> = { userId, status: 'submitted', result: { $exists: true } };
    if (slug) {
      const test = await Test.findOne({ slug }).select('_id').lean();
      if (!test) throw AppError.notFound('Test not found.');
      filter.testId = test._id;
    }
    const attempt = await TestAttempt.findOne(filter).sort({ completedAt: -1 }).select('_id').lean();
    if (!attempt) return res.status(404).json({ status: 'not_ready' });

    const r = await getUserResult(userId, attempt._id.toString());
    res.setHeader('Cache-Control', 'no-store');
    res.json({
      status: 'ready',
      result: {
        testName: r.testName,
        testSlug: r.testSlug,
        completedAt: r.completedAt,
        resultKey: r.resultKey,
        categoryScores: r.categoryScores,
        // Approved text only (no images / internal ids).
        title: r.snapshot?.title,
        description: r.snapshot?.description,
        strengths: r.snapshot?.strengths,
        challenges: r.snapshot?.challenges,
        communication: r.snapshot?.communication,
        relationships: r.snapshot?.relationships,
        recommendations: r.snapshot?.recommendations,
        breakdown: (r.snapshot?.results ?? []).map((i) => ({ resultKey: i.resultKey, title: i.title, description: i.description }))
      }
    });
  })
);
