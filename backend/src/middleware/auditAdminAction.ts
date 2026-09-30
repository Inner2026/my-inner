import { NextFunction, Request, Response } from 'express';
import { Types } from 'mongoose';
import { AuditLog } from '../models/AuditLog';

export function auditAdminAction(req: Request, res: Response, next: NextFunction) {
  if (!req.user || !['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method)) return next();
  res.on('finish', () => {
    const parts = req.originalUrl.split('/').filter(Boolean);
    const entityType = parts[2] ?? 'admin';
    const entityId = parts.find((part) => Types.ObjectId.isValid(part)) ?? null;
    void AuditLog.create({
      actorId: req.user!.id,
      action: `${req.method} ${req.route?.path ?? req.path}`,
      entityType,
      entityId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      ip: req.ip ?? null,
      metadata: { success: res.statusCode < 400 }
    }).catch(() => undefined);
  });
  next();
}
