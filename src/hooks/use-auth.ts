import { useEffect, useState } from 'react';
import type { User } from '@/lib/types';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export function useCurrentUser(): AuthState {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch('/api/auth/me', {
          credentials: 'include',
        });
        if (!res.ok) {
          throw new Error('Failed to load current user');
        }
        const data = await res.json();
        if (!cancelled) {
          setState({
            user: data.user,
            loading: false,
            error: null,
          });
        }
      } catch (error: any) {
        if (!cancelled) {
          setState({
            user: null,
            loading: false,
            error: error.message ?? 'Failed to load current user',
          });
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

export async function login(email: string, password: string) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    credentials: 'include',
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? 'Login failed');
  }

  return res.json();
}

export async function signup(params: { name: string; email: string; password: string; role: 'admin' | 'faculty' | 'student'; registrationNumber?: string }) {
  const res = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
    credentials: 'include',
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? 'Sign up failed');
  }

  return res.json();
}

export async function logout() {
  await fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include',
  });
}

