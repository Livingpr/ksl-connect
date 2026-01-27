import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  MessageSquare, 
  Check, 
  RotateCcw, 
  Play,
  Pause,
  ChevronRight
} from 'lucide-react';
import type { BuiltSentence } from '@/lib/sentenceBuilder';

interface SentenceBuilderOverlayProps {
  isEnabled: boolean;
  currentGestures: string[];
  builtSentence: BuiltSentence | null;
  sentenceText: string;
  progressPercent: number;
  isBuildingPaused: boolean;
  isPlaying: boolean;
  onToggleEnabled: () => void;
  onCompleteSentence: () => void;
  onContinue: () => void;
  onSpeak: () => void;
  onReset: () => void;
}

export function SentenceBuilderOverlay({
  isEnabled,
  currentGestures,
  builtSentence,
  sentenceText,
  progressPercent,
  isBuildingPaused,
  isPlaying,
  onToggleEnabled,
  onCompleteSentence,
  onContinue,
  onSpeak,
  onReset,
}: SentenceBuilderOverlayProps) {
  const hasGestures = currentGestures.length > 0;
  
  return (
    <>
      {/* Sentence Mode Toggle - top center */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20">
        <Button
          variant={isEnabled ? "default" : "secondary"}
          size="sm"
          onClick={onToggleEnabled}
          className={`gap-1.5 rounded-full px-3 shadow-md backdrop-blur-sm ${
            isEnabled 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-card/90'
          }`}
        >
          <MessageSquare className="h-3.5 w-3.5" />
          {isEnabled ? 'Sentence Mode' : 'Word Mode'}
        </Button>
      </div>

      {/* Sentence Building Progress - when enabled and building */}
      <AnimatePresence>
        {isEnabled && hasGestures && !builtSentence && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-14 left-3 right-3 z-10"
          >
            <div className="rounded-lg border border-border bg-card/95 p-3 backdrop-blur-sm">
              {/* Gesture pills */}
              <div className="flex flex-wrap gap-1.5 mb-2">
                {currentGestures.map((gesture, idx) => (
                  <motion.span
                    key={`${gesture}-${idx}`}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                  >
                    {gesture.split(' / ')[0]}
                  </motion.span>
                ))}
                <span className="inline-flex items-center text-xs text-muted-foreground animate-pulse">
                  ...
                </span>
              </div>
              
              {/* Progress bar toward sentence completion */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Building sentence...</span>
                  <span>{Math.round(progressPercent)}%</span>
                </div>
                <Progress value={progressPercent} className="h-1.5" />
              </div>
              
              {/* Manual complete button */}
              {currentGestures.length >= 2 && (
                <div className="mt-2 flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onCompleteSentence}
                    className="h-7 text-xs gap-1"
                  >
                    Complete now
                    <Check className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Built Sentence Display - replaces the regular translation output */}
      <AnimatePresence>
        {isEnabled && builtSentence && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute inset-x-0 bottom-0 p-3 pb-[calc(0.75rem+64px)] md:pb-3 z-20"
          >
            <div className="rounded-lg border-2 border-primary bg-card/95 p-4 backdrop-blur-sm shadow-lg">
              {/* Gesture sequence */}
              <div className="flex flex-wrap gap-1 mb-2">
                {builtSentence.gestures.map((gesture, idx) => (
                  <span
                    key={`${gesture}-${idx}`}
                    className="inline-flex items-center text-xs text-muted-foreground"
                  >
                    {gesture.split(' / ')[0]}
                    {idx < builtSentence.gestures.length - 1 && (
                      <ChevronRight className="h-3 w-3 mx-0.5" />
                    )}
                  </span>
                ))}
              </div>
              
              {/* Translated sentence */}
              <h2 className="font-heading text-xl font-bold text-foreground mb-1">
                {sentenceText}
              </h2>
              
              {/* Confidence */}
              <div className="flex items-center gap-2 mb-3">
                <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                  {builtSentence.avgConfidence}% avg
                </span>
                <span className="text-xs text-muted-foreground">
                  {builtSentence.gestures.length} signs
                </span>
              </div>
              
              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button
                  variant={isPlaying ? "accent" : "default"}
                  size="sm"
                  onClick={onSpeak}
                  className="gap-1.5"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="h-3.5 w-3.5" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="h-3.5 w-3.5" />
                      Speak
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onContinue}
                  className="gap-1.5"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                  New Sentence
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 ml-auto"
                  onClick={onReset}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
