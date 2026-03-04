import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { getAuthContext } from '@/lib/server-auth';
import { ObjectId } from 'mongodb';

// Admin-only endpoint: enroll a face descriptor for any student by targetUserId
export async function POST(req: NextRequest) {
    const auth = await getAuthContext();
    if (!auth) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (auth.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden: admin only' }, { status: 403 });
    }

    try {
        const { targetUserId, descriptor } = await req.json();

        if (!targetUserId || !descriptor || !Array.isArray(descriptor)) {
            return NextResponse.json({ error: 'targetUserId and descriptor array are required' }, { status: 400 });
        }

        const db = await getDb();
        const usersCollection = db.collection('users');

        const result = await usersCollection.updateOne(
            { _id: new ObjectId(targetUserId) },
            { $set: { faceDescriptor: descriptor, updatedAt: new Date() } }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json({ error: 'Student not found' }, { status: 404 });
        }

        console.log(`[API:EnrollFaceAdmin] Admin ${auth.userId} enrolled face for user: ${targetUserId}`);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error enrolling face (admin):', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
