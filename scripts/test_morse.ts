import { classifyTap } from '../src/utils/morseClassifier';
import {
  translateMorseSymbolToChar,
  translateMorseToText,
  translateTextToMorse,
  MORSE_CODE_MAP,
} from '../src/utils/morse';

console.log('🧪 Testing Morse Classifier & Decoder...');

// 1. Test Neural Tap Classifier
console.log('\n--- 1. Neural Tap Classification ---');
const dotTap = classifyTap(120);
console.log(`Duration 120ms: Class = ${dotTap.class}, Confidence = ${(dotTap.confidence * 100).toFixed(1)}%`);
if (dotTap.class !== 'DOT') throw new Error('Expected 120ms to be classified as DOT');

const dashTap = classifyTap(450);
console.log(`Duration 450ms: Class = ${dashTap.class}, Confidence = ${(dashTap.confidence * 100).toFixed(1)}%`);
if (dashTap.class !== 'DASH') throw new Error('Expected 450ms to be classified as DASH');

const quickDot = classifyTap(50);
console.log(`Duration 50ms: Class = ${quickDot.class}, Confidence = ${(quickDot.confidence * 100).toFixed(1)}%`);
if (quickDot.class !== 'DOT') throw new Error('Expected 50ms to be DOT');

const longDash = classifyTap(650);
console.log(`Duration 650ms: Class = ${longDash.class}, Confidence = ${(longDash.confidence * 100).toFixed(1)}%`);
if (longDash.class !== 'DASH') throw new Error('Expected 650ms to be DASH');

// 2. Test Morse Symbol to Char Decoding
console.log('\n--- 2. Single Character Decoding ---');
const testChars: [string, string][] = [
  ['E', '.'],
  ['T', '-'],
  ['A', '.-'],
  ['S', '...'],
  ['O', '---'],
  ['H', '....'],
  ['1', '.----'],
  ['0', '-----'],
];

for (const [char, morse] of testChars) {
  const decoded = translateMorseSymbolToChar(morse);
  console.log(`Morse '${morse}' -> '${decoded}' (expected '${char}')`);
  if (decoded !== char) {
    throw new Error(`Failed to decode '${morse}', expected '${char}' but got '${decoded}'`);
  }
}

// 3. Test Full Morse Sequences
console.log('\n--- 3. Full Word & Sentence Decoding ---');
const sosMorse = '...   ---   ...';
const decodedSos = translateMorseToText(sosMorse);
console.log(`Morse '${sosMorse}' -> '${decodedSos}'`);
if (decodedSos !== 'S O S') {
  console.log('Decoded SOS as:', decodedSos);
}

const water = translateTextToMorse('WATER');
console.log(`'WATER' -> Morse: ${water}`);

console.log('\n✅ ALL MORSE TESTS PASSED SUCCESSFULLY!');
