import { Router } from 'express';
import { requireAuth, requireAdmin } from '../../middleware/auth';
import * as content from './testContent.controller';
import * as readOnly from './adminReadOnly.controller';
import { auditAdminAction } from '../../middleware/auditAdminAction';
import * as marketing from './marketing.controller';
import * as reviews from './reviews.controller';

export const adminRouter = Router();

adminRouter.use(requireAuth, requireAdmin, auditAdminAction);

// Tests
adminRouter.get('/tests', content.listTests);
adminRouter.post('/uploads', content.uploadImage);
adminRouter.get('/tests/:testId/versions', content.listVersions);
adminRouter.post('/tests', content.createTest);
adminRouter.patch('/tests/:testId', content.updateTest);
adminRouter.delete('/tests/:testId', content.archiveTest);

// Versions
adminRouter.get('/versions/:versionId', content.getVersion);
adminRouter.post('/versions/:versionId/sync-mbti', content.syncMbtiVersion);
adminRouter.post('/versions', content.createVersion);
adminRouter.patch('/versions/:versionId', content.updateVersion);
adminRouter.post('/versions/:versionId/clone', content.cloneVersion);
adminRouter.get('/versions/:versionId/validate', content.validateVersion);
adminRouter.post('/versions/:versionId/preview', content.previewVersion);
adminRouter.post('/versions/:versionId/publish', content.publishVersion);

// Questions
adminRouter.get('/versions/:versionId/questions', content.listQuestions);
adminRouter.post('/questions', content.addQuestion);
adminRouter.patch('/questions/:questionId', content.updateQuestion);
adminRouter.delete('/questions/:questionId', content.deleteQuestion);
adminRouter.put('/versions/:versionId/questions/bulk', content.bulkSetQuestions);

// Result definitions
adminRouter.get('/versions/:versionId/results', content.listResults);
adminRouter.post('/results', content.upsertResult);
adminRouter.delete('/results/:resultId', content.deleteResult);

// Read-only oversight
adminRouter.get('/overview', readOnly.overview);
adminRouter.get('/users', readOnly.listUsers);
adminRouter.patch('/users/:userId', readOnly.updateUser);
adminRouter.get('/users/:userId', readOnly.getUserActivity);
adminRouter.get('/purchases', readOnly.listPurchases);
adminRouter.get('/attempts', readOnly.listAttempts);
adminRouter.get('/attempts/:attemptId', readOnly.getAttempt);
adminRouter.get('/audit-logs', readOnly.listAuditLogs);
adminRouter.get('/analytics', readOnly.analytics);
adminRouter.get('/marketing/deliveries', readOnly.listMarketingDeliveries);
adminRouter.get('/settings/status', readOnly.settingsStatus);
adminRouter.post('/marketing/new-test/:testId', marketing.sendNewTestNotification);
adminRouter.get('/reviews', reviews.listReviews);
adminRouter.delete('/reviews/:reviewId', reviews.deleteReview);
