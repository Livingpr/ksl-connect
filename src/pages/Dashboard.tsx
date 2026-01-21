import { useEffect, useState, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Webcam from "react-webcam";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { usePremium } from "@/hooks/usePremium";
import { useAutoSave } from "@/hooks/useAutoSave";
import { getStats, getTranslations } from "@/lib/db";
import { predictSign, loadModel, getModelStatus } from "@/lib/mlModel";
import { speechService } from "@/lib/tts";
import { GestureBuffer } from "@/lib/signMapping";
import { detectTwoHandedSign, TwoHandedGestureBuffer } from "@/lib/twoHandedDetection";
import { PremiumButton } from "@/components/premium/PremiumButton";
import { PremiumBadge } from "@/components/premium/PremiumBadge";
import { MobileNav } from "@/components/layout/MobileNav";
import { TwoHandOverlay } from "@/components/camera/TwoHandOverlay";
import type { Translation, TranslationStats } from "@/types";
import { getConfidenceLevel } from "@/types";
import {
  History,
  Settings,
  LogOut,
  Hand,
  Target,
  Flame,
  Clock,
  ChevronRight,
  Loader2,
  CameraOff,
  Play,
  Pause,
  Volume2,
  VolumeX,
  RotateCcw,
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

export default function Dashboard() {
  const { user, logout, isAuthenticated, isLoading: authLoading } = useAuth();
  const { isPremium, maxHands } = usePremium();
  const { autoSave, reset: resetAutoSave, lastSaved } = useAutoSave();
  const navigate = useNavigate();

  const [stats, setStats] = useState<TranslationStats>({
    totalSigns: 0,
    avgAccuracy: 0,
    streakDays: 7,
    todayCount: 0,
  });
  const [recentTranslations, setRecentTranslations] = useState<Translation[]>([]);

  // Camera state
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraLoading, setCameraLoading] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [handDetected, setHandDetected] = useState(false);
  const [currentSign, setCurrentSign] = useState<{ sign: string; confidence: number } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isTwoHanded, setIsTwoHanded] = useState(false);

  const gestureBufferRef = useRef(new GestureBuffer());
  const twoHandedBufferRef = useRef(new TwoHandedGestureBuffer());
  const handsRef = useRef<any>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/auth");
    }
  }, [isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    const loadData = async () => {
      const dbStats = await getStats();
      setStats({
        ...dbStats,
        streakDays: 7,
      });
      const recent = await getTranslations(3);
      setRecentTranslations(recent);
    };
    loadData();
  }, [lastSaved]);

  // Load MediaPipe
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
        setCameraLoading(false);
      } catch (error) {
        console.error("Failed to load MediaPipe:", error);
        setCameraError("Failed to load hand detection.");
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

  useEffect(() => {
    if (!handsRef.current || cameraLoading) return;

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
  }, [cameraLoading]);

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
          lang: "en-US",
          rate: 1,
          volume,
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

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const confidenceLevel = currentSign ? getConfidenceLevel(currentSign.confidence) : null;

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Signs",
      value: stats.totalSigns,
      icon: Hand,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Accuracy",
      value: `${stats.avgAccuracy}%`,
      icon: Target,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      label: "Streak",
      value: `${stats.streakDays}d`,
      icon: Flame,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
  ];

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-background">
      {/* Header - Compact 48px */}
      <header className="shrink-0 border-b border-border bg-card/80 backdrop-blur-lg safe-area-top">
        <div className="flex h-12 items-center justify-between px-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-primary">
              <Hand className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="font-heading text-base font-bold">KSL</span>
            <PremiumBadge size="sm" />
          </div>
          <div className="flex items-center gap-1">
            <PremiumButton />
            <Link to="/history">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <History className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/profile">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content - Camera fills viewport */}
      <main className="relative flex-1 min-h-0">
        {cameraLoading ? (
          <div className="flex h-full items-center justify-center bg-muted">
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
              <p className="mt-2 text-sm text-muted-foreground">Loading camera...</p>
            </div>
          </div>
        ) : cameraError ? (
          <div className="flex h-full items-center justify-center bg-muted">
            <div className="text-center px-4">
              <CameraOff className="mx-auto h-8 w-8 text-destructive" />
              <p className="mt-2 text-sm text-destructive">{cameraError}</p>
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
                width: { ideal: 720 },
                height: { ideal: 1280 },
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

            {/* Stats button - top right */}
            <Link to="/stats" className="absolute top-3 right-3 z-20">
              <Button
                variant="secondary"
                size="icon"
                className="h-9 w-9 rounded-full bg-card/90 backdrop-blur-sm shadow-md"
              >
                <BarChart3 className="h-4 w-4" />
              </Button>
            </Link>

            {/* Status badge - top left */}
            <div className="absolute left-3 top-3">
              <div
                className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium backdrop-blur-sm ${
                  handDetected
                    ? isTwoHanded
                      ? "bg-primary/20 text-primary"
                      : "bg-success/20 text-success"
                    : "bg-muted/80 text-muted-foreground"
                }`}
              >
                <Hand className="h-3.5 w-3.5" />
                {handDetected 
                  ? isTwoHanded 
                    ? "2 Hands" 
                    : "Hand Detected" 
                  : "Show Hand"}
              </div>
            </div>

            {/* Translation Output - Overlay at bottom */}
            <div className="absolute inset-x-0 bottom-0 p-3 pb-[calc(0.75rem+64px)] md:pb-3">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: currentSign ? 1 : 0.8, y: 0 }}
                className="rounded-lg border border-border bg-card/95 p-3 backdrop-blur-sm"
              >
                {currentSign ? (
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h2 className="truncate font-heading text-xl font-bold">
                          {currentSign.sign}
                        </h2>
                        {lastSaved === currentSign.sign && (
                          <Check className="h-4 w-4 shrink-0 text-success" />
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
                    <div className="flex shrink-0 gap-1.5">
                      <Button
                        variant={isPlaying ? "accent" : "outline"}
                        size="icon"
                        className="h-9 w-9"
                        onClick={handleSpeak}
                      >
                        {isPlaying ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9"
                        onClick={handleReset}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 py-1 text-muted-foreground">
                    <Hand className="h-5 w-5" />
                    <p className="text-sm">Show hand gestures to translate</p>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        )}
      </main>

      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  );
}
