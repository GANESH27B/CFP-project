import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getAuthContext } from '@/lib/server-auth';

interface Params {
    params: { userId: string };
}

export async function GET(req: NextRequest, { params }: Params) {
    try {
        const auth = await getAuthContext();
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { userId } = params;
        const db = await getDb();
        const usersCollection = db.collection('users');

        const doc = await usersCollection.findOne({ _id: new ObjectId(userId) });
        if (!doc) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const user = {
            id: doc._id.toString(),
            name: doc.name,
            email: doc.email,
            role: doc.role,
            avatarUrl: doc.avatarUrl,
            status: doc.status ?? 'Active',
            registrationNumber: doc.registrationNumber,
            classId: doc.classId,
            studentId: doc.studentId,
        };

        return NextResponse.json({ user });
    } catch (error) {
        console.error('Get user error', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest, { params }: Params) {
    try {
        const auth = await getAuthContext();
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (auth.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { userId } = params;
        const body = await req.json();

        const { name, email, role, status, registrationNumber, avatarUrl } = body;
        const updates: Record<string, any> = {};
        if (name !== undefined) updates.name = name;
        if (email !== undefined) updates.email = email;
        if (role !== undefined) updates.role = role;
        if (status !== undefined) updates.status = status;
        if (registrationNumber !== undefined) updates.registrationNumber = registrationNumber;
        if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;
        updates.updatedAt = new Date();

        if (Object.keys(updates).length <= 1) {
            return NextResponse.json({ error: 'No valid fields provided' }, { status: 400 });
        }

        const db = await getDb();
        const usersCollection = db.collection('users');

        const result = await usersCollection.updateOne(
            { _id: new ObjectId(userId) },
            { $set: updates }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Update user error', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: Params) {
    try {
        const auth = await getAuthContext();
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (auth.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { userId } = params;
        const db = await getDb();
        const usersCollection = db.collection('users');

        const result = await usersCollection.deleteOne({ _id: new ObjectId(userId) });

        if (result.deletedCount === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete user error', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
