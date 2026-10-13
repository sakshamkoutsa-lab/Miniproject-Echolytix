/**
 * test_sos_detector.ts
 *
 * Verification suite for the Morse-code SOS detection engine.
 * Run with: npx tsx scripts/test_sos_detector.ts
 */

import { SosBlinkDetector, DEFAULT_SOS_CONFIG } from '../src/utils/sosBlinkDetector';

// Polyfill localStorage for Node environment testing
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (key: string) => store.get(key) || null,
    setItem: (key: string, val: string) => store.set(key, val),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
    key: (i: number) => Array.from(store.keys())[i] || null,
    length: store.size,
  } as any;
}

let testsPassed = 0;
let testsTotal = 0;

function assert(condition: boolean, testName: string) {
  testsTotal++;
  if (condition) {
    console.log(`  ✓ ${testName}`);
    testsPassed++;
  } else {
    console.error(`  ✗ FAILED: ${testName}`);
    process.exitCode = 1;
  }
}

console.log('\n=== RUNNING SOS BLINK DETECTOR TESTS ===\n');

// Test 1: Classify raw blink durations
console.log('Test Suite 1: Blink Duration Classification');
{
  const detector = new SosBlinkDetector(DEFAULT_SOS_CONFIG);

  assert(detector.classifyBlinkDuration(150) === '.', '150ms classified as dot (.)');
  assert(detector.classifyBlinkDuration(200) === '.', '200ms classified as dot (.)');
  assert(detector.classifyBlinkDuration(300) === '-', '300ms deliberate held blink classified as dash (-)');
  assert(detector.classifyBlinkDuration(500) === '-', '500ms classified as dash (-)');
  assert(detector.classifyBlinkDuration(800) === '-', '800ms classified as dash (-)');
  assert(detector.classifyBlinkDuration(70) === '.', '70ms natural quick blink classified as dot (.)');
  assert(detector.classifyBlinkDuration(40) === null, '40ms micro-jitter ignored (<60ms)');
  assert(detector.classifyBlinkDuration(2500) === null, '2500ms closed-eyes/sleep ignored (>2000ms)');
}

// Test 2: Standard Morse SOS sequence triggers alert (... --- ...)
console.log('\nTest Suite 2: Valid SOS Pattern Recognition (... --- ...)');
{
  let triggered = false;
  const detector = new SosBlinkDetector({ cooldownPeriod: 1000 }, () => {
    triggered = true;
  });

  // ... --- ... (3 dots, 3 dashes, 3 dots)
  const sequence: ('.' | '-')[] = ['.', '.', '.', '-', '-', '-', '.', '.', '.'];
  for (let i = 0; i < sequence.length - 1; i++) {
    detector.processBlink(sequence[i]);
    assert(!triggered, `Symbol ${i + 1} (${sequence[i]}) does not trigger prematurely (progress: ${detector.getProgress().step}/9)`);
  }

  // 9th symbol completes SOS
  detector.processBlink(sequence[8]);
  assert(triggered, 'Complete 9-symbol sequence (...---...) successfully triggered SOS alert');
}

// Test 3: Normal random blinking or old pattern (.-.-) does NOT trigger SOS
console.log('\nTest Suite 3: Anti-Accidental Triggering (Random Blinks & Non-SOS Patterns)');
{
  let triggered = false;
  const detector = new SosBlinkDetector(DEFAULT_SOS_CONFIG, () => {
    triggered = true;
  });

  // Normal people blink short blinks randomly
  const normalBlinks: ('.' | '-')[] = ['.', '.', '.', '.', '.', '.', '.', '.', '.', '.'];
  for (const b of normalBlinks) {
    detector.processBlink(b);
  }
  assert(!triggered, 'Repeated normal blinks (10 dots) do NOT trigger SOS');

  // Random non-matching blinks
  const alternating: ('.' | '-')[] = ['-', '-', '-', '-', '-'];
  for (const b of alternating) {
    detector.processBlink(b);
  }
  assert(!triggered, 'Arbitrary dashes do NOT trigger SOS');

  // Old erroneous .-.- pattern should NOT trigger SOS
  const oldPattern: ('.' | '-')[] = ['.', '-', '.', '-'];
  for (const b of oldPattern) {
    detector.processBlink(b);
  }
  assert(!triggered, 'Old pattern (.-.-) does NOT trigger SOS');
}

