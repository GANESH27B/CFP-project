import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/mongodb';
import { signAuthToken } from '@/lib/auth';
import type { User } from '@/lib/types';
import { cookies } from 'next/headers';
import { ObjectId } from 'mongodb';

interface LoginBody {
  email: string;
  password: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<LoginBody>;
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing email or password' }, { status: 400 });
    }

    const db = await getDb();
    const usersCollection = db.collection('users');

    const userDoc = await usersCollection.findOne<{ _id: ObjectId; passwordHash?: string; role: User['role']; name: string; email: string; avatarUrl: string; status: string }>({ email });
    if (!userDoc || !userDoc.passwordHash) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const passwordValid = await bcrypt.compare(password, userDoc.passwordHash);
    if (!passwordValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const userId = userDoc._id.toString();
    const token = signAuthToken({ userId, role: userDoc.role });

    const cookieStore = await cookies();
    cookieStore.set('auth_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    const responseUser: User = {
      id: userId,
      name: (userDoc as any).name,
      email: (userDoc as any).email,
      role: userDoc.role,
      avatarUrl: (userDoc as any).avatarUrl,
      status: (userDoc as any).status ?? 'Active',
    };

    return NextResponse.json(responseUser);
  } catch (error) {
    console.error('Login error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

