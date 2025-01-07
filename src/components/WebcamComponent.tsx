import React, { useEffect, useRef, useState, useCallback } from "react";
import { Human, Result } from "@vladmandic/human";

const MIN_WIDTH_FOR_DETECTION = 0;
const RESUME_DETECTION_DELAY = 5000; // 5 seconds

type Timeout = ReturnType<typeof setTimeout>;

interface WebcamComponentProps {
  onPersonDetected?: () => void;
  onPersonExit?: () => void;
}

const config = {
  debug: false,
  modelBasePath: "https://cdn.jsdelivr.net/npm/@vladmandic/human/models",
  body: { enabled: true },
  hand: { enabled: false },
  object: {
    enabled: true,
    minConfidence: 0.6,
  },
};

const WebcamComponent: React.FC<WebcamComponentProps> = ({
  onPersonDetected,
  onPersonExit,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const humanRef = useRef<Human | null>(null);
  const timeoutRef = useRef<Timeout | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [persons, setPersons] = useState(0);
  const [fps, setFps] = useState(0);
  const previousPersonsRef = useRef(0);

  // Initialize webcam
  useEffect(() => {
    const initializeWebcam = async () => {
      if (!videoRef.current) return;

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        if (canvasRef.current && videoRef.current) {
          canvasRef.current.width = videoRef.current.videoWidth;
          canvasRef.current.height = videoRef.current.videoHeight;
        }
      } catch (error) {
        console.error("Error accessing webcam:", error);
      }
    };

    initializeWebcam();

    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Initialize Human.js
  useEffect(() => {
    const initHuman = async () => {
      try {
        const human = new Human(config);

        console.log("Loading Human.js models...");
        await human.load();
        await human.warmup();

        humanRef.current = human;
        setIsReady(true);
        console.log("Human.js initialized successfully");
      } catch (error) {
        console.error("Error initializing Human.js:", error);
      }
    };

    initHuman();
  }, []);

  // Handle person detection changes
  const handlePersonDetectionChange = useCallback(
    (newPersonCount: number) => {
      const previousCount = previousPersonsRef.current;
      previousPersonsRef.current = newPersonCount;

      // Person entered the frame
      if (newPersonCount > 0 && previousCount === 0) {
        onPersonDetected?.();

        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      }

      // Person left the frame
      if (newPersonCount === 0 && previousCount > 0) {
        timeoutRef.current = setTimeout(() => {
          onPersonExit?.();

          // Clear any existing timeout
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
        }, RESUME_DETECTION_DELAY);
      }
    },
    [onPersonDetected, onPersonExit]
  );

  // Process detection results
  const processDetections = useCallback(
    (result: Result) => {
      const personObjects =
        result.object?.filter((obj) => obj.label === "person") || [];
      let personCount = 0;

      for (const person of personObjects) {
        const [width] = person.box;
        if (width >= MIN_WIDTH_FOR_DETECTION) {
          personCount += 1;
        }
      }

      setPersons(personCount);
      handlePersonDetectionChange(personCount);
    },
    [handlePersonDetectionChange]
  );

  // Detection loop
  useEffect(() => {
    if (!isReady || !humanRef.current) return;

    let animationFrameId: number;
    let lastTime = performance.now();

    const detectFrame = async () => {
      if (!videoRef.current || !canvasRef.current || !humanRef.current) return;

      const human = humanRef.current;

      // Perform detection
      const result = await human.detect(videoRef.current);

      // Process detections
      processDetections(result);

      // Draw results
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        // Draw video frame
        ctx.drawImage(videoRef.current, 0, 0);

        // Draw detection results
        human.draw.all(canvasRef.current, result);
      }

      // Calculate FPS
      const now = performance.now();
      const currentFps = 1000 / (now - lastTime);
      lastTime = now;

      // Update status
      setFps(currentFps);

      // Continue loop
      animationFrameId = requestAnimationFrame(detectFrame);
    };

    detectFrame();

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isReady, processDetections]);

  return (
    <div className="relative">
      <video ref={videoRef} style={{ display: "none" }} playsInline muted />
      <canvas ref={canvasRef} className="mx-auto" />
      <div className="absolute bottom-4 left-4 bg-black/50 text-white p-2 rounded">
        <div>FPS: {fps.toFixed(1)}</div>
        <div>Persons detected: {persons}</div>
      </div>
    </div>
  );
};

export default WebcamComponent;
