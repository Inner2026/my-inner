import { createApp } from './app';

// Vercel detects this Express entrypoint and exposes the whole API as one
// serverless function. Local development continues to use src/server.ts.
const app = createApp();

export default app;
