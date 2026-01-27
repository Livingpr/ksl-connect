// KSL Sentence Builder - Combines gestures into grammatically correct sentences
// KSL typically follows Topic-Comment structure (Subject-Object-Verb or SOV)

export interface SentenceGesture {
  sign: string;
  confidence: number;
  timestamp: number;
}

export interface BuiltSentence {
  gestures: string[];
  english: string;
  swahili: string;
  avgConfidence: number;
}

// Common KSL phrase patterns with English and Swahili translations
const KSL_PHRASE_PATTERNS: Map<string, { english: string; swahili: string }> = new Map([
  // Greetings
  ["HELLO", { english: "Hello", swahili: "Habari" }],
  ["GOOD,MORNING", { english: "Good morning", swahili: "Habari za asubuhi" }],
  ["GOOD,EVENING", { english: "Good evening", swahili: "Habari za jioni" }],
  ["THANK YOU", { english: "Thank you", swahili: "Asante" }],
  ["SORRY", { english: "I'm sorry", swahili: "Pole" }],
  
  // Common phrases
  ["I,GO,SCHOOL", { english: "I am going to school", swahili: "Naenda shule" }],
  ["I,LEARN,SIGN", { english: "I am learning sign language", swahili: "Ninajifunza lugha ya ishara" }],
  ["HELP,ME", { english: "Help me please", swahili: "Nisaidie tafadhali" }],
  ["HELP", { english: "Help", swahili: "Msaada" }],
  ["MORE", { english: "More", swahili: "Zaidi" }],
  ["FINISHED", { english: "Finished", swahili: "Imekwisha" }],
  
  // Questions
  ["WHAT,YOUR,NAME", { english: "What is your name?", swahili: "Jina lako ni nani?" }],
  ["HOW,YOU", { english: "How are you?", swahili: "Habari yako?" }],
  ["WHERE,GO", { english: "Where are you going?", swahili: "Unaenda wapi?" }],
  
  // Basic sentences
  ["I,HAPPY", { english: "I am happy", swahili: "Mimi nafurahi" }],
  ["I,SAD", { english: "I am sad", swahili: "Mimi nina huzuni" }],
  ["I,HUNGRY", { english: "I am hungry", swahili: "Nina njaa" }],
  ["I,THIRSTY", { english: "I am thirsty", swahili: "Nina kiu" }],
  ["I,TIRED", { english: "I am tired", swahili: "Nimechoka" }],
  
  // Numbers and counting
  ["ONE", { english: "One", swahili: "Moja" }],
  ["ONE / POINT", { english: "One", swahili: "Moja" }],
  ["TWO", { english: "Two", swahili: "Mbili" }],
  ["TWO / PEACE", { english: "Two", swahili: "Mbili" }],
  ["THREE", { english: "Three", swahili: "Tatu" }],
  ["FOUR", { english: "Four", swahili: "Nne" }],
  ["FIVE", { english: "Five", swahili: "Tano" }],
  ["FIVE / STOP", { english: "Five / Stop", swahili: "Tano / Simama" }],
  
  // Letters
  ["A", { english: "A", swahili: "A" }],
  ["I / SMALL", { english: "I / Small", swahili: "I / Ndogo" }],
  
  // Actions
  ["GOOD / YES", { english: "Good / Yes", swahili: "Nzuri / Ndiyo" }],
  ["NO", { english: "No", swahili: "Hapana" }],
  ["STOP", { english: "Stop", swahili: "Simama" }],
  ["WAIT", { english: "Wait", swahili: "Subiri" }],
  ["COME", { english: "Come", swahili: "Njoo" }],
  ["GO", { english: "Go", swahili: "Nenda" }],
]);

// Word-level translations for building novel sentences
const WORD_TRANSLATIONS: Map<string, { english: string; swahili: string }> = new Map([
  ["I", { english: "I", swahili: "Mimi" }],
  ["YOU", { english: "You", swahili: "Wewe" }],
  ["GO", { english: "go", swahili: "enda" }],
  ["SCHOOL", { english: "school", swahili: "shule" }],
  ["LEARN", { english: "learn", swahili: "jifunza" }],
  ["SIGN", { english: "sign", swahili: "ishara" }],
  ["HELP", { english: "help", swahili: "saidia" }],
  ["ME", { english: "me", swahili: "mimi" }],
  ["HELLO", { english: "Hello", swahili: "Habari" }],
  ["GOOD", { english: "good", swahili: "nzuri" }],
  ["GOOD / YES", { english: "good", swahili: "nzuri" }],
  ["YES", { english: "yes", swahili: "ndiyo" }],
  ["NO", { english: "no", swahili: "hapana" }],
  ["THANK", { english: "thank", swahili: "asante" }],
  ["THANK YOU", { english: "thank you", swahili: "asante" }],
  ["SORRY", { english: "sorry", swahili: "pole" }],
  ["MORE", { english: "more", swahili: "zaidi" }],
  ["FINISHED", { english: "finished", swahili: "kwisha" }],
  ["HAPPY", { english: "happy", swahili: "furahi" }],
  ["SAD", { english: "sad", swahili: "huzuni" }],
  ["A", { english: "A", swahili: "A" }],
  ["ONE / POINT", { english: "one", swahili: "moja" }],
  ["TWO / PEACE", { english: "two", swahili: "mbili" }],
  ["THREE", { english: "three", swahili: "tatu" }],
  ["FOUR", { english: "four", swahili: "nne" }],
  ["FIVE / STOP", { english: "five", swahili: "tano" }],
  ["I / SMALL", { english: "I", swahili: "mimi" }],
]);

