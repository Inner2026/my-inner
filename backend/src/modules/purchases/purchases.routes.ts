import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { createPurchase, getPurchase, capturePurchaseHandler, quotePurchase, getEntitlement } from './purchases.controller';
import { rateLimit } from '../../middleware/rateLimit';

export const purchasesRouter = Router();

purchasesRouter.use(requireAuth);
purchasesRouter.post('/', rateLimit({ windowMs: 60_000, max: 10 }), createPurchase);
purchasesRouter.post('/quote', rateLimit({ windowMs: 60_000, max: 30 }), quotePurchase);
purchasesRouter.get('/entitlement/:testSlug', getEntitlement);
purchasesRouter.get('/:purchaseId', getPurchase);
purchasesRouter.post('/:purchaseId/capture', rateLimit({ windowMs: 60_000, max: 10 }), capturePurchaseHandler);
