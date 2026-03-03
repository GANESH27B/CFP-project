import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { getAuthContext } from '@/lib/server-auth';
import { faceEnrollmentFlow } from '@/ai/flows/face-identification';
import { ObjectId } from 'mongodb';

export async function POST(req: NextRequest) {
    const auth = await getAuthContext();
    if (!auth) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { image, descriptor } = await req.json();

        let finalDescriptor: any = descriptor;

        if (!descriptor && image) {
            // Fallback to AI if no direct ML descriptor is provided
            console.log(`[API:EnrollFace] Using AI Flow for user: ${auth.userId}`);
            const { faceDescriptor } = await faceEnrollmentFlow({ image });
            finalDescriptor = faceDescriptor;
        }

        if (!finalDescriptor) {
            return NextResponse.json({ error: 'Image or Descriptor is required' }, { status: 400 });
        }

        const db = await getDb();
        const usersCollection = db.collection('users');

        await usersCollection.updateOne(
            { _id: new ObjectId(auth.userId) },
            { $set: { faceDescriptor: finalDescriptor, updatedAt: new Date() } }
        );

        console.log(`[API:EnrollFace] Successfully enrolled user: ${auth.userId}`);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error enrolling face:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