// Normalize sign names for matching
function normalizeSign(sign: string): string {
  return sign.toUpperCase().trim();
}

// Try to find a known phrase pattern
function findPhrasePattern(gestures: string[]): { english: string; swahili: string } | null {
  // Try exact match first
  const key = gestures.join(",");
  if (KSL_PHRASE_PATTERNS.has(key)) {
    return KSL_PHRASE_PATTERNS.get(key)!;
  }
  
  // Try matching with normalized signs
  for (const [pattern, translation] of KSL_PHRASE_PATTERNS) {
    const patternParts = pattern.split(",");
    if (patternParts.length === gestures.length) {
      const matches = patternParts.every((p, i) => 
        normalizeSign(gestures[i]).includes(normalizeSign(p)) ||
        normalizeSign(p).includes(normalizeSign(gestures[i]))
      );
      if (matches) {
        return translation;
      }
    }
  }
  
  return null;
}

// Build sentence from individual words using KSL grammar (SOV -> SVO for English)
function buildFromWords(gestures: string[], language: 'english' | 'swahili'): string {
  const words: string[] = [];
  
  for (const gesture of gestures) {
    const normalized = normalizeSign(gesture);
    const translation = WORD_TRANSLATIONS.get(normalized);
    
    if (translation) {
      words.push(language === 'english' ? translation.english : translation.swahili);
    } else {
      // Use the gesture name as fallback, formatted nicely
      const formatted = gesture.split(' / ')[0].toLowerCase();
      words.push(formatted.charAt(0).toUpperCase() + formatted.slice(1));
    }
  }
  
  // Apply basic English grammar adjustments
  if (language === 'english' && words.length >= 2) {
    // Add "am/is/are" for adjective predicates
    if (words[0].toLowerCase() === 'i' && !['go', 'learn', 'help', 'want', 'need'].includes(words[1]?.toLowerCase())) {
      words.splice(1, 0, 'am');
    }
  }
  
  return words.join(' ');
}

export class SentenceBuilder {
  private gestures: SentenceGesture[] = [];
  private lastGestureTime = 0;
  private sentencePauseMs = 2500; // 2.5 seconds pause = sentence boundary
  private minGesturesForSentence = 1;
  private maxGesturesPerSentence = 10;
  private lastAddedSign = '';
  
  constructor(options?: { pauseMs?: number; minGestures?: number }) {
    if (options?.pauseMs) this.sentencePauseMs = options.pauseMs;
    if (options?.minGestures) this.minGesturesForSentence = options.minGestures;
  }
  
  // Add a gesture to the buffer
  add(sign: string, confidence: number): { 
    added: boolean; 
    currentGestures: string[];
    sentenceReady: boolean;
  } {
    const now = Date.now();
    
    // Prevent duplicate consecutive signs
    if (sign === this.lastAddedSign) {
      return {
        added: false,
        currentGestures: this.gestures.map(g => g.sign),
        sentenceReady: false,
      };
    }
    
    // Check for sentence boundary (long pause)
    const sentenceReady = this.gestures.length >= this.minGesturesForSentence &&
      this.lastGestureTime > 0 &&
      (now - this.lastGestureTime) > this.sentencePauseMs;
    
    // Don't add if we've hit max gestures
    if (this.gestures.length >= this.maxGesturesPerSentence) {
      return {
        added: false,
        currentGestures: this.gestures.map(g => g.sign),
        sentenceReady: true,
      };
    }
    
    this.gestures.push({ sign, confidence, timestamp: now });
    this.lastGestureTime = now;
    this.lastAddedSign = sign;
    
    return {
      added: true,
      currentGestures: this.gestures.map(g => g.sign),
      sentenceReady,
    };
  }
  
  // Check if enough time has passed to consider sentence complete
  checkSentenceBoundary(): boolean {
    if (this.gestures.length < this.minGesturesForSentence) return false;
    
    const now = Date.now();
    return (now - this.lastGestureTime) > this.sentencePauseMs;
  }
  
  // Build the sentence from accumulated gestures
  build(): BuiltSentence | null {
    if (this.gestures.length < this.minGesturesForSentence) return null;
    
    const signs = this.gestures.map(g => g.sign);
    const avgConfidence = Math.round(
      this.gestures.reduce((sum, g) => sum + g.confidence, 0) / this.gestures.length
    );
    
    // Try known phrase patterns first
    const phraseMatch = findPhrasePattern(signs);
    
    if (phraseMatch) {
      return {
        gestures: signs,
        english: phraseMatch.english,
        swahili: phraseMatch.swahili,
        avgConfidence,
      };
    }
    
    // Build from individual words
    return {
      gestures: signs,
      english: buildFromWords(signs, 'english'),
      swahili: buildFromWords(signs, 'swahili'),
      avgConfidence,
    };
  }
  
  // Get current gestures without clearing
  getCurrentGestures(): string[] {
    return this.gestures.map(g => g.sign);
  }
  
  // Get gesture count
  getGestureCount(): number {
    return this.gestures.length;
  }
  
  // Clear the buffer after sentence is complete
  clear(): void {
    this.gestures = [];
    this.lastAddedSign = '';
    this.lastGestureTime = 0;
  }
  
  // Get time since last gesture (for UI feedback)
  getTimeSinceLastGesture(): number {
    if (this.lastGestureTime === 0) return 0;
    return Date.now() - this.lastGestureTime;
  }
}
