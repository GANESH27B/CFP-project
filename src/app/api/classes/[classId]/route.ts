import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import type { Class, User } from '@/lib/types';
import { getAuthContext } from '@/lib/server-auth';
import { ObjectId } from 'mongodb';

interface Params {
  params: { classId: string };
}

export async function GET(_req: NextRequest, { params }: Params) {
  const auth = await getAuthContext();
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { classId } = params;
  const db = await getDb();
  const classesCollection = db.collection('classes');
  const usersCollection = db.collection('users');
  const enrollmentsCollection = db.collection('classStudents');

  const classDoc = await classesCollection.findOne({ _id: new ObjectId(classId) });
  if (!classDoc) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const facultyDoc = await usersCollection.findOne({ _id: new ObjectId(classDoc.facultyId) });

  const enrollmentDocs = await enrollmentsCollection.find({ classId }).toArray();
  const studentIds = enrollmentDocs.map((e: any) => e.studentId);
  const studentDocs =
    studentIds.length > 0
      ? await usersCollection.find({ _id: { $in: studentIds.map((id: string) => new ObjectId(id)) } }).toArray()
      : [];

  const allStudentsDocs = await usersCollection.find({ role: 'student' }).toArray();

  const cls: Class = {
    id: classDoc._id.toString(),
    name: classDoc.name,
    facultyId: classDoc.facultyId,
    section: classDoc.section,
    studentIds: studentIds,
  };

  const faculty: User | null = facultyDoc
    ? {
      id: facultyDoc._id.toString(),
      name: facultyDoc.name,
      email: facultyDoc.email,
      role: facultyDoc.role,
      avatarUrl: facultyDoc.avatarUrl,
      status: facultyDoc.status ?? 'Active',
    }
    : null;

  const enrolledStudents: User[] = studentDocs.map((doc: any) => ({
    id: doc._id.toString(),
    name: doc.name,
    email: doc.email,
    role: doc.role,
    avatarUrl: doc.avatarUrl,
    status: doc.status ?? 'Active',
    registrationNumber: doc.registrationNumber,
    faceDescriptor: doc.faceDescriptor,
  }));

  const allStudents: User[] = allStudentsDocs.map((doc: any) => ({
    id: doc._id.toString(),
    name: doc.name,
    email: doc.email,
    role: doc.role,
    avatarUrl: doc.avatarUrl,
    status: doc.status ?? 'Active',
    registrationNumber: doc.registrationNumber,
    faceDescriptor: doc.faceDescriptor,
  }));

  return NextResponse.json({
    class: cls,
    faculty,
    enrolledStudents,
    allStudents,
  });
}

