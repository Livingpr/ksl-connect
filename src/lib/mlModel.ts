/**
 * ML Model Integration for Sign Language Detection
 * 
 * This file provides the structure for integrating your own ML model.
 * Currently uses a sample/placeholder implementation.
 * 
 * ============================================================
 * 🔧 HOW TO ADD YOUR OWN MODEL:
 * ============================================================
 * 
 * 1. REPLACE THE MODEL PATH:
 *    Update MODEL_PATH to point to your trained model.
 *    Supported formats: TensorFlow.js layers model (model.json)
 *    
 *    Example:
 *    const MODEL_PATH = '/models/your-model/model.json';
 *    
 * 2. UPDATE SIGN_CLASSES:
 *    Replace with your model's output class labels in order.
 *    These should match your training data labels.
 *    
 * 3. MODIFY preprocessLandmarks():
 *    Adjust input preprocessing to match your model's expected input shape.
 *    - Normalization
 *    - Feature extraction
 *    - Input dimensions
 *    
 * 4. MODIFY postprocessOutput():
 *    Adjust output parsing based on your model's output format.
 *    
 * ============================================================
 */

// ============================================================
// 🎯 CONFIGURATION - MODIFY THESE FOR YOUR MODEL
// ============================================================

/**
 * Path to your TensorFlow.js model
 * Place your model files in public/models/ directory
 * 
 * Your model directory should contain:
 * - model.json (model architecture)
 * - group1-shard1of1.bin (or similar weight files)
 */
const MODEL_PATH = '/models/sign-language/model.json';

/**
 * Sign classes your model was trained on
 * ORDER MATTERS - must match your model's output indices
 * 
 * Example for ASL alphabet:
 * const SIGN_CLASSES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 
 *                       'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T',
 *                       'U', 'V', 'W', 'X', 'Y', 'Z'];
 */
const SIGN_CLASSES = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J',
  'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T',
  'U', 'V', 'W', 'X', 'Y', 'Z',
  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
  'HELLO', 'THANK YOU', 'SORRY', 'PLEASE', 'YES', 'NO',
  'GOOD', 'BAD', 'HELP', 'STOP'
];

/**
 * Minimum confidence threshold (0-1)
 * Predictions below this are ignored
 */
const MIN_CONFIDENCE = 0.6;

// ============================================================
// 🧠 MODEL LOADER
// ============================================================

type TFModel = {
  predict: (input: any) => any;
};

let model: TFModel | null = null;
let isModelLoading = false;
let modelError: string | null = null;
let useFallback = true; // Set to false once you add your real model

/**
 * Dynamically import TensorFlow.js
 * This keeps bundle size small when ML isn't being used
 */
async function loadTensorFlow() {
  const tf = await import('@tensorflow/tfjs');
  return tf;
}

/**
 * Load the ML model
 * Call this once during app initialization
 */
export async function loadModel(): Promise<boolean> {
  if (model) return true;
  if (isModelLoading) return false;
  
  isModelLoading = true;
  modelError = null;

  try {
    // ============================================================
    // 👇 YOUR MODEL LOADING CODE HERE
    // ============================================================
    
    if (useFallback) {
      // Currently using fallback (rule-based detection)
      // Set useFallback = false and uncomment below when you have a model
      console.log('[ML Model] Using fallback rule-based detection');
      console.log('[ML Model] To use your own model:');
      console.log('  1. Place model files in public/models/sign-language/');
      console.log('  2. Set useFallback = false in mlModel.ts');
      isModelLoading = false;
      return true;
    }

    // Uncomment this block when you have your model:
    /*
    const tf = await loadTensorFlow();
    
    console.log('[ML Model] Loading model from:', MODEL_PATH);
    model = await tf.loadLayersModel(MODEL_PATH);
    console.log('[ML Model] Model loaded successfully');
    
    // Warm up the model with a dummy prediction
    const dummyInput = tf.zeros([1, 63]); // Adjust shape for your model
    model.predict(dummyInput);
    dummyInput.dispose();
    console.log('[ML Model] Model warmed up');
    */

    isModelLoading = false;
    return true;
  } catch (error) {
    console.error('[ML Model] Failed to load:', error);
    modelError = error instanceof Error ? error.message : 'Unknown error';
    isModelLoading = false;
    return false;
  }
}

