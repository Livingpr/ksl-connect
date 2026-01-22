import { useRef, useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import Webcam from "react-webcam";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useAuth } from "@/hooks/useAuth";
import { usePremium } from "@/hooks/usePremium";
import { useAutoSave } from "@/hooks/useAutoSave";
import { speechService } from "@/lib/tts";
import { GestureBuffer } from "@/lib/signMapping";
import { predictSign, loadModel } from "@/lib/mlModel";
import { detectTwoHandedSign, TwoHandedGestureBuffer } from "@/lib/twoHandedDetection";
import { getConfidenceLevel } from "@/types";
import { PremiumButton } from "@/components/premium/PremiumButton";
import { MobileNav } from "@/components/layout/MobileNav";
import { TwoHandOverlay } from "@/components/camera/TwoHandOverlay";
import { HandPositionGuide } from "@/components/camera/HandPositionGuide";
import {
  ArrowLeft,
  Camera,
  CameraOff,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Hand,
  Loader2,
  Settings2,
  Check,
  BarChart3,
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [handDetected, setHandDetected] = useState(false);
  const [currentSign, setCurrentSign] = useState<{ sign: string; confidence: number } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState([1]);
  const [speed, setSpeed] = useState([1]);
  const [language, setLanguage] = useState<"en-US" | "sw-KE">("en-US");
  const [showSettings, setShowSettings] = useState(false);

  const gestureBufferRef = useRef(new GestureBuffer());
  const twoHandedBufferRef = useRef(new TwoHandedGestureBuffer());
  const handsRef = useRef<any>(null);
  const animationRef = useRef<number | null>(null);
  const [isTwoHanded, setIsTwoHanded] = useState(false);

  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { isPremium, maxHands } = usePremium();
  const { autoSave, reset: resetAutoSave, lastSaved } = useAutoSave();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/auth");
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Load MediaPipe and ML Model
  useEffect(() => {
    const loadMediaPipe = async () => {
      try {
        const loadScript = (src: string) => {
          return new Promise<void>((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) {
              resolve();
              return;
            }
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

        await loadModel();

        const hands = new window.Hands({
          locateFile: (file: string) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
          },
        });

        hands.setOptions({
          maxNumHands: maxHands,
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
  }, [maxHands]);

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
      const numHands = results.multiHandLandmarks.length;

      // Draw landmarks for all detected hands
      for (let i = 0; i < numHands; i++) {
        const landmarks = results.multiHandLandmarks[i];
        const handColor = i === 0 ? "#10B981" : "#3B82F6"; // Green for first, Blue for second
        
        if (window.drawConnectors && window.HAND_CONNECTIONS) {
          window.drawConnectors(ctx, landmarks, window.HAND_CONNECTIONS, {
            color: handColor,
            lineWidth: 3,
          });
        }

        if (window.drawLandmarks) {
          window.drawLandmarks(ctx, landmarks, {
            color: "#F97316",
            lineWidth: 2,
            radius: 4,
          });
        }
      }

      // Two-handed detection for premium users
      if (isPremium && numHands === 2) {
        setIsTwoHanded(true);
        const leftHand = results.multiHandLandmarks[0];
        const rightHand = results.multiHandLandmarks[1];
        
        const twoHandedResult = detectTwoHandedSign(leftHand, rightHand);
        if (twoHandedResult) {
          const smoothedResult = twoHandedBufferRef.current.add(twoHandedResult);
          if (smoothedResult) {
            setCurrentSign({ sign: smoothedResult.sign, confidence: smoothedResult.confidence });
            autoSave({ sign: smoothedResult.sign, confidence: smoothedResult.confidence });
          }
        }
      } else {
        // Single-hand detection
        setIsTwoHanded(false);
        const landmarks = results.multiHandLandmarks[0];
        
        predictSign(landmarks).then((gesture) => {
          if (gesture) {
            const smoothedResult = gestureBufferRef.current.add(gesture);
            if (smoothedResult) {
              setCurrentSign(smoothedResult);
              autoSave(smoothedResult);
            }
          }
        });
      }
    } else {
      setHandDetected(false);
      setIsTwoHanded(false);
    }

    ctx.restore();
  }, [autoSave, isPremium]);

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

  const handleReset = () => {
    setCurrentSign(null);
    gestureBufferRef.current.clear();
    resetAutoSave();
  };

  const confidenceLevel = currentSign ? getConfidenceLevel(currentSign.confidence) : null;

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-background">
      {/* Header - Compact 44px */}
      <header className="shrink-0 flex items-center justify-between border-b border-border bg-card px-3 py-2 safe-area-top">
        <Link to="/dashboard">
          <Button variant="ghost" size="sm" className="h-8 px-2">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Button>
        </Link>
        <div className="flex items-center gap-1.5">
          <div
            className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${
              handDetected
                ? isTwoHanded
                  ? "bg-primary/10 text-primary"
                  : "bg-success/10 text-success"
                : "bg-muted text-muted-foreground"
            }`}
          >
            <Hand className="h-3.5 w-3.5" />
            {handDetected 
              ? isTwoHanded 
                ? "2 Hands" 
                : "Detected" 
              : "No Hand"}
          </div>
          <PremiumButton />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings2 className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Camera Area - Fills remaining space */}
      <div ref={containerRef} className="relative min-h-0 flex-1">
        {isLoading ? (
          <div className="flex h-full items-center justify-center bg-muted">
            <div className="text-center">
              <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
              <p className="mt-3 text-sm text-muted-foreground">Loading...</p>
            </div>
          </div>
        ) : cameraError ? (
          <div className="flex h-full items-center justify-center bg-muted px-4">
            <div className="text-center">
              <CameraOff className="mx-auto h-10 w-10 text-destructive" />
              <p className="mt-3 text-sm text-destructive">{cameraError}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
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
                width: { ideal: 1280 },
                height: { ideal: 720 },
                aspectRatio: 16 / 9,
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
                  className="absolute inset-0 pointer-events-none ring-2 ring-inset ring-success/40"
                />
              )}
            </AnimatePresence>

            {/* Two-Hand Overlay */}
            <TwoHandOverlay
              isTwoHanded={isTwoHanded}
              isPremium={isPremium}
              handDetected={handDetected}
            />

            {/* Hand Position Guide */}
            <HandPositionGuide handDetected={handDetected} />

            {/* Stats button */}
            <Link to="/stats" className="absolute top-3 right-3 z-20">
              <Button
                variant="secondary"
                size="icon"
                className="h-9 w-9 rounded-full bg-card/90 backdrop-blur-sm shadow-md"
              >
                <BarChart3 className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Output Panel - Fixed at bottom, above nav */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        className="shrink-0 border-t border-border bg-card p-3 mb-16 md:mb-0"
      >
        {currentSign ? (
          <div className="space-y-2">
            {/* Translation Result */}
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-heading text-xl font-bold">{currentSign.sign}</h2>
                  {lastSaved === currentSign.sign && (
                    <Check className="h-4 w-4 text-success" />
                  )}
                </div>
                <div className="mt-0.5 flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      confidenceLevel === "high"
                        ? "bg-success/10 text-success"
                        : confidenceLevel === "medium"
                        ? "bg-warning/10 text-warning"
                        : "bg-destructive/10 text-destructive"
                    }`}
                  >
                    {Math.round(currentSign.confidence)}%
                  </span>
                  {lastSaved === currentSign.sign && (
                    <span className="text-xs text-muted-foreground">Saved</span>
                  )}
                </div>
              </div>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleReset}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>

            {/* TTS Controls - Compact */}
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 p-2">
              <Button
                variant={isPlaying ? "accent" : "default"}
                size="icon"
                className="h-8 w-8"
                onClick={handleSpeak}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>

              <div className="flex flex-1 items-center gap-3">
                <div className="flex items-center gap-1.5">
                  {volume[0] === 0 ? (
                    <VolumeX className="h-3.5 w-3.5 text-muted-foreground" />
                  ) : (
                    <Volume2 className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                  <Slider
                    value={volume}
                    onValueChange={setVolume}
                    max={1}
                    step={0.1}
                    className="w-16"
                  />
                </div>

                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span>{speed[0]}x</span>
                  <Slider
                    value={speed}
                    onValueChange={setSpeed}
                    min={0.5}
                    max={2}
                    step={0.25}
                    className="w-14"
                  />
                </div>
              </div>

              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as "en-US" | "sw-KE")}
                className="rounded border border-border bg-background px-1.5 py-0.5 text-xs"
              >
                <option value="en-US">EN</option>
                <option value="sw-KE">SW</option>
              </select>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 py-1 text-muted-foreground">
            <Camera className="h-5 w-5" />
            <p className="text-sm">Show gestures to translate</p>
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
            className="fixed right-0 top-0 h-full w-64 border-l border-border bg-card p-4 shadow-lg z-50 safe-area-top"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-base font-semibold">Settings</h3>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowSettings(false)}>
                ×
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium">Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as "en-US" | "sw-KE")}
                  className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                >
                  <option value="en-US">English</option>
                  <option value="sw-KE">Swahili</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium">Speed: {speed[0]}x</label>
                <Slider
                  value={speed}
                  onValueChange={setSpeed}
                  min={0.5}
                  max={2}
                  step={0.25}
                  className="mt-2"
                />
              </div>
              <div>
                <label className="text-xs font-medium">Volume</label>
                <Slider
                  value={volume}
                  onValueChange={setVolume}
                  max={1}
                  step={0.1}
                  className="mt-2"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <MobileNav />
    </div>
  );
}
