import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { getAuthContext } from '@/lib/server-auth';

interface Params {
  params: { classId: string };
}

export async function POST(req: NextRequest, { params }: Params) {
  const auth = await getAuthContext();
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { classId } = params;
  const body = await req.json();
  const { studentId } = body as { studentId: string };

  if (!studentId) {
    return NextResponse.json({ error: 'Missing studentId' }, { status: 400 });
  }

  const db = await getDb();
  const enrollmentsCollection = db.collection('classStudents');

  await enrollmentsCollection.updateOne(
    { classId, studentId },
    { $set: { classId, studentId } },
    { upsert: true }
  );

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = await getAuthContext();
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { classId } = params;
  const body = await req.json();
  const { studentId } = body as { studentId: string };

  if (!studentId) {
    return NextResponse.json({ error: 'Missing studentId' }, { status: 400 });
  }

  const db = await getDb();
  const enrollmentsCollection = db.collection('classStudents');

  await enrollmentsCollection.deleteOne({ classId, studentId });

  return NextResponse.json({ success: true });
}

