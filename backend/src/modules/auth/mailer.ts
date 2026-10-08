import nodemailer from 'nodemailer';
import { env } from '../../config/env';
import { createMarketingUnsubscribeToken } from './marketingToken';
import { Types } from 'mongoose';

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  if (!env.smtpHost || !env.smtpUser || !env.smtpPassword) throw new Error('SMTP_HOST, SMTP_USER, and SMTP_PASSWORD must be configured for password reset emails.');
  const transporter = nodemailer.createTransport({ host: env.smtpHost, port: env.smtpPort, secure: env.smtpPort === 465, auth: { user: env.smtpUser, pass: env.smtpPassword } });
  await transporter.sendMail({ from: env.mailFrom, to, subject: 'Reset your My Inner password', text: `Use this link to reset your password: ${resetUrl}\n\nThis link expires in one hour and can only be used once.`, html: `<p>Use the button below to reset your My Inner password.</p><p><a href="${resetUrl}">Reset password</a></p><p>This link expires in one hour and can only be used once.</p>` });
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] ?? character);
}

export async function sendNewTestMarketingEmail(to: string, userId: Types.ObjectId, test: { _id: Types.ObjectId; name: string; description: string; slug: string; marketingSubject?: string; marketingMessage?: string }) {
  if (!env.smtpHost || !env.smtpUser || !env.smtpPassword) throw new Error('SMTP_HOST, SMTP_USER, and SMTP_PASSWORD must be configured for marketing emails.');
  const transporter = nodemailer.createTransport({ host: env.smtpHost, port: env.smtpPort, secure: env.smtpPort === 465, auth: { user: env.smtpUser, pass: env.smtpPassword } });
  const unsubscribeUrl = `${env.clientOrigin}/unsubscribe?token=${encodeURIComponent(createMarketingUnsubscribeToken(userId))}`;
  const subject = test.marketingSubject?.trim() || `New My Inner test: ${test.name}`;
  const message = test.marketingMessage?.trim() || test.description;
  const safeMessage = escapeHtml(message).replace(/\r?\n/g, '<br />');
  await transporter.sendMail({ from: env.mailFrom, to, subject, text: `${message}\n\nExplore the test: ${env.clientOrigin}/tests/${test.slug}\n\nUnsubscribe: ${unsubscribeUrl}`, html: `<h1>${escapeHtml(test.name)}</h1><p>${safeMessage}</p><p><a href="${env.clientOrigin}/tests/${test.slug}">Explore the test</a></p><p><a href="${unsubscribeUrl}">Unsubscribe from marketing emails</a></p>` });
}
