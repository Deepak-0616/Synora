import jwt from 'jsonwebtoken';
import { UserRole } from '../types/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'synora-dev-fallback-secret-2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  bureauId?: string | null;
  fullName: string;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as any);
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}
