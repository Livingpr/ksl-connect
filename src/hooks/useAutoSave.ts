import { useCallback, useRef, useState } from "react";
import { addTranslation } from "@/lib/db";
import { toast } from "sonner";

interface SignResult {
  sign: string;
  confidence: number;
}

const DEBOUNCE_MS = 2000;
const MIN_CONFIDENCE = 60;

export function useAutoSave() {
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stableSignRef = useRef<string | null>(null);
  const stableCountRef = useRef(0);

  const autoSave = useCallback((translation: SignResult) => {
    // Track stable sign detection (same sign for consecutive frames)
    if (translation.sign === stableSignRef.current) {
      stableCountRef.current += 1;
    } else {
      stableSignRef.current = translation.sign;
      stableCountRef.current = 1;
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Only save if confidence is high enough and sign is stable
    if (translation.confidence < MIN_CONFIDENCE) {
      return;
    }

    // Already saved this sign
    if (translation.sign === lastSaved) {
      return;
    }

    // Wait for stability (at least 3 consecutive detections) then debounce
    if (stableCountRef.current >= 3) {
      timeoutRef.current = setTimeout(async () => {
        if (translation.sign === lastSaved) return;

        setIsSaving(true);
        try {
          await addTranslation({
            text: translation.sign,
            confidence: Math.round(translation.confidence),
            timestamp: new Date(),
            isFavorite: false,
            synced: false,
            autoSaved: true,
          });
          setLastSaved(translation.sign);
          toast.success("Saved to history", { duration: 2000 });
        } catch (error) {
          console.error("Auto-save failed:", error);
        } finally {
          setIsSaving(false);
        }
      }, DEBOUNCE_MS);
    }
  }, [lastSaved]);

  const reset = useCallback(() => {
    setLastSaved(null);
    stableSignRef.current = null;
    stableCountRef.current = 0;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  return { autoSave, reset, isSaving, lastSaved };
}
