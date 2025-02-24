import React, { useEffect, useRef } from 'react';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';

interface VideoProcessorProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  onProcessedFace: (faceData: string) => void;
}

export const VideoProcessor: React.FC<VideoProcessorProps> = ({ videoRef, onProcessedFace }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modelRef = useRef<faceLandmarksDetection.FaceLandmarksDetector | null>(null);
  const processingRef = useRef<boolean>(false);
  const frameRequestRef = useRef<number>();

  useEffect(() => {
    const initializeModel = async () => {
      await tf.setBackend('webgl');
      modelRef.current = await faceLandmarksDetection.createDetector(
        faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
        {
          runtime: 'tfjs',
          refineLandmarks: true,
          maxFaces: 1
        }
      );
      processingRef.current = true;
      processFrame();
    };

    initializeModel();

    return () => {
      processingRef.current = false;
      if (frameRequestRef.current) {
        cancelAnimationFrame(frameRequestRef.current);
      }
      modelRef.current = null;
    };
  }, []);

  const processFrame = async () => {
    if (!processingRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const model = modelRef.current;

    if (!video || !canvas || !model || video.readyState !== 4) {
      frameRequestRef.current = requestAnimationFrame(processFrame);
      return;
    }

    try {
      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Detect face
      const predictions = await model.estimateFaces(video);

      if (predictions.length > 0) {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const face = predictions[0];
        const box = face.box;

        // Calculate face center and size
        const centerX = box.xMin + box.width / 2;
        const centerY = box.yMin + box.height / 2;
        const size = Math.max(box.width, box.height) * 1.5;

        // Draw video frame first
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Create circular mask
        ctx.beginPath();
        ctx.arc(centerX, centerY, size / 2, 0, Math.PI * 2);
        ctx.closePath();

        // Apply mask
        ctx.globalCompositeOperation = 'destination-in';
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over'; // Reset to default

        // Convert to data URL and send to parent
        const faceData = canvas.toDataURL('image/png');
        onProcessedFace(faceData);
      }
    } catch (error) {
      console.error('Error processing frame:', error);
    }

    frameRequestRef.current = requestAnimationFrame(processFrame);
  };

  return <canvas ref={canvasRef} style={{ display: 'none' }} />;
};
