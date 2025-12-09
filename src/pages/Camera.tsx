import { useRef, useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import Webcam from "react-webcam";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useAuth } from "@/hooks/useAuth";
import { addTranslation } from "@/lib/db";
import { speechService } from "@/lib/tts";
import { detectGesture, GestureBuffer } from "@/lib/signMapping";
import { getConfidenceLevel } from "@/types";
import {
  ArrowLeft,
  Camera,
  CameraOff,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Save,
  Hand,
  Loader2,
  Settings2,
} from "lucide-react";

declare global {
  interface Window {
    Hands: any;
    drawConnectors: any;
    drawLandmarks: any;
    HAND_CONNECTIONS: any;
  }
}

export default function CameraPage() {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [handDetected, setHandDetected] = useState(false);
  const [currentSign, setCurrentSign] = useState<{ sign: string; confidence: number } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState([1]);
  const [speed, setSpeed] = useState([1]);
  const [language, setLanguage] = useState<"en-US" | "sw-KE">("en-US");
  const [showSettings, setShowSettings] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  
  const gestureBufferRef = useRef(new GestureBuffer());
  const handsRef = useRef<any>(null);
  const animationRef = useRef<number | null>(null);

  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/auth");
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Load MediaPipe
  useEffect(() => {
    const loadMediaPipe = async () => {
      try {
        // Load scripts dynamically
        const loadScript = (src: string) => {
          return new Promise<void>((resolve, reject) => {
            const script = document.createElement("script");
            script.src = src;
            script.async = true;
            script.onload = () => resolve();
            script.onerror = reject;
            document.body.appendChild(script);
          });
        };

        await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js");
        await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js");
        await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js");

        // Initialize Hands
        const hands = new window.Hands({
          locateFile: (file: string) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
          },
        });

        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        hands.onResults(onResults);
        handsRef.current = hands;
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to load MediaPipe:", error);
        setCameraError("Failed to load hand detection. Please refresh.");
      }
    };

    loadMediaPipe();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const onResults = useCallback((results: any) => {
    const canvas = canvasRef.current;
    const video = webcamRef.current?.video;
    if (!canvas || !video) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      setHandDetected(true);
      
      for (const landmarks of results.multiHandLandmarks) {
        // Draw connections
        if (window.drawConnectors && window.HAND_CONNECTIONS) {
          window.drawConnectors(ctx, landmarks, window.HAND_CONNECTIONS, {
            color: "#10B981",
            lineWidth: 3,
          });
        }
        
        // Draw landmarks
        if (window.drawLandmarks) {
          window.drawLandmarks(ctx, landmarks, {
            color: "#F97316",
            lineWidth: 2,
            radius: 4,
          });
        }

        // Detect gesture
        const gesture = detectGesture(landmarks);
        if (gesture) {
          const smoothedResult = gestureBufferRef.current.add(gesture);
          if (smoothedResult) {
            setCurrentSign(smoothedResult);
            setSaved(false);
          }
        }
      }
    } else {
      setHandDetected(false);
    }

    ctx.restore();
  }, []);

  // Process video frames
  useEffect(() => {
    if (!handsRef.current || isLoading) return;

    const processFrame = async () => {
      const video = webcamRef.current?.video;
      if (video && video.readyState >= 2) {
        try {
          await handsRef.current.send({ image: video });
        } catch (e) {
          // Ignore frame processing errors
        }
      }
      animationRef.current = requestAnimationFrame(processFrame);
    };

    animationRef.current = requestAnimationFrame(processFrame);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isLoading]);

  const handleSpeak = async () => {
    if (!currentSign) return;

    if (isPlaying) {
      speechService.stop();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      try {
        await speechService.speak({
          text: currentSign.sign,
          lang: language,
          rate: speed[0],
          volume: volume[0],
        });
      } finally {
        setIsPlaying(false);
      }
    }
  };

  const handleSave = async () => {
    if (!currentSign || isSaving) return;

    setIsSaving(true);
    try {
      await addTranslation({
        text: currentSign.sign,
        confidence: Math.round(currentSign.confidence),
        timestamp: new Date(),
        isFavorite: false,
        synced: false,
      });
      setSaved(true);
    } catch (error) {
      console.error("Failed to save translation:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setCurrentSign(null);
    gestureBufferRef.current.clear();
    setSaved(false);
  };

  const confidenceLevel = currentSign ? getConfidenceLevel(currentSign.confidence) : null;

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
        <Link to="/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${
              handDetected
                ? "bg-success/10 text-success"
                : "bg-muted text-muted-foreground"
            }`}
          >
            <Hand className="h-4 w-4" />
            {handDetected ? "Hand Detected" : "No Hand"}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings2 className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Camera Area */}
      <div className="relative flex-1">
        {isLoading ? (
          <div className="flex h-full items-center justify-center bg-muted">
            <div className="text-center">
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
              <p className="mt-4 text-muted-foreground">Loading hand detection...</p>
            </div>
          </div>
        ) : cameraError ? (
          <div className="flex h-full items-center justify-center bg-muted">
            <div className="text-center">
              <CameraOff className="mx-auto h-12 w-12 text-destructive" />
              <p className="mt-4 text-destructive">{cameraError}</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>
            </div>
          </div>
        ) : (
          <div className="camera-container relative h-full">
            <Webcam
              ref={webcamRef}
              className="h-full w-full object-cover"
              mirrored
              videoConstraints={{
                facingMode: "user",
                width: 1280,
                height: 720,
              }}
              onUserMediaError={() => setCameraError("Camera access denied")}
            />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 h-full w-full object-cover"
              style={{ transform: "scaleX(-1)" }}
            />
            
            {/* Hand detection indicator */}
            <AnimatePresence>
              {handDetected && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 pointer-events-none ring-4 ring-inset ring-success/30"
                />
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Output Panel */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: currentSign ? 0 : "50%" }}
        className="border-t border-border bg-card p-6"
      >
        {currentSign ? (
          <div className="space-y-4">
            {/* Translation Result */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-heading text-3xl font-bold">{currentSign.sign}</h2>
                <div className="mt-1 flex items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-medium ${
                      confidenceLevel === "high"
                        ? "bg-success/10 text-success"
                        : confidenceLevel === "medium"
                        ? "bg-warning/10 text-warning"
                        : "bg-destructive/10 text-destructive"
                    }`}
                  >
                    {Math.round(currentSign.confidence)}% confidence
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={saved ? "success" : "outline"}
                  size="icon"
                  onClick={handleSave}
                  disabled={isSaving || saved}
                >
                  {isSaving ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Save className="h-5 w-5" />
                  )}
                </Button>
                <Button variant="outline" size="icon" onClick={handleReset}>
                  <RotateCcw className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* TTS Controls */}
            <div className="flex items-center gap-4 rounded-lg border border-border bg-muted/50 p-4">
              <Button
                variant={isPlaying ? "accent" : "default"}
                size="icon"
                onClick={handleSpeak}
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5" />
                )}
              </Button>
              
              <div className="flex flex-1 items-center gap-4">
                <div className="flex items-center gap-2">
                  {volume[0] === 0 ? (
                    <VolumeX className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Volume2 className="h-4 w-4 text-muted-foreground" />
                  )}
                  <Slider
                    value={volume}
                    onValueChange={setVolume}
                    max={1}
                    step={0.1}
                    className="w-24"
                  />
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Speed: {speed[0]}x</span>
                  <Slider
                    value={speed}
                    onValueChange={setSpeed}
                    min={0.5}
                    max={2}
                    step={0.25}
                    className="w-24"
                  />
                </div>
              </div>

              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as "en-US" | "sw-KE")}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="en-US">English</option>
                <option value="sw-KE">Swahili</option>
              </select>
            </div>
          </div>
        ) : (
          <div className="text-center text-muted-foreground">
            <Camera className="mx-auto h-8 w-8 mb-2" />
            <p>Show your hand gestures to start translating</p>
          </div>
        )}
      </motion.div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            className="fixed right-0 top-0 h-full w-80 border-l border-border bg-card p-6 shadow-lg"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-heading text-lg font-semibold">Settings</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSettings(false)}
              >
                ×
              </Button>
            </div>
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium">Default Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as "en-US" | "sw-KE")}
                  className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2"
                >
                  <option value="en-US">English</option>
                  <option value="sw-KE">Swahili</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Speech Speed</label>
                <Slider
                  value={speed}
                  onValueChange={setSpeed}
                  min={0.5}
                  max={2}
                  step={0.25}
                  className="mt-2"
                />
                <p className="mt-1 text-sm text-muted-foreground">{speed[0]}x</p>
              </div>
              <div>
                <label className="text-sm font-medium">Volume</label>
                <Slider
                  value={volume}
                  onValueChange={setVolume}
                  max={1}
                  step={0.1}
                  className="mt-2"
                />
                <p className="mt-1 text-sm text-muted-foreground">
                  {Math.round(volume[0] * 100)}%
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
