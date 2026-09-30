import { Types } from 'mongoose';
import { UserRole } from '../../models/User';

export interface JwtPayload {
  sub: string; // user id
  role: UserRole;
  sessionVersion: number;
}

export interface AuthedUser {
  id: Types.ObjectId;
  role: UserRole;
  sessionVersion: number;
}
