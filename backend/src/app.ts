import express, { Request, Response } from 'express';
import path from 'path';
import cors from 'cors';
import { buildCorsOrigins } from './utils/corsOrigins';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { connectDB, isDbConnected } from './config/db';
import { notFoundHandler, errorHandler } from './middleware/errorHandler';
import { authRouter } from './modules/auth/auth.routes';
import { testsRouter } from './modules/tests/tests.routes';
import { adminRouter } from './modules/admin/admin.routes';
import { attemptsRouter } from './modules/attempts/attempts.routes';
import { resultsRouter } from './modules/results/results.routes';
import { purchasesRouter } from './modules/purchases/purchases.routes';
import { paypalWebhookRouter } from './modules/purchases/paypalWebhook.routes';
import { referralsRouter } from './modules/referrals/referrals.routes';
import { promotionRouter } from './modules/admin/promotion.routes';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: buildCorsOrigins(env.clientOrigin), credentials: true }));
  app.use(morgan(env.isProd ? 'combined' : 'dev'));

  // Vercel keeps the Express app warm between requests but does not run the
  // long-lived server entrypoint. Establish the shared MongoDB connection
  // before handling API routes in that environment.
  if (process.env.VERCEL === '1') {
    app.use(async (_req, _res, next) => {
      try {
        await connectDB();
        next();
      } catch (err) {
        next(err);
      }
    });
  }

  // Mounted before the global json() parser (and before purchasesRouter's
  // requireAuth) at this exact literal path so PayPal's unauthenticated
  // webhook calls never hit auth middleware; it parses its own body.
  app.use('/api/purchases/webhook', paypalWebhookRouter);

  app.use(express.json({ limit: '1mb' }));
  app.use('/api/uploads', (req, res, next) => {
    // The SPA and API commonly run on different localhost origins in
    // development (5173 vs 4000). Allow image elements/backgrounds to load
    // uploaded assets while keeping the rest of Helmet's protections intact.
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
  }, express.static(path.resolve(process.cwd(), env.uploadDir)));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      db: isDbConnected() ? 'connected' : 'disconnected',
      time: new Date().toISOString()
    });
  });

  app.get('/api/config/payment-mode', (_req: Request, res: Response) => {
    res.json({ mode: env.paymentsMode });
  });


  app.use('/api/auth', authRouter);
  app.use('/api/tests', testsRouter);
  app.use('/api/attempts', attemptsRouter);
  app.use('/api/results', resultsRouter);
  app.use('/api/purchases', purchasesRouter);
  app.use('/api/referrals', referralsRouter);
  app.use('/api/promotion', promotionRouter);
  app.use('/api/admin', adminRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

// Vercel's Express zero-config detector prefers src/app.ts. Export the
// application as the default entrypoint while keeping createApp available for
// the local server and tests.
export default createApp();