/**
 * Check if model is ready
 */
export function isModelReady(): boolean {
  return useFallback || model !== null;
}

/**
 * Get model loading status
 */
export function getModelStatus(): { 
  loaded: boolean; 
  loading: boolean; 
  error: string | null;
  usingFallback: boolean;
} {
  return {
    loaded: useFallback || model !== null,
    loading: isModelLoading,
    error: modelError,
    usingFallback: useFallback,
  };
}

// ============================================================
// 🔄 PREPROCESSING - MODIFY FOR YOUR MODEL
// ============================================================

interface Landmark {
  x: number;
  y: number;
  z: number;
}

/**
 * Preprocess hand landmarks for model input
 * 
 * Modify this function to match your model's expected input:
 * - Input shape (default: [1, 63] for 21 landmarks × 3 coordinates)
 * - Normalization method
 * - Feature engineering
 */
function preprocessLandmarks(landmarks: Landmark[]): number[] | null {
  if (!landmarks || landmarks.length !== 21) return null;

  // ============================================================
  // 👇 MODIFY PREPROCESSING HERE
  // ============================================================

  // Default: Flatten to [x1, y1, z1, x2, y2, z2, ...]
  const flattened: number[] = [];
  
  // Normalize relative to wrist (landmark 0)
  const wrist = landmarks[0];
  
  for (const landmark of landmarks) {
    // Normalize coordinates relative to wrist
    flattened.push(landmark.x - wrist.x);
    flattened.push(landmark.y - wrist.y);
    flattened.push(landmark.z - wrist.z);
  }

  // Optional: Scale to [-1, 1] range
  const maxVal = Math.max(...flattened.map(Math.abs));
  if (maxVal > 0) {
    return flattened.map(v => v / maxVal);
  }

  return flattened;
}

// ============================================================
// 🎯 PREDICTION
// ============================================================

export interface PredictionResult {
  sign: string;
  confidence: number;
  allPredictions?: Array<{ sign: string; confidence: number }>;
}

/**
 * Run inference on hand landmarks
 * Returns the predicted sign and confidence
 */
export async function predictSign(landmarks: Landmark[]): Promise<PredictionResult | null> {
  // ============================================================
  // 👇 FALLBACK: Rule-based detection (replace with your model)
  // ============================================================
  
  if (useFallback) {
    // Use the existing rule-based detection
    const { detectGesture } = await import('./signMapping');
    return detectGesture(landmarks);
  }

  // ============================================================
  // 👇 ML MODEL INFERENCE (uncomment when you have your model)
  // ============================================================

  /*
  if (!model) {
    console.warn('[ML Model] Model not loaded');
    return null;
  }

  const input = preprocessLandmarks(landmarks);
  if (!input) return null;

  try {
    const tf = await loadTensorFlow();
    
    // Create tensor with proper shape
    // Adjust shape based on your model's input requirements
    const inputTensor = tf.tensor2d([input], [1, 63]);
    
    // Run prediction
    const prediction = model.predict(inputTensor) as any;
    const probabilities = await prediction.data();
    
    // Clean up tensors
    inputTensor.dispose();
    prediction.dispose();

    // Find top prediction
    const maxIndex = probabilities.indexOf(Math.max(...probabilities));
    const confidence = probabilities[maxIndex] * 100;

    // Filter low confidence predictions
    if (confidence < MIN_CONFIDENCE * 100) {
      return null;
    }

    // Get top 3 predictions for debugging
    const allPredictions = Array.from(probabilities)
      .map((prob: number, idx: number) => ({
        sign: SIGN_CLASSES[idx] || `Unknown_${idx}`,
        confidence: prob * 100,
      }))
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3);

    return {
      sign: SIGN_CLASSES[maxIndex] || 'Unknown',
      confidence,
      allPredictions,
    };
  } catch (error) {
    console.error('[ML Model] Prediction failed:', error);
    return null;
  }
  */

  return null;
}

// ============================================================
// 📊 UTILITIES
// ============================================================

/**
 * Get list of supported signs
 */
export function getSupportedSigns(): string[] {
  return [...SIGN_CLASSES];
}

/**
 * Dispose of the model and free memory
 */
export async function disposeModel(): Promise<void> {
  if (model && !useFallback) {
    // model.dispose(); // Uncomment when using real model
    model = null;
  }
}
