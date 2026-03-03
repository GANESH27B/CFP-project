import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getAuthContext } from '@/lib/server-auth';

interface Params {
    params: { userId: string };
}

export async function PATCH(req: NextRequest, { params }: Params) {
    try {
        const auth = await getAuthContext();
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { userId } = params;
        const body = await req.json();

        // Only allow updating certain fields
        const { name, avatarUrl } = body;
        const updates: Record<string, any> = {};
        if (name) updates.name = name;
        if (avatarUrl) updates.avatarUrl = avatarUrl;
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
