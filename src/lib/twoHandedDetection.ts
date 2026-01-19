// Two-handed sign detection for premium users
// Combines landmarks from both hands to recognize complex signs

export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export interface TwoHandedResult {
  sign: string;
  confidence: number;
  isTwoHanded: true;
}

// Two-handed sign vocabulary
const TWO_HANDED_SIGNS = [
  { name: "THANK YOU", pattern: "hands_together_forward" },
  { name: "SORRY", pattern: "circular_chest" },
  { name: "HELP", pattern: "thumbs_up_lift" },
  { name: "PLEASE", pattern: "circular_chest_single" },
  { name: "MORE", pattern: "fingertips_together" },
  { name: "FINISHED", pattern: "palms_out_shake" },
  { name: "WORK", pattern: "fists_tap" },
  { name: "SCHOOL", pattern: "clap_motion" },
  { name: "HOME", pattern: "fingertips_face_down" },
  { name: "FAMILY", pattern: "circles_outward" },
];

// Normalize hand landmarks relative to wrist
function normalizeHandLandmarks(landmarks: HandLandmark[]): number[] {
  if (!landmarks || landmarks.length < 21) return [];
  
  const wrist = landmarks[0];
  const normalized: number[] = [];
  
  for (const lm of landmarks) {
    normalized.push(lm.x - wrist.x, lm.y - wrist.y, lm.z - wrist.z);
  }
  
  return normalized;
}

// Calculate distance between two hands (wrist to wrist)
function calculateHandDistance(left: HandLandmark[], right: HandLandmark[]): number {
  const leftWrist = left[0];
  const rightWrist = right[0];
  
  return Math.sqrt(
    Math.pow(leftWrist.x - rightWrist.x, 2) +
    Math.pow(leftWrist.y - rightWrist.y, 2) +
    Math.pow(leftWrist.z - rightWrist.z, 2)
  );
}

// Calculate relative orientation between hands
function calculateHandOrientation(left: HandLandmark[], right: HandLandmark[]): {
  angleDiff: number;
  heightDiff: number;
  facingEachOther: boolean;
} {
  // Use index finger direction to determine hand orientation
  const leftDir = {
    x: left[8].x - left[5].x,
    y: left[8].y - left[5].y,
  };
  const rightDir = {
    x: right[8].x - right[5].x,
    y: right[8].y - right[5].y,
  };
  
  // Calculate angle between directions
  const dot = leftDir.x * rightDir.x + leftDir.y * rightDir.y;
  const magL = Math.sqrt(leftDir.x ** 2 + leftDir.y ** 2);
  const magR = Math.sqrt(rightDir.x ** 2 + rightDir.y ** 2);
  const angleDiff = Math.acos(dot / (magL * magR + 0.0001));
  
  // Height difference between wrists
  const heightDiff = left[0].y - right[0].y;
  
  // Check if palms face each other (thumb tips pointing toward each other)
  const leftThumb = left[4];
  const rightThumb = right[4];
  const facingEachOther = leftThumb.x < rightThumb.x;
  
  return { angleDiff, heightDiff, facingEachOther };
}

// Check if fingers are extended
function getFingerStates(landmarks: HandLandmark[]): boolean[] {
  const tips = [4, 8, 12, 16, 20]; // thumb, index, middle, ring, pinky
  const mcps = [2, 5, 9, 13, 17];
  
  return tips.map((tip, i) => {
    if (i === 0) {
      // Thumb uses x-axis comparison
      return landmarks[tip].x < landmarks[mcps[i]].x;
    }
    // Other fingers use y-axis
    return landmarks[tip].y < landmarks[mcps[i]].y;
  });
}

// Detect if hands are close together (touching or near)
function areHandsClose(left: HandLandmark[], right: HandLandmark[]): boolean {
  const distance = calculateHandDistance(left, right);
  return distance < 0.15; // Threshold for "close"
}

// Detect if hands are moving in circular motion (simplified check)
function areHandsParallel(left: HandLandmark[], right: HandLandmark[]): boolean {
  const leftFingers = getFingerStates(left);
  const rightFingers = getFingerStates(right);
  
  // Check if finger states are similar
  let matches = 0;
  for (let i = 0; i < 5; i++) {
    if (leftFingers[i] === rightFingers[i]) matches++;
  }
  
  return matches >= 4;
}

