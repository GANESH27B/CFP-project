import jwt from 'jsonwebtoken';
import type { UserRole } from '@/lib/types';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set');
}

export interface AuthTokenPayload {
  userId: string;
  role: UserRole;
}

export function signAuthToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET as string, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

export function verifyAuthToken(token: string): AuthTokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET as string) as AuthTokenPayload;
  } catch {
    return null;
  }
}

