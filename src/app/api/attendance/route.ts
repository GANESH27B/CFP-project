import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { getAuthContext } from '@/lib/server-auth';
import type { AttendanceRecord } from '@/lib/types';

export async function GET(req: NextRequest) {
  const auth = await getAuthContext();
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(req.url);
  const classId = url.searchParams.get('classId');
  const date = url.searchParams.get('date');
  const studentId = url.searchParams.get('studentId');
  const facultyId = url.searchParams.get('facultyId');

  const db = await getDb();
  const attendanceCollection = db.collection('attendance');

  const query: Record<string, any> = {};
  if (classId) query.classId = classId;
  if (date) query.date = date;
  if (studentId) query.studentId = studentId;
  if (facultyId) query.facultyId = facultyId;

  const docs = await attendanceCollection.find(query).toArray();
  const records: AttendanceRecord[] = docs.map((doc: any) => ({
    id: doc._id.toString(),
    studentName: doc.studentName,
    studentId: doc.studentId,
    classId: doc.classId,
    className: doc.className,
    facultyId: doc.facultyId,
    date: doc.date,
    status: doc.status,
  }));

  return NextResponse.json({ records });
}

export async function POST(req: NextRequest) {
  const auth = await getAuthContext();
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { classId, date, studentId, studentName, className, status } = body as {
    classId: string;
    date: string;
    studentId: string;
    studentName: string;
    className: string;
    status: 'Present' | 'Absent';
  };

  if (!classId || !date || !studentId || !studentName || !className || !status) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const db = await getDb();
  const attendanceCollection = db.collection('attendance');

  const key = { classId, date, studentId };

  if (status === 'Absent') {
    await attendanceCollection.deleteOne(key);
    return NextResponse.json({ success: true });
  }

  await attendanceCollection.updateOne(
    key,
    {
      $set: {
        studentName,
        className,
        facultyId: auth.userId,
        status,
        updatedAt: new Date(),
      },
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true }
  );

  return NextResponse.json({ success: true });
}

