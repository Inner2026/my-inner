import dotenv from 'dotenv';
dotenv.config();

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '4000', 10),
  clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
  publicApiUrl: process.env.PUBLIC_API_URL ?? 'http://localhost:4000/api',
  uploadDir: process.env.UPLOAD_DIR ?? 'uploads',
  mongoUri: required('MONGODB_URI', 'mongodb://127.0.0.1:27017/myinner'),
  jwtSecret: required('JWT_SECRET', 'dev-only-insecure-secret-change-me'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  paypalClientId: process.env.PAYPAL_CLIENT_ID ?? '',
  paypalClientSecret: process.env.PAYPAL_CLIENT_SECRET ?? '',
  paypalMode: process.env.PAYPAL_MODE ?? 'sandbox',
  paypalCurrency: (process.env.PAYPAL_CURRENCY ?? 'USD').toUpperCase(),
  // Sandbox by default; set to https://api-m.paypal.com in production.
  paypalApiBase: process.env.PAYPAL_API_BASE ?? 'https://api-m.sandbox.paypal.com',
  // The Webhook ID shown on the webhook's config page in the PayPal
  // developer dashboard -- required to verify inbound webhook signatures.
  paypalWebhookId: process.env.PAYPAL_WEBHOOK_ID ?? '',
  paypalReturnUrl: process.env.PAYPAL_RETURN_URL ?? 'http://localhost:5173/checkout/success',
  paypalCancelUrl: process.env.PAYPAL_CANCEL_URL ?? 'http://localhost:5173/checkout/cancel',
  paypalCheckoutTimeoutMinutes: parseInt(process.env.PAYPAL_CHECKOUT_TIMEOUT_MINUTES ?? '30', 10),
  // Only the real PayPal flow is supported; successful demo payments are not allowed.
  paymentsMode: process.env.PAYMENTS_MODE ?? 'paypal',
  isProd: (process.env.NODE_ENV ?? 'development') === 'production',
  smtpHost: process.env.SMTP_HOST ?? '',
  smtpPort: parseInt(process.env.SMTP_PORT ?? '587', 10),
  smtpUser: process.env.SMTP_USER ?? '',
  smtpPassword: process.env.SMTP_PASSWORD ?? '',
  mailFrom: process.env.MAIL_FROM ?? 'admin@my-inner.com',
  passwordResetUrl: process.env.PASSWORD_RESET_URL ?? 'http://localhost:5173/reset-password'
};

export function validatePaymentConfiguration(paymentsMode = env.paymentsMode, isProd = env.isProd) {
  if (!['paypal', 'demo'].includes(paymentsMode)) {
    throw new Error('PAYMENTS_MODE must be either paypal or demo.');
  }
  if (isProd && paymentsMode === 'demo') {
    throw new Error('PAYMENTS_MODE=demo is not allowed when NODE_ENV=production.');
  }
}
