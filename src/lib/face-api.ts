import * as faceapi from 'face-api.js';

const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';

export async function loadFaceApiModels() {
    await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);
}

export async function getFaceEmbedding(input: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement) {
    const detection = await faceapi
        .detectSingleFace(input)
        .withFaceLandmarks()
        .withFaceDescriptor();

    if (!detection) return null;

    // Return the 128-float array as a string for DB storage
    return Array.from(detection.descriptor);
}

export function computeFaceDistance(descriptor1: number[], descriptor2: number[]) {
    return faceapi.euclideanDistance(descriptor1, descriptor2);
}
