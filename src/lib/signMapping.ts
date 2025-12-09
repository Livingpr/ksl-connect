// Dummy sign mapping for MVP - maps hand poses to text
// In production, this would be replaced with actual ML model inference

export interface HandLandmarks {
  landmarks: Array<{ x: number; y: number; z: number }>;
}

// Simple gesture detection based on finger positions
export function detectGesture(landmarks: HandLandmarks['landmarks']): { sign: string; confidence: number } | null {
  if (!landmarks || landmarks.length < 21) return null;

  // Landmark indices
  const WRIST = 0;
  const THUMB_TIP = 4;
  const INDEX_TIP = 8;
  const MIDDLE_TIP = 12;
  const RING_TIP = 16;
  const PINKY_TIP = 20;
  const INDEX_MCP = 5;
  const MIDDLE_MCP = 9;
  const RING_MCP = 13;
  const PINKY_MCP = 17;

  // Check if fingers are extended (tip higher than MCP joint)
  const isThumbExtended = landmarks[THUMB_TIP].x < landmarks[WRIST].x;
  const isIndexExtended = landmarks[INDEX_TIP].y < landmarks[INDEX_MCP].y;
  const isMiddleExtended = landmarks[MIDDLE_TIP].y < landmarks[MIDDLE_MCP].y;
  const isRingExtended = landmarks[RING_TIP].y < landmarks[RING_MCP].y;
  const isPinkyExtended = landmarks[PINKY_TIP].y < landmarks[PINKY_MCP].y;

  // Simple gesture recognition patterns
  const extendedCount = [isIndexExtended, isMiddleExtended, isRingExtended, isPinkyExtended].filter(Boolean).length;

  // All fingers closed = "A" or fist
  if (!isIndexExtended && !isMiddleExtended && !isRingExtended && !isPinkyExtended) {
    return { sign: "A", confidence: 75 + Math.random() * 15 };
  }

  // Only index extended = pointing / "1"
  if (isIndexExtended && !isMiddleExtended && !isRingExtended && !isPinkyExtended) {
    return { sign: "ONE / POINT", confidence: 80 + Math.random() * 15 };
  }

  // Index and middle extended = "V" / peace / "2"
  if (isIndexExtended && isMiddleExtended && !isRingExtended && !isPinkyExtended) {
    return { sign: "TWO / PEACE", confidence: 85 + Math.random() * 10 };
  }

  // All fingers extended = "5" / stop
  if (isIndexExtended && isMiddleExtended && isRingExtended && isPinkyExtended) {
    return { sign: "FIVE / STOP", confidence: 88 + Math.random() * 10 };
  }

  // Thumb extended with closed fist = thumbs up / "GOOD"
  if (isThumbExtended && !isIndexExtended && !isMiddleExtended) {
    return { sign: "GOOD / YES", confidence: 78 + Math.random() * 15 };
  }

  // Index, middle, ring extended = "3"
  if (isIndexExtended && isMiddleExtended && isRingExtended && !isPinkyExtended) {
    return { sign: "THREE", confidence: 82 + Math.random() * 12 };
  }

  // Index, middle, ring, pinky extended (no thumb visible) = "4"
  if (extendedCount === 4) {
    return { sign: "FOUR", confidence: 80 + Math.random() * 12 };
  }

  // Pinky only = "I" in some sign languages
  if (!isIndexExtended && !isMiddleExtended && !isRingExtended && isPinkyExtended) {
    return { sign: "I / SMALL", confidence: 70 + Math.random() * 15 };
  }

  // Default - hand detected but gesture unclear
  return { sign: "HELLO", confidence: 60 + Math.random() * 15 };
}

// Smooth results over multiple frames to prevent jitter
export class GestureBuffer {
  private buffer: Array<{ sign: string; confidence: number }> = [];
  private bufferSize = 5;

  add(result: { sign: string; confidence: number }): { sign: string; confidence: number } | null {
    this.buffer.push(result);
    if (this.buffer.length > this.bufferSize) {
      this.buffer.shift();
    }

    if (this.buffer.length < 3) return null;

    // Find most common sign
    const signCounts = new Map<string, { count: number; totalConfidence: number }>();
    for (const item of this.buffer) {
      const existing = signCounts.get(item.sign) || { count: 0, totalConfidence: 0 };
      signCounts.set(item.sign, {
        count: existing.count + 1,
        totalConfidence: existing.totalConfidence + item.confidence,
      });
    }

    let maxSign = "";
    let maxData = { count: 0, totalConfidence: 0 };
    for (const [sign, data] of signCounts) {
      if (data.count > maxData.count) {
        maxSign = sign;
        maxData = data;
      }
    }

    // Only return if sign appears in majority of frames
    if (maxData.count >= Math.ceil(this.buffer.length / 2)) {
      return {
        sign: maxSign,
        confidence: Math.round(maxData.totalConfidence / maxData.count),
      };
    }

    return null;
  }

  clear(): void {
    this.buffer = [];
  }
}