// Test 4: Sliding window matching with preceding noise
console.log('\nTest Suite 4: Sliding Window Robustness');
{
  let triggered = false;
  const detector = new SosBlinkDetector({ cooldownPeriod: 1000 }, () => {
    triggered = true;
  });

  // Preceding random blinks before starting intentional SOS
  detector.processBlink('.');
  detector.processBlink('.');
  detector.processBlink('-');
  detector.processBlink('.');

  // Now enter clean SOS: ... --- ...
  const sos: ('.' | '-')[] = ['.', '.', '.', '-', '-', '-', '.', '.', '.'];
  for (const sym of sos) {
    detector.processBlink(sym);
  }

  assert(triggered, 'SOS (...---...) recognized even when preceded by arbitrary random blinks');
}

// Test 5: Pause timeout resets incomplete sequence
console.log('\nTest Suite 5: Pause Timeout Inactivity Reset');
{
  let triggered = false;
  const detector = new SosBlinkDetector({ pauseTimeout: 100 }, () => {
    triggered = true;
  });

  detector.processBlink('.');
  detector.processBlink('.');
  detector.processBlink('.');
  detector.processBlink('-');
  assert(detector.getProgress().step === 4, 'Partial pattern recorded (step: 4/9)');

  // Simulate delay exceeding pauseTimeout (100ms)
  const now = Date.now();
  // Wait synchronously
  while (Date.now() < now + 150) {}

  // Next blink after long pause
  detector.processBlink('-');
  assert(detector.getProgress().step === 0, 'Sequence reset after pause timeout; single dash is not a valid SOS prefix');
  assert(!triggered, 'No premature trigger after pause reset');
}

// Test 6: Post-trigger cooldown lockout
console.log('\nTest Suite 6: Post-Trigger Cooldown Lockout');
{
  let triggerCount = 0;
  const detector = new SosBlinkDetector({ cooldownPeriod: 5000 }, () => {
    triggerCount++;
  });

  // First SOS (...---...)
  const sos: ('.' | '-')[] = ['.', '.', '.', '-', '-', '-', '.', '.', '.'];
  for (const sym of sos) {
    detector.processBlink(sym);
  }
  assert(triggerCount === 1, 'First SOS triggered successfully');
  assert(detector.isCooldownActive(), 'Cooldown lockout is active immediately after SOS');
  assert(detector.getCooldownRemainingSeconds() > 0, 'Cooldown remaining seconds > 0');

  // Attempt second immediate SOS during cooldown
  for (const sym of sos) {
    detector.processBlink(sym);
  }
  assert(triggerCount === 1, 'Duplicate SOS locked out during cooldown period');
}

// Test 7: Threshold configuration update & persistence
console.log('\nTest Suite 7: Configurable Thresholds & Persistence');
{
  const detector = new SosBlinkDetector(DEFAULT_SOS_CONFIG);
  detector.updateConfig({ shortBlinkMax: 260, cooldownPeriod: 45000 });

  const currentConfig = detector.getConfig();
  assert(currentConfig.shortBlinkMax === 260, 'Updated shortBlinkMax successfully applied');
  assert(currentConfig.cooldownPeriod === 45000, 'Updated cooldownPeriod successfully applied');

  // Verify persistence
  const reloaded = new SosBlinkDetector();
  assert(reloaded.getConfig().shortBlinkMax === 260, 'Config changes persisted in storage');
}

console.log(`\n=== RESULTS: ${testsPassed} / ${testsTotal} TESTS PASSED ===\n`);

if (testsPassed === testsTotal) {
  console.log('🎉 ALL SOS DETECTOR UNIT TESTS PASSED SUCCESSFULLY!\n');
} else {
  process.exit(1);
}
