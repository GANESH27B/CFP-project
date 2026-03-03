'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const FaceEnrollmentInputSchema = z.object({
    image: z.string().describe('Base64 encoded image of the user face.'),
});

const FaceEnrollmentOutputSchema = z.object({
    faceDescriptor: z.string().describe('A detailed textual description of unique facial features for identification.'),
});

export const faceEnrollmentFlow = ai.defineFlow(
    {
        name: 'faceEnrollmentFlow',
        inputSchema: FaceEnrollmentInputSchema,
        outputSchema: FaceEnrollmentOutputSchema,
    },
    async (input) => {
        const response = await ai.generate({
            prompt: [
                {
                    text: `Analyze the provided face image and generate a highly detailed, professional biometric profile. 
                Break down the analysis into:
                1. Facial Geometry (distance between eyes, nose-to-chin ratio).
                2. Bone Structure (cheekbone prominence, jawline shape).
                3. Unique Details (eye color/shape, ear shape, nose bridge profile).
                4. Distinguishing Markers (scars, moles, hairline).
                
                Produce a technical, descriptive summary that will allow for high-precision matching against live scans. 
                Exclude temporary factors like hair color, glasses, or facial expressions.` },
                { media: { url: input.image, contentType: 'image/jpeg' } },
            ],
        });

        const faceDescriptor = response.text;
        console.log(`[FaceFlow] Biometric Profile generated (Length: ${faceDescriptor.length})`);

        return { faceDescriptor: faceDescriptor };
    }
);

const FaceIdentificationInputSchema = z.object({
    liveImage: z.string().describe('Base64 encoded live image of the scanning student.'),
    students: z.array(z.object({
        id: z.string(),
        name: z.string(),
        faceDescriptor: z.string(),
    })).describe('List of students enrolled in the class with their stored face descriptors.'),
});

const FaceIdentificationOutputSchema = z.object({
    studentId: z.string().optional().describe('The ID of the identified student, if a match is found.'),
    confidence: z.number().describe('Confidence level of the match (0 to 1).'),
    message: z.string().describe('Result message.'),
});

export const faceIdentificationFlow = ai.defineFlow(
    {
        name: 'faceIdentificationFlow',
        inputSchema: FaceIdentificationInputSchema,
        outputSchema: FaceIdentificationOutputSchema,
    },
    async (input) => {
        if (input.students.length === 0) {
            return { confidence: 0, message: "No students provided for identification." };
        }

        const studentList = input.students.map(s => `STUDENT_ID: ${s.id}\nNAME: ${s.name}\nBIOMETRIC_PROFILE: ${s.faceDescriptor}`).join('\n\n---\n\n');

        const response = await ai.generate({
            prompt: [
                {
                    text: `You are a high-security biometric identification system. 
                    Your task is to compare a LIVE SCAN with a database of BIOMETRIC PROFILES.
                    
                    TASK:
                    1. Rigorously analyze the face in the LIVE SCAN.
                    2. Cross-reference internal geometric data with the provided PROFILES.
                    3. Only return a match if the geometric and structural correlation is above 85%.
                    
                    DATABASE PROFILES:
                    ${studentList}
                    
                    SCORING RULES:
                    - 0.90+ : Positively identified.
                    - 0.80 - 0.89 : High probability, needs careful check.
                    - < 0.80 : No reliable match.
                    
                    Return your result as structured JSON according to the schema.` },
                { media: { url: input.liveImage, contentType: 'image/jpeg' } },
            ],
            output: { schema: FaceIdentificationOutputSchema },
        });

        if (response.output) {
            return response.output;
        }

        return { confidence: 0, message: "Identification failed to produce structured output." };
    }
);
