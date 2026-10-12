import { Router } from 'express';
import * as controller from './promotion.controller';
export const promotionRouter = Router();
promotionRouter.get('/', controller.publicSettings);
