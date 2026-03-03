import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuthToken } from '@/lib/auth';
import { getDb } from '@/lib/mongodb';
import type { User } from '@/lib/types';
import { ObjectId } from 'mongodb';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const payload = verifyAuthToken(token);
    if (!payload) {
      cookieStore.set('auth_token', '', {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 0,
      });
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const db = await getDb();
    const usersCollection = db.collection('users');

    const mongoId = new ObjectId(payload.userId);
    const userDoc = await usersCollection.findOne({ _id: mongoId });

    if (!userDoc) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const user: User = {
      id: payload.userId,
      name: (userDoc as any).name,
      email: (userDoc as any).email,
      role: (userDoc as any).role,
      avatarUrl: (userDoc as any).avatarUrl,
      status: (userDoc as any).status ?? 'Active',
      registrationNumber: (userDoc as any).registrationNumber,
      faceDescriptor: (userDoc as any).faceDescriptor,
    };

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error('Auth me error', error);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}

