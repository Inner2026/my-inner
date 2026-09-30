import { Schema, model, Document, Types } from 'mongoose';

export interface IAuditLog extends Document {
  _id: Types.ObjectId;
  actorId: Types.ObjectId;
  action: string;
  entityType: string;
  entityId?: string | null;
  method: string;
  path: string;
  statusCode: number;
  ip?: string | null;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>({
  actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true, trim: true },
  entityType: { type: String, required: true, trim: true },
  entityId: { type: String, default: null },
  method: { type: String, required: true },
  path: { type: String, required: true },
  statusCode: { type: Number, required: true },
  ip: { type: String, default: null },
  metadata: { type: Schema.Types.Mixed, default: {} }
}, { timestamps: { createdAt: true, updatedAt: false } });

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ actorId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });

export const AuditLog = model<IAuditLog>('AuditLog', auditLogSchema);
