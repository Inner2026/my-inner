import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { User } from '../../models/User';
import { Purchase } from '../../models/Purchase';
import { Test } from '../../models/Test';
import { AppError } from '../../utils/AppError';
import { AuditLog } from '../../models/AuditLog';
import { TestVersion } from '../../models/TestVersion';
import { TestAttempt } from '../../models/TestAttempt';
import { MarketingDelivery } from '../../models/MarketingDelivery';
import { env } from '../../config/env';
import { isDbConnected } from '../../config/db';

function pagination(req: Request) {
  const page = Math.max(1, Number(req.query.page ?? 1) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize ?? 25) || 25));
  return { page, pageSize, skip: (page - 1) * pageSize };
}

function safeRegex(value: string) {
  return new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
}

export const overview = asyncHandler(async (_req: Request, res: Response) => {
  const [users, activeUsers, newUsers, tests, activeTests, draftVersions, publishedVersions, orders, successfulPayments, failedPayments, revenue, recentUsers, recentOrders, recentAttempts] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ active: true }),
    User.countDocuments({ createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }),
    Test.countDocuments(),
    Test.countDocuments({ active: true }),
    TestVersion.countDocuments({ status: 'draft' }),
    TestVersion.countDocuments({ status: 'published' }),
    Purchase.countDocuments(),
    Purchase.countDocuments({ status: 'paid' }),
    Purchase.countDocuments({ status: 'failed' }),
    Purchase.aggregate([{ $match: { status: 'paid' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    User.find().sort({ createdAt: -1 }).limit(5).select('username email phone role createdAt').lean(),
    Purchase.find().sort({ createdAt: -1 }).limit(5).populate('userId', 'username email phone').populate('testId', 'name slug').lean(),
    TestAttempt.find().sort({ startedAt: -1 }).limit(5).populate('userId', 'username email').populate('testId', 'name slug').select('status startedAt completedAt userId testId').lean()
  ]);
  res.json({ stats: { users, activeUsers, newUsers, tests, activeTests, draftVersions, publishedVersions, orders, successfulPayments, failedPayments, revenue: revenue[0]?.total ?? 0 }, recentUsers, recentOrders, recentAttempts });
});

export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const search = String(req.query.search ?? '').trim();
  const { page, pageSize, skip } = pagination(req);
  const query: Record<string, unknown> = search ? { $or: [{ email: safeRegex(search) }, { username: safeRegex(search) }, { phone: safeRegex(search) }] } : {};
  if (req.query.active === 'true' || req.query.active === 'false') query.active = req.query.active === 'true';
  if (req.query.marketingEmails === 'true' || req.query.marketingEmails === 'false') query.marketingEmails = req.query.marketingEmails === 'true';
  const [users, total] = await Promise.all([User.find(query).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(pageSize).lean(), User.countDocuments(query)]);
  res.json({ users: users.map(({ passwordHash, ...rest }) => rest), pagination: { page, pageSize, total, pages: Math.ceil(total / pageSize) } });
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  if (req.params.userId === req.user!.id.toString()) throw AppError.badRequest('An administrator cannot disable their own account.');
  const user = await User.findById(req.params.userId);
  if (!user) throw AppError.notFound('User not found.');
  if (typeof req.body.active === 'boolean') { user.active = req.body.active; user.sessionVersion += 1; }
  if (typeof req.body.marketingEmails === 'boolean') { user.marketingEmails = req.body.marketingEmails; user.marketingConsentAt = req.body.marketingEmails ? new Date() : null; }
  await user.save();
  const safe = user.toObject() as unknown as Record<string, unknown>;
  delete safe.passwordHash;
  res.json({ user: safe });
});

export const getUserActivity = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.params.userId).select('-passwordHash').lean();
  if (!user) return res.status(404).json({ error: { message: 'User not found.' } });
  const [purchases, attempts] = await Promise.all([
    Purchase.find({ userId: user._id }).sort({ createdAt: -1 }).populate('testId', 'name slug').lean(),
    TestAttempt.find({ userId: user._id }).sort({ startedAt: -1 }).populate('testId', 'name slug').select('-answers').lean()
  ]);
  res.json({ user, purchases, attempts });
});

export const listPurchases = asyncHandler(async (req: Request, res: Response) => {
  const status = String(req.query.status ?? '').trim();
  const { page, pageSize, skip } = pagination(req);
  const query = status ? { status } : {};
  const [purchases, total] = await Promise.all([Purchase.find(query).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(pageSize).populate('userId', 'username email phone').populate('testId', 'name slug').lean(), Purchase.countDocuments(query)]);
  res.json({ purchases, pagination: { page, pageSize, total, pages: Math.ceil(total / pageSize) } });
});

