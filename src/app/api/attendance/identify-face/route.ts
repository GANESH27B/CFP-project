import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { getAuthContext } from '@/lib/server-auth';
import { faceIdentificationFlow } from '@/ai/flows/face-identification';
import { ObjectId } from 'mongodb';

export async function POST(req: NextRequest) {
    const auth = await getAuthContext();
    if (!auth) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { classId, liveImage, descriptor: liveDescriptor } = body;

        if (!classId) {
            return NextResponse.json({ error: 'Missing classId' }, { status: 400 });
        }

        const db = await getDb();

        // 1. Get students enrolled in this class
        const classStudents = await db.collection('classStudents').find({ classId }).toArray();
        const studentIds = classStudents.map(cs => new ObjectId(cs.studentId));

        if (studentIds.length === 0) {
            return NextResponse.json({ error: 'No students enrolled in this class' }, { status: 404 });
        }

        // 2. Get their profiles (name and faceDescriptor)
        const students = await db.collection('users').find({
            _id: { $in: studentIds },
            faceDescriptor: { $exists: true, $ne: null }
        }).toArray();

        if (students.length === 0) {
            return NextResponse.json({ error: 'No students with registered face biometrics in this class.' }, { status: 400 });
        }

        const studentProfiles = students.map(s => ({
            id: s._id.toString(),
            name: s.name,
            faceDescriptor: s.faceDescriptor
        }));

        // 3. Identification Logic
        let bestMatch: { studentId: string | null; confidence: number; message: string } = { studentId: null, confidence: 0, message: "No match found." };

        if (liveDescriptor && Array.isArray(liveDescriptor) && typeof liveDescriptor[0] === 'number') {
            // PRO ML MODE: Euclidean distance comparison
            console.log(`[API:IdentifyFace] Using Vector Matching for class ${classId}`);
            let minDistance = 1.0;
            let matchedId: string | null = null;

            for (const student of studentProfiles) {
                if (Array.isArray(student.faceDescriptor) && typeof (student.faceDescriptor as any)[0] === 'number') {
                    // Simple Euclidean distance
                    const dist = Math.sqrt(
                        liveDescriptor.reduce((sum: number, val: number, i: number) => {
                            const diff = val - (student.faceDescriptor as number[])[i];
                            return sum + diff * diff;
                        }, 0)
                    );

                    if (dist < minDistance) {
                        minDistance = dist;
                        matchedId = student.id;
                    }
                }
            }

            // In face-api, distance < 0.6 is typically a strong match
            if (matchedId && minDistance < 0.6) {
                const confidence = 1 - minDistance;
                const matchPercentage = (confidence * 100).toFixed(2);
                bestMatch = {
                    studentId: matchedId,
                    confidence: confidence,
                    message: `Match found! Accuracy: ${matchPercentage}%`
                };
            }
        } else if (liveImage) {
            // LEGACY/AI MODE: Use Genkit flow
            console.log(`[API:IdentifyFace] Using AI Flow for class ${classId}`);
            const result = await faceIdentificationFlow({ liveImage, students: studentProfiles as any });
            bestMatch = {
                studentId: result.studentId || null,
                confidence: result.confidence || 0,
                message: result.message || "AI Identification result."
            };
        } else {
            return NextResponse.json({ error: 'liveImage or descriptor is required' }, { status: 400 });
        }

        console.log(`[API:IdentifyFace] Result: ${bestMatch.studentId ? 'Matched ' + bestMatch.studentId : 'No Match'} (Confidence: ${bestMatch.confidence})`);
        return NextResponse.json(bestMatch);
    } catch (error: any) {
        console.error('Error identifying face:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
