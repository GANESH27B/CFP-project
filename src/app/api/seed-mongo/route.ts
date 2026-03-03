import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { mockUsers, mockClasses, mockAttendanceRecords } from '@/lib/data';

export async function GET() {
  try {
    const db = await getDb();
    
    // Clear existing data (optional, but good for a fresh seed)
    await db.collection('users').deleteMany({});
    await db.collection('classes').deleteMany({});
    await db.collection('attendance').deleteMany({});

    // Save Users
    if (mockUsers && mockUsers.length > 0) {
      // Map id to string or keep as is, depending on how data.ts has it formatted
      const usersToInsert = mockUsers.map(user => ({
        ...user,
        _id: user.id, // using the mock string ID as _id if desired, or let mongo generate and just keep it as a field
      }));
      await db.collection('users').insertMany(usersToInsert);
    }

    // Save Classes
    if (mockClasses && mockClasses.length > 0) {
      const classesToInsert = mockClasses.map(cls => ({
        ...cls,
        _id: cls.id,
      }));
      await db.collection('classes').insertMany(classesToInsert);
    }

    // Save Attendance
    if (mockAttendanceRecords && mockAttendanceRecords.length > 0) {
      const attendanceToInsert = mockAttendanceRecords.map(att => ({
        ...att,
        _id: att.id,
      }));
      await db.collection('attendance').insertMany(attendanceToInsert);
    }

    return NextResponse.json({ success: true, message: 'Successfully added MongoDB database and saved all data.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