export const listAttempts = asyncHandler(async (req: Request, res: Response) => {
  const { page, pageSize, skip } = pagination(req);
  const query: Record<string, unknown> = {};
  if (req.query.status) query.status = String(req.query.status);
  const [attempts, total] = await Promise.all([TestAttempt.find(query).sort({ startedAt: -1, _id: -1 }).skip(skip).limit(pageSize).populate('userId', 'username email').populate('testId', 'name slug').lean(), TestAttempt.countDocuments(query)]);
  res.json({ attempts, pagination: { page, pageSize, total, pages: Math.ceil(total / pageSize) } });
});

export const getAttempt = asyncHandler(async (req: Request, res: Response) => {
  const attempt = await TestAttempt.findById(req.params.attemptId).populate('userId', 'username email phone').populate('testId', 'name slug').populate('purchaseId', 'status amount currency paidAt expiresAt').lean();
  if (!attempt) { res.status(404).json({ error: { message: 'Attempt not found.' } }); return; }
  res.json({ attempt });
});

export const listAuditLogs = asyncHandler(async (req: Request, res: Response) => {
  const { page, pageSize, skip } = pagination(req);
  const query: Record<string, unknown> = {};
  if (req.query.action) query.action = safeRegex(String(req.query.action));
  const [logs, total] = await Promise.all([AuditLog.find(query).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(pageSize).populate('actorId', 'username email').lean(), AuditLog.countDocuments(query)]);
  res.json({ logs, pagination: { page, pageSize, total, pages: Math.ceil(total / pageSize) } });
});

function dateRange(req: Request) {
  const from = req.query.from ? new Date(String(req.query.from)) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const to = req.query.to ? new Date(String(req.query.to)) : new Date();
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) throw AppError.badRequest('Invalid analytics date range.');
  return { $gte: from, $lte: to };
}

export const analytics = asyncHandler(async (req: Request, res: Response) => {
  const createdAt = dateRange(req);
  const [dailyPurchases, byTest, attempts, newUsers, marketing] = await Promise.all([
    Purchase.aggregate([{ $match: { createdAt, status: 'paid' } }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, purchases: { $sum: 1 }, revenue: { $sum: '$amount' } } }, { $sort: { _id: 1 } }]),
    Purchase.aggregate([{ $match: { createdAt, status: 'paid' } }, { $group: { _id: '$testId', purchases: { $sum: 1 }, revenue: { $sum: '$amount' } } }, { $lookup: { from: 'tests', localField: '_id', foreignField: '_id', as: 'test' } }, { $unwind: { path: '$test', preserveNullAndEmptyArrays: true } }, { $project: { _id: 1, name: '$test.name', purchases: 1, revenue: 1 } }, { $sort: { revenue: -1 } }]),
    TestAttempt.aggregate([{ $match: { startedAt: createdAt } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    User.countDocuments({ createdAt }),
    MarketingDelivery.aggregate([{ $match: { createdAt } }, { $group: { _id: '$status', count: { $sum: 1 } } }])
  ]);
  res.json({ range: { from: createdAt.$gte, to: createdAt.$lte }, dailyPurchases, byTest, attempts, newUsers, marketing });
});

export const listMarketingDeliveries = asyncHandler(async (req: Request, res: Response) => {
  const { page, pageSize, skip } = pagination(req); const query: Record<string, unknown> = {};
  if (req.query.status === 'sent' || req.query.status === 'failed') query.status = req.query.status;
  const [deliveries, total] = await Promise.all([MarketingDelivery.find(query).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(pageSize).populate('userId', 'username email').populate('testId', 'name slug').lean(), MarketingDelivery.countDocuments(query)]);
  res.json({ deliveries, pagination: { page, pageSize, total, pages: Math.ceil(total / pageSize) } });
});

export const settingsStatus = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ settings: {
    environment: env.nodeEnv,
    database: isDbConnected() ? 'connected' : 'disconnected',
    paymentsMode: env.paymentsMode,
    paypalMode: env.paypalMode,
    paypalConfigured: Boolean(env.paypalClientId && env.paypalClientSecret),
    paypalWebhookConfigured: Boolean(env.paypalWebhookId),
    smtpConfigured: Boolean(env.smtpHost && env.smtpUser && env.smtpPassword),
    mailFromConfigured: Boolean(env.mailFrom),
    publicApiUrl: env.publicApiUrl,
    clientOrigin: env.clientOrigin,
    uploadDirectoryConfigured: Boolean(process.env.UPLOAD_DIR),
    imageStorage: env.imageStorage,
    cloudinaryConfigured: Boolean(env.cloudinaryCloudName && env.cloudinaryApiKey && env.cloudinaryApiSecret)
  } });
});
