import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/mongodb';
import { signAuthToken } from '@/lib/auth';
import type { UserRole, User } from '@/lib/types';
import { cookies } from 'next/headers';

interface SignupBody {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  registrationNumber?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<SignupBody>;
    const { name, email, password, role, registrationNumber } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = await getDb();
    const usersCollection = db.collection('users');

    const existing = await usersCollection.findOne({ email });
    if (existing) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const userDoc = {
      name,
      email,
      role,
      passwordHash,
      registrationNumber,
      avatarUrl: `https://picsum.photos/seed/${encodeURIComponent(email)}/40/40`,
      status: 'Active' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const insertResult = await usersCollection.insertOne(userDoc);

    const userId = insertResult.insertedId.toString();
    const token = signAuthToken({ userId, role });

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
      name,
      email,
      role,
      avatarUrl: userDoc.avatarUrl,
      status: 'Active',
      registrationNumber,
    };

    return NextResponse.json(responseUser, { status: 201 });
  } catch (error) {
    console.error('Signup error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

