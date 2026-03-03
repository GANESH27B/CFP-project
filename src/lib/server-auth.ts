import { cookies } from 'next/headers';
import { verifyAuthToken, AuthTokenPayload } from '@/lib/auth';

export interface AuthContext extends AuthTokenPayload { }

export async function getAuthContext(): Promise<AuthContext | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) return null;
  const payload = verifyAuthToken(token);
  return payload ?? null;
}

