import mongoose from 'mongoose';
import { env } from './env';

mongoose.set('strictQuery', true);

let isConnected = false;
let connectionPromise: Promise<void> | null = null;

export async function connectDB(): Promise<void> {
  if (isConnected) return;
  if (!connectionPromise) {
    connectionPromise = (async () => {
      mongoose.connection.once('connected', () => {
        isConnected = true;
        console.log('[db] MongoDB connected');
      });
      mongoose.connection.on('error', (err) => {
        console.error('[db] MongoDB connection error:', err.message);
      });
      mongoose.connection.on('disconnected', () => {
        isConnected = false;
        console.warn('[db] MongoDB disconnected');
      });

      await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 8000 });
    })().catch((err) => {
      connectionPromise = null;
      throw err;
    });
  }
  await connectionPromise;
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  isConnected = false;
  connectionPromise = null;
}

export function isDbConnected(): boolean {
  return mongoose.connection.readyState === 1;
}
