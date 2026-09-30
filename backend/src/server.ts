import { createApp } from './app';
import { connectDB, disconnectDB } from './config/db';
import { env, validatePaymentConfiguration } from './config/env';
import { Purchase, TestAttempt } from './models';

async function main() {
  try {
    validatePaymentConfiguration();
  } catch (err) {
    console.error(`[startup] ${(err as Error).message}`);
    process.exit(1);
  }
  if (env.isProd && env.jwtSecret === 'dev-only-insecure-secret-change-me') {
    console.error('[startup] Refusing to start in production with the default JWT_SECRET. Set a real secret in .env.');
    process.exit(1);
  }
  if (env.isProd && (!env.paypalClientId || !env.paypalClientSecret || !env.paypalWebhookId)) {
    console.warn('[startup] WARNING: PayPal credentials are not fully configured. Purchases will fail until they are set.');
  }

  try {
    await connectDB();
    // Retakes reuse the original entitlement, so these relationships cannot
    // be unique. Remove the old indexes from databases created by earlier
    // versions; missing indexes are intentionally ignored.
    await Promise.all([
      TestAttempt.collection.dropIndex('purchaseId_1').catch(() => undefined),
      Purchase.collection.dropIndex('attemptId_1').catch(() => undefined)
    ]);
  } catch (err) {
    console.error('[startup] Failed to connect to MongoDB:', (err as Error).message);
    console.error('[startup] Server will not start without a database connection.');
    process.exit(1);
  }

  const app = createApp();
  const server = app.listen(env.port, () => {
    console.log(`[server] My Inner API listening on port ${env.port} (${env.nodeEnv})`);
  });

  const shutdown = async (signal: string) => {
    console.log(`[server] Received ${signal}, shutting down gracefully...`);
    server.close(async () => {
      await disconnectDB();
      console.log('[server] Shutdown complete.');
      process.exit(0);
    });
    // Force-exit if it hangs
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main();
