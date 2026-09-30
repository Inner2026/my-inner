import nodemailer from 'nodemailer';
import { env } from '../../config/env';
import { createMarketingUnsubscribeToken } from './marketingToken';
import { Types } from 'mongoose';

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  if (!env.smtpHost || !env.smtpUser || !env.smtpPassword) throw new Error('SMTP_HOST, SMTP_USER, and SMTP_PASSWORD must be configured for password reset emails.');
  const transporter = nodemailer.createTransport({ host: env.smtpHost, port: env.smtpPort, secure: env.smtpPort === 465, auth: { user: env.smtpUser, pass: env.smtpPassword } });
  await transporter.sendMail({ from: env.mailFrom, to, subject: 'Reset your My Inner password', text: `Use this link to reset your password: ${resetUrl}\n\nThis link expires in one hour and can only be used once.`, html: `<p>Use the button below to reset your My Inner password.</p><p><a href="${resetUrl}">Reset password</a></p><p>This link expires in one hour and can only be used once.</p>` });
}

export async function sendNewTestMarketingEmail(to: string, userId: Types.ObjectId, test: { _id: Types.ObjectId; name: string; description: string; slug: string }) {
  if (!env.smtpHost || !env.smtpUser || !env.smtpPassword) throw new Error('SMTP_HOST, SMTP_USER, and SMTP_PASSWORD must be configured for marketing emails.');
  const transporter = nodemailer.createTransport({ host: env.smtpHost, port: env.smtpPort, secure: env.smtpPort === 465, auth: { user: env.smtpUser, pass: env.smtpPassword } });
  const unsubscribeUrl = `${env.clientOrigin}/unsubscribe?token=${encodeURIComponent(createMarketingUnsubscribeToken(userId))}`;
  await transporter.sendMail({ from: env.mailFrom, to, subject: `New My Inner test: ${test.name}`, text: `${test.name}\n\n${test.description}\n\nLearn more: ${env.clientOrigin}/tests/${test.slug}\n\nUnsubscribe: ${unsubscribeUrl}`, html: `<h1>${test.name}</h1><p>${test.description}</p><p><a href="${env.clientOrigin}/tests/${test.slug}">Explore the test</a></p><p><a href="${unsubscribeUrl}">Unsubscribe from marketing emails</a></p>` });
}
