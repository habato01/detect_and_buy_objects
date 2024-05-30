import React, { useEffect, useRef, useState } from 'react';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';
import { DetectedObject } from '@tensorflow-models/coco-ssd';

const ObjectDetection = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isWebcamStarted, setIsWebcamStarted] = useState(false);
  const [predictions, setPredictions] = useState<DetectedObject[]>([]);
  const [detectionInterval, setDetectionInterval] = useState<number | null>(null);

  const startWebcam = async () => {
    try {
      setIsWebcamStarted(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      setIsWebcamStarted(false);
      console.error('Error accessing webcam:', error);
    }
  };

  const stopWebcam = () => {
    const video = videoRef.current;
    if (video) {
      const stream = video.srcObject as MediaStream;
      const tracks = stream.getTracks();
      tracks.forEach(track => {
        track.stop();
      });
      video.srcObject = null;
      setIsWebcamStarted(false);
      if (detectionInterval) {
        clearInterval(detectionInterval);
        setDetectionInterval(null);
      }
    }
  };

  const predictObject = async () => {
    if (videoRef.current) {
      const model = await cocoSsd.load();
      const predictions = await model.detect(videoRef.current);
      setPredictions(predictions);
    }
  };

  useEffect(() => {
    if (isWebcamStarted) {
      const interval = setInterval(predictObject, 500) as unknown as number;
      setDetectionInterval(interval);
    } else {
      if (detectionInterval) {
        clearInterval(detectionInterval);
        setDetectionInterval(null);
      }
    }
  }, [isWebcamStarted]);

  return (
    <div className="object-detection">
      <div className="buttons">
        <button onClick={isWebcamStarted ? stopWebcam : startWebcam}>{isWebcamStarted ? "Stop" : "Start"} Webcam</button>
      </div>
      <div className="feed">
        {isWebcamStarted ? <video ref={videoRef} autoPlay muted style={{ position: 'relative' }} /> : <div />}
        {predictions.map((prediction, index) => (
            <a key={index}
              href={`https://www.amazon.com/s?k=${encodeURIComponent(prediction.class)}`}
              style={{
                position: 'absolute',
                left: `${prediction.bbox[0]}px`,
                top: `${prediction.bbox[1]}px`,
                width: `${prediction.bbox[2]}px`,
                height: `${prediction.bbox[3]}px`,
                zIndex: 3, // Asegúrate de que el z-index es adecuado
              }}
              target="_blank"
              rel="noopener noreferrer"
            >
              <div style={{
                border: '2px solid red',
                width: '100%',
                height: '100%'
              }}></div>
              <p style={{
                position: 'absolute',
                width: '100%',
                bottom: 0,
                color: 'white',
                background: 'rgba(0, 0, 0, 0.5)',
                textAlign: 'center',
                margin: 0,
                padding: '5px'
              }}>
                {prediction.class} - {Math.round(prediction.score * 100)}%
              </p>
            </a>
          ))}
      </div>
      <div>
        <h3>Predictions:</h3>
        <ul>
          {predictions.map((prediction, index) => (
            <li key={index}>
              {`${prediction.class} (${(prediction.score * 100).toFixed(2)}%)`}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ObjectDetection;
