import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import type { User } from '@/lib/types';
import { getAuthContext } from '@/lib/server-auth';
import bcrypt from 'bcryptjs';

export async function GET(req: NextRequest) {
  const auth = await getAuthContext();
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(req.url);
  const roleFilter = url.searchParams.get('role');

  const db = await getDb();
  const usersCollection = db.collection('users');

  const query: Record<string, any> = {};
  if (roleFilter) {
    query.role = roleFilter;
  }

  const docs = await usersCollection.find(query).toArray();
  const users: User[] = docs.map((doc: any) => ({
    id: doc._id.toString(),
    name: doc.name,
    email: doc.email,
    role: doc.role,
    avatarUrl: doc.avatarUrl,
    status: doc.status ?? 'Active',
    registrationNumber: doc.registrationNumber,
    classId: doc.classId,
    studentId: doc.studentId,
    // Return a boolean flag instead of the full vector to avoid large payloads
    faceDescriptor: doc.faceDescriptor ? true : undefined,
  }));

  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  const auth = await getAuthContext();
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (auth.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const { name, email, role, registrationNumber, password } = body as Partial<User> & { password?: string };

  if (!name || !email || !role) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  if (!password || password.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
  }

  const db = await getDb();
  const usersCollection = db.collection('users');

  const existing = await usersCollection.findOne({ email });
  if (existing) {
    return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
  }

  // Hash the password so the new user can log in immediately
  const passwordHash = await bcrypt.hash(password, 10);

  const doc = {
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

  const result = await usersCollection.insertOne(doc);

  const user: User = {
    id: result.insertedId.toString(),
    name,
    email,
    role,
    avatarUrl: doc.avatarUrl,
    status: 'Active',
    registrationNumber,
  };

  return NextResponse.json({ user }, { status: 201 });
}
