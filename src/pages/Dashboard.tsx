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
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* Header */}
      <header className="shrink-0 border-b border-border bg-card/80 backdrop-blur-lg">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary">
              <Hand className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-heading text-lg font-bold">KSL Translator</span>
            <PremiumBadge size="sm" />
          </div>
          <div className="flex items-center gap-2">
            <PremiumButton />
            <Link to="/history">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <History className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/profile">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content - Camera Hero */}
      <main className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Camera Section - 70% on desktop */}
        <div className="relative flex-1 lg:flex-[7]">
          {cameraLoading ? (
            <div className="flex h-full items-center justify-center bg-muted">
              <div className="text-center">
                <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
                <p className="mt-3 text-sm text-muted-foreground">Loading camera...</p>
              </div>
            </div>
          ) : cameraError ? (
            <div className="flex h-full items-center justify-center bg-muted">
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

              {/* Status badge */}
              <div className="absolute left-4 top-4">
                <div
                  className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium backdrop-blur-sm ${
                    handDetected
                      ? isTwoHanded
                        ? "bg-primary/20 text-primary"
                        : "bg-success/20 text-success"
                      : "bg-muted/80 text-muted-foreground"
                  }`}
                >
                  <Hand className="h-4 w-4" />
                  {handDetected 
                    ? isTwoHanded 
                      ? "2 Hands Detected" 
                      : "Show Your Hand" 
                    : "Show Your Hand"}
                  {isPremium && isTwoHanded && (
                    <span className="text-xs opacity-70">Premium</span>
                  )}
                </div>
              </div>

              {/* Translation Output - Overlay at bottom */}
              <div className="absolute inset-x-0 bottom-0 p-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: currentSign ? 1 : 0.7, y: 0 }}
                  className="rounded-xl border border-border bg-card/95 p-4 backdrop-blur-sm"
                >
                  {currentSign ? (
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h2 className="truncate font-heading text-2xl font-bold">
                            {currentSign.sign}
                          </h2>
                          {lastSaved === currentSign.sign && (
                            <Check className="h-4 w-4 shrink-0 text-success" />
                          )}
                        </div>
                        <div className="mt-1 flex items-center gap-2">
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
                            <span className="text-xs text-muted-foreground">Auto-saved</span>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button
                          variant={isPlaying ? "accent" : "outline"}
                          size="icon"
                          className="h-10 w-10"
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
                          className="h-10 w-10"
                          onClick={() => setVolume((v) => (v === 0 ? 1 : 0))}
                        >
                          {volume === 0 ? (
                            <VolumeX className="h-4 w-4" />
                          ) : (
                            <Volume2 className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-10 w-10"
                          onClick={handleReset}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground">
                      Show your hand gestures to start translating
                    </p>
                  )}
                </motion.div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Stats and Recent */}
        <aside className="shrink-0 border-t border-border bg-card lg:w-80 lg:border-l lg:border-t-0">
          <div className="flex h-full flex-col p-4">
            {/* Welcome */}
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">Welcome back,</p>
              <p className="font-heading font-semibold">
                {user?.displayName?.split(" ")[0] || "there"}!
              </p>
            </div>

            {/* Stats Grid */}
            <div className="mb-4 grid grid-cols-3 gap-2 lg:grid-cols-1">
              {statCards.map((stat) => (
                <div
                  key={stat.label}
                  className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 p-3"
                >
                  <div className={`rounded-lg ${stat.bgColor} p-2`}>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-heading text-lg font-bold leading-none">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Translations */}
            <div className="min-h-0 flex-1">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-medium">Recent</h3>
                <Link to="/history">
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                    View All
                    <ChevronRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              </div>

              {recentTranslations.length > 0 ? (
                <div className="space-y-2">
                  {recentTranslations.map((translation) => (
                    <div
                      key={translation.id}
                      className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{translation.text}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(translation.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                          translation.confidence >= 80
                            ? "bg-success/10 text-success"
                            : translation.confidence >= 60
                            ? "bg-warning/10 text-warning"
                            : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        {translation.confidence}%
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border p-4 text-center">
                  <Hand className="mx-auto h-8 w-8 text-muted-foreground/50" />
                  <p className="mt-2 text-xs text-muted-foreground">No translations yet</p>
                </div>
              )}
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
