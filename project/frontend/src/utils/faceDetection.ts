import * as tf from '@tensorflow/tfjs';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import '@tensorflow/tfjs-backend-webgl';

let model: faceLandmarksDetection.FaceLandmarksDetector | null = null;

export async function initializeFaceDetection() {
  await tf.setBackend('webgl');
  model = await faceLandmarksDetection.createDetector(
    faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
    {
      runtime: 'tfjs',
      refineLandmarks: true,
      maxFaces: 1
    }
  );
  return model;
}

export async function detectFace(video: HTMLVideoElement): Promise<{
  faceBox: { x: number; y: number; width: number; height: number } | null;
  landmarks: number[][] | null;
}> {
  if (!model) {
    await initializeFaceDetection();
  }

  if (!model) {
    throw new Error('Face detection model not initialized');
  }

  const predictions = await model.estimateFaces(video);

  if (predictions.length === 0) {
    return { faceBox: null, landmarks: null };
  }

  const prediction = predictions[0];
  const box = prediction.box;
  
  return {
    faceBox: {
      x: box.xMin,
      y: box.yMin,
      width: box.width,
      height: box.height
    },
    landmarks: prediction.keypoints.map(point => [point.x ?? 0, point.y ?? 0, point.z ?? 0])
  };
}

export function createFaceMask(
  canvas: HTMLCanvasElement,
  video: HTMLVideoElement,
  faceBox: { x: number; y: number; width: number; height: number },
  landmarks: number[][]
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Set canvas size to match video
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Calculate face center and radius
  const centerX = faceBox.x + faceBox.width / 2;
  const centerY = faceBox.y + faceBox.height / 2;
  const radius = Math.max(faceBox.width, faceBox.height) * 0.6;

  // Create circular mask
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.closePath();

  // Add feathering
  const gradient = ctx.createRadialGradient(
    centerX, centerY, radius * 0.9,
    centerX, centerY, radius
  );
  gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  
  ctx.fillStyle = gradient;
  ctx.fill();

  // Draw original video content only in face area
  ctx.globalCompositeOperation = 'source-in';
  ctx.drawImage(video, 0, 0);

  // Reset composite operation
  ctx.globalCompositeOperation = 'source-over';

  return canvas.toDataURL('image/png');
}