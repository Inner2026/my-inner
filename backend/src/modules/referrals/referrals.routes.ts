import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { overview, history, ledger, balance, claim } from './referrals.controller';

export const referralsRouter = Router();
referralsRouter.use(requireAuth);
referralsRouter.get('/', overview);
referralsRouter.get('/history', history);
referralsRouter.get('/ledger', ledger);
referralsRouter.get('/balance', balance);
referralsRouter.post('/claim', claim);
