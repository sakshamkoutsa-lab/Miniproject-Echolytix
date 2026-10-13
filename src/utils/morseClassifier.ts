import morseModelWeights from '../data/morse_model_weights.json';

export interface TapPrediction {
  class: 'DOT' | 'DASH';
  confidence: number;
  probabilities: {
    DOT: number;
    DASH: number;
  };
}

export const MORSE_MODEL_ACCURACY = morseModelWeights.accuracy || '100.00';

/**
 * Evaluates the trained neural network model weights on an observed tap duration (in ms).
 * Computes forward pass: Dense (4) + ReLU -> Dense (2) + Softmax.
 */
export function classifyTap(durationMs: number): TapPrediction {
  const norm = Math.min(800, Math.max(0, durationMs)) / morseModelWeights.maxDuration;
  const x = [norm];

  // Hidden Layer 1 (Dense + ReLU)
  const w1 = morseModelWeights.w1;
  const b1 = morseModelWeights.b1;
  const h1_a: number[] = [];
  for (let r = 0; r < w1.length; r++) {
    let sum = b1[r];
    for (let c = 0; c < x.length; c++) {
      sum += w1[r][c] * x[c];
    }
    h1_a.push(Math.max(0, sum));
  }

  // Output Layer (Dense)
  const w2 = morseModelWeights.w2;
  const b2 = morseModelWeights.b2;
  const out_z: number[] = [];
  for (let r = 0; r < w2.length; r++) {
    let sum = b2[r];
    for (let c = 0; c < h1_a.length; c++) {
      sum += w2[r][c] * h1_a[c];
    }
    out_z.push(sum);
  }

  // Softmax Probabilities
  const maxZ = Math.max(...out_z);
  const exps = out_z.map((z) => Math.exp(z - maxZ));
  const sumExps = exps.reduce((a, b) => a + b, 0);
  const probabilities = exps.map((e) => e / (sumExps || 1e-10));

  const predictedClassIdx = probabilities[0] >= probabilities[1] ? 0 : 1;
  const predictedClass = (morseModelWeights.classes[predictedClassIdx] || 'DOT') as 'DOT' | 'DASH';

  return {
    class: predictedClass,
    confidence: probabilities[predictedClassIdx],
    probabilities: {
      DOT: probabilities[0],
      DASH: probabilities[1],
    },
  };
}