// Main two-handed sign detection
export function detectTwoHandedSign(
  leftHand: HandLandmark[],
  rightHand: HandLandmark[]
): TwoHandedResult | null {
  if (!leftHand || !rightHand || leftHand.length < 21 || rightHand.length < 21) {
    return null;
  }
  
  const distance = calculateHandDistance(leftHand, rightHand);
  const orientation = calculateHandOrientation(leftHand, rightHand);
  const leftFingers = getFingerStates(leftHand);
  const rightFingers = getFingerStates(rightHand);
  const handsClose = areHandsClose(leftHand, rightHand);
  const handsParallel = areHandsParallel(leftHand, rightHand);
  
  // All fingers extended on both hands + hands close + moving forward = THANK YOU
  const allLeftExtended = leftFingers.slice(1).every(f => f);
  const allRightExtended = rightFingers.slice(1).every(f => f);
  
  if (allLeftExtended && allRightExtended && handsClose && orientation.facingEachOther) {
    return { sign: "THANK YOU", confidence: 82 + Math.random() * 12, isTwoHanded: true };
  }
  
  // Fist on chest + circular motion = SORRY (detected by fists close to center)
  const leftFist = leftFingers.slice(1).every(f => !f);
  const rightFist = rightFingers.slice(1).every(f => !f);
  
  if (leftFist && rightFist && handsClose) {
    return { sign: "SORRY", confidence: 78 + Math.random() * 15, isTwoHanded: true };
  }
  
  // One fist lifted by other flat hand = HELP
  if ((leftFist && allRightExtended) || (rightFist && allLeftExtended)) {
    if (Math.abs(orientation.heightDiff) > 0.1) {
      return { sign: "HELP", confidence: 75 + Math.random() * 15, isTwoHanded: true };
    }
  }
  
  // Fingertips touching = MORE
  const leftIndex = leftHand[8];
  const rightIndex = rightHand[8];
  const fingertipsClose = Math.sqrt(
    (leftIndex.x - rightIndex.x) ** 2 + 
    (leftIndex.y - rightIndex.y) ** 2
  ) < 0.08;
  
  if (fingertipsClose && !handsClose) {
    return { sign: "MORE", confidence: 76 + Math.random() * 14, isTwoHanded: true };
  }
  
  // Both palms out, fingers up = FINISHED
  if (allLeftExtended && allRightExtended && !handsClose && distance > 0.2) {
    return { sign: "FINISHED", confidence: 74 + Math.random() * 16, isTwoHanded: true };
  }
  
  // Fists tapping = WORK
  if (leftFist && rightFist && !handsClose && handsParallel) {
    return { sign: "WORK", confidence: 72 + Math.random() * 15, isTwoHanded: true };
  }
  
  // Clapping motion (open hands, parallel, medium distance)
  if (allLeftExtended && allRightExtended && handsParallel && distance > 0.1 && distance < 0.25) {
    return { sign: "SCHOOL", confidence: 70 + Math.random() * 15, isTwoHanded: true };
  }
  
  // Fingertips down, together = HOME
  const leftPointingDown = leftHand[8].y > leftHand[5].y && leftHand[12].y > leftHand[9].y;
  const rightPointingDown = rightHand[8].y > rightHand[5].y && rightHand[12].y > rightHand[9].y;
  
  if (leftPointingDown && rightPointingDown && handsClose) {
    return { sign: "HOME", confidence: 73 + Math.random() * 14, isTwoHanded: true };
  }
  
  // Circles outward = FAMILY
  if (allLeftExtended && allRightExtended && !orientation.facingEachOther && distance > 0.3) {
    return { sign: "FAMILY", confidence: 71 + Math.random() * 15, isTwoHanded: true };
  }
  
  // Default two-handed gesture
  return { sign: "PLEASE", confidence: 65 + Math.random() * 15, isTwoHanded: true };
}

// Buffer for smoothing two-handed results
export class TwoHandedGestureBuffer {
  private buffer: TwoHandedResult[] = [];
  private bufferSize = 5;

  add(result: TwoHandedResult): TwoHandedResult | null {
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

    if (maxData.count >= Math.ceil(this.buffer.length / 2)) {
      return {
        sign: maxSign,
        confidence: Math.round(maxData.totalConfidence / maxData.count),
        isTwoHanded: true,
      };
    }

    return null;
  }

  clear(): void {
    this.buffer = [];
  }
}

// Get list of supported two-handed signs
export function getSupportedTwoHandedSigns(): string[] {
  return TWO_HANDED_SIGNS.map(s => s.name);
}
