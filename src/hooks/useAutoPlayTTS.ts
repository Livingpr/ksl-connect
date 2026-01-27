import { useEffect, useRef, useCallback } from 'react';
import { speechService } from '@/lib/tts';
import { useAuth } from '@/hooks/useAuth';

interface UseAutoPlayTTSOptions {
  enabled?: boolean;
}

export function useAutoPlayTTS(options: UseAutoPlayTTSOptions = {}) {
  const { preferences } = useAuth();
  const lastSpokenRef = useRef<string | null>(null);
  const isPlayingRef = useRef(false);

  // Determine if auto-play is enabled (from preferences or override)
  const autoPlayEnabled = options.enabled ?? preferences?.autoPlayTts ?? false;
  const speechRate = preferences?.speechRate ?? 1;
  const volume = preferences?.volume ?? 1;
  const outputLanguage = preferences?.outputLanguage ?? 'english';

  // Map output language to TTS language code
  const getTTSLanguage = useCallback((lang: 'english' | 'swahili'): 'en-US' | 'sw-KE' => {
    return lang === 'swahili' ? 'sw-KE' : 'en-US';
  }, []);

  // Speak a translation automatically
  const speakTranslation = useCallback(async (text: string) => {
    if (!autoPlayEnabled) return;
    if (isPlayingRef.current) return;
    if (lastSpokenRef.current === text) return;

    try {
      isPlayingRef.current = true;
      lastSpokenRef.current = text;

      await speechService.speak({
        text,
        lang: getTTSLanguage(outputLanguage),
        rate: speechRate,
        volume,
      });
    } catch (error) {
      console.error('Auto-play TTS error:', error);
    } finally {
      isPlayingRef.current = false;
    }
  }, [autoPlayEnabled, outputLanguage, speechRate, volume, getTTSLanguage]);

  // Reset the last spoken text (e.g., when user resets translation)
  const reset = useCallback(() => {
    lastSpokenRef.current = null;
    speechService.stop();
    isPlayingRef.current = false;
  }, []);

  // Stop any ongoing speech
  const stop = useCallback(() => {
    speechService.stop();
    isPlayingRef.current = false;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      speechService.stop();
    };
  }, []);

  return {
    speakTranslation,
    reset,
    stop,
    autoPlayEnabled,
    isPlaying: () => isPlayingRef.current,
    language: outputLanguage,
    speechRate,
    volume,
  };
}
