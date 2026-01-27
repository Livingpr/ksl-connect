import { useRef, useState, useCallback, useEffect } from 'react';
import { SentenceBuilder, BuiltSentence } from '@/lib/sentenceBuilder';
import { useAuth } from '@/hooks/useAuth';

export interface SentenceModeState {
  isEnabled: boolean;
  currentGestures: string[];
  builtSentence: BuiltSentence | null;
  isBuildingPaused: boolean;
  progressPercent: number; // 0-100, shows progress toward sentence boundary
}

export function useSentenceBuilder() {
  const { preferences } = useAuth();
  const builderRef = useRef(new SentenceBuilder());
  const boundaryCheckRef = useRef<number | null>(null);
  
  const [isEnabled, setIsEnabled] = useState(false);
  const [currentGestures, setCurrentGestures] = useState<string[]>([]);
  const [builtSentence, setBuiltSentence] = useState<BuiltSentence | null>(null);
  const [progressPercent, setProgressPercent] = useState(0);
  const [isBuildingPaused, setIsBuildingPaused] = useState(false);
  
  const SENTENCE_PAUSE_MS = 2500; // Must match SentenceBuilder
  
  // Check for sentence boundary periodically
  useEffect(() => {
    if (!isEnabled || currentGestures.length === 0) {
      setProgressPercent(0);
      return;
    }
    
    const checkBoundary = () => {
      const timeSince = builderRef.current.getTimeSinceLastGesture();
      
      if (timeSince > 0) {
        const progress = Math.min(100, (timeSince / SENTENCE_PAUSE_MS) * 100);
        setProgressPercent(progress);
        
        if (progress >= 100 && !builtSentence) {
          // Sentence boundary reached - build the sentence
          const sentence = builderRef.current.build();
          if (sentence) {
            setBuiltSentence(sentence);
            setIsBuildingPaused(true);
          }
        }
      }
    };
    
    boundaryCheckRef.current = window.setInterval(checkBoundary, 100);
    
    return () => {
      if (boundaryCheckRef.current) {
        clearInterval(boundaryCheckRef.current);
      }
    };
  }, [isEnabled, currentGestures.length, builtSentence]);
  
  // Add a detected sign to the sentence builder
  const addSign = useCallback((sign: string, confidence: number): {
    added: boolean;
    sentence: BuiltSentence | null;
  } => {
    if (!isEnabled) {
      return { added: false, sentence: null };
    }
    
    // If we have a completed sentence, clear before adding new gestures
    if (builtSentence) {
      builderRef.current.clear();
      setBuiltSentence(null);
      setIsBuildingPaused(false);
    }
    
    const result = builderRef.current.add(sign, confidence);
    setCurrentGestures(result.currentGestures);
    setProgressPercent(0); // Reset progress on new gesture
    
    // Check if sentence was auto-completed due to max gestures
    if (result.sentenceReady) {
      const sentence = builderRef.current.build();
      if (sentence) {
        setBuiltSentence(sentence);
        setIsBuildingPaused(true);
        return { added: result.added, sentence };
      }
    }
    
    return { added: result.added, sentence: null };
  }, [isEnabled, builtSentence]);
  
  // Get the translated sentence text based on user's language preference
  const getSentenceText = useCallback((sentence: BuiltSentence | null): string => {
    if (!sentence) return '';
    
    const lang = preferences?.outputLanguage || 'english';
    return lang === 'swahili' ? sentence.swahili : sentence.english;
  }, [preferences?.outputLanguage]);
  
  // Manually complete the current sentence
  const completeSentence = useCallback((): BuiltSentence | null => {
    const sentence = builderRef.current.build();
    if (sentence) {
      setBuiltSentence(sentence);
      setIsBuildingPaused(true);
      return sentence;
    }
    return null;
  }, []);
  
  // Clear and reset everything
  const reset = useCallback(() => {
    builderRef.current.clear();
    setCurrentGestures([]);
    setBuiltSentence(null);
    setIsBuildingPaused(false);
    setProgressPercent(0);
  }, []);
  
  // Toggle sentence mode
  const toggleEnabled = useCallback(() => {
    setIsEnabled(prev => {
      if (prev) {
        // Turning off - clear everything
        builderRef.current.clear();
        setCurrentGestures([]);
        setBuiltSentence(null);
        setIsBuildingPaused(false);
        setProgressPercent(0);
      }
      return !prev;
    });
  }, []);
  
  // Continue building after viewing a sentence
  const continueBuilding = useCallback(() => {
    builderRef.current.clear();
    setBuiltSentence(null);
    setCurrentGestures([]);
    setIsBuildingPaused(false);
    setProgressPercent(0);
  }, []);
  
  return {
    // State
    isEnabled,
    currentGestures,
    builtSentence,
    isBuildingPaused,
    progressPercent,
    gestureCount: currentGestures.length,
    
    // Actions
    addSign,
    getSentenceText,
    completeSentence,
    reset,
    toggleEnabled,
    continueBuilding,
  };
}
