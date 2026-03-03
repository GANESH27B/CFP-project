import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import type { Class } from '@/lib/types';
import { getAuthContext } from '@/lib/server-auth';
import { ObjectId } from 'mongodb';

export async function GET() {
  const auth = await getAuthContext();
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = await getDb();
  const classesCollection = db.collection('classes');
  const enrollmentsCollection = db.collection('classStudents');

  const classQuery: Record<string, any> = {};
  if (auth.role === 'faculty') {
    classQuery.facultyId = auth.userId;
  } else if (auth.role === 'student') {
    const studentEnrollments = await enrollmentsCollection.find({ studentId: auth.userId }).toArray();
    const enrolledClassIds = studentEnrollments.map(e => e.classId);
    if (enrolledClassIds.length === 0) {
      return NextResponse.json({ classes: [] });
    }
    classQuery._id = {
      $in: enrolledClassIds.map(id => {
        try {
          return new ObjectId(id);
        } catch {
          return id;
        }
      })
    };
  }

  const classDocs = await classesCollection.find(classQuery).toArray();
  const classIds = classDocs.map((c: any) => c._id.toString());

  const enrollmentCountsByClass: Record<string, number> = {};
  if (classIds.length > 0) {
    const enrollmentAgg = await enrollmentsCollection
      .aggregate([
        { $match: { classId: { $in: classIds } } },
        { $group: { _id: '$classId', count: { $sum: 1 } } },
      ])
      .toArray();
    for (const row of enrollmentAgg) {
      enrollmentCountsByClass[row._id] = row.count;
    }
  }

  const classes: (Class & { studentCount: number })[] = classDocs.map((doc: any) => {
    const id = doc._id.toString();
    const studentCount = enrollmentCountsByClass[id] ?? 0;
    return {
      id,
      name: doc.name,
      facultyId: doc.facultyId,
      section: doc.section,
      studentIds: doc.studentIds ?? [],
      studentCount,
    };
  });

  return NextResponse.json({ classes });
}

export async function POST(req: NextRequest) {
  const auth = await getAuthContext();
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { name, section, facultyId } = body as Partial<Class>;

  if (!name || !section || !facultyId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const db = await getDb();
  const classesCollection = db.collection('classes');

  const doc = {
    name,
    section,
    facultyId,
    studentIds: [] as string[],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await classesCollection.insertOne(doc);

  const cls: Class = {
    id: result.insertedId.toString(),
    name,
    facultyId,
    section,
    studentIds: [],
  };

  return NextResponse.json({ class: cls }, { status: 201 });
}

