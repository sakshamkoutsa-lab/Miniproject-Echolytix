/**
 * sosBlinkDetector.ts
 *
 * Dedicated Morse-Code SOS Detection Engine for Eye-Blink Input.
 *
 * Pattern: "... --- ..." (3 Short Blinks, 3 Long Blinks, 3 Short Blinks)
 * Standard Morse code: S = "...", O = "---", S = "..."
 *
 * Features:
 * - Configurable timing thresholds (short blink, long blink, inter-symbol pause, cooldown).
 * - Multi-stage state machine with real-time progress tracking.
 * - Supports both continuous blink sequences ("...---...") and paused sequences with letter pauses ("... --- ...").
 * - Automatic reset on pause timeout or invalid symbol sequences.
 * - Anti-accidental trigger debouncing and configurable post-trigger cooldown lockout.
 * - LocalStorage persistence for user-tuned threshold settings.
 */

export interface SosDetectorConfig {
  /** Maximum blink duration in ms for a dot '.' (default: 280ms) */
  shortBlinkMax: number;
  /** Minimum blink duration in ms for a dash '-' (default: 300ms) */
  longBlinkMin: number;
  /** Maximum blink duration in ms for a valid dash '-' (default: 2000ms) */
  longBlinkMax: number;
  /** Maximum allowed pause between consecutive symbols in ms before sequence resets (default: 5000ms) */
  pauseTimeout: number;
  /** Cooldown period in ms after SOS is triggered to lock duplicate alerts (default: 30000ms / 30s) */
  cooldownPeriod: number;
  /** Minimum pause between letters in ms (if letter-pause validation is enabled, default: 200ms) */
  minLetterPause: number;
}

export const DEFAULT_SOS_CONFIG: SosDetectorConfig = {
  shortBlinkMax: 280,
  longBlinkMin: 300,
  longBlinkMax: 2000,
  pauseTimeout: 5000,
  cooldownPeriod: 30000,
  minLetterPause: 200,
};

const STORAGE_KEY = 'echolytix_sos_blink_config';

/**
 * Load persisted SOS detector configuration or fallback to defaults.
 */
export function loadSosDetectorConfig(): SosDetectorConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      const shortMax = Number(parsed.shortBlinkMax);
      const longMin = Number(parsed.longBlinkMin);
      return {
        shortBlinkMax: shortMax && shortMax <= 320 ? shortMax : DEFAULT_SOS_CONFIG.shortBlinkMax,
        longBlinkMin: longMin && longMin <= 500 ? longMin : DEFAULT_SOS_CONFIG.longBlinkMin,
        longBlinkMax: Number(parsed.longBlinkMax) || DEFAULT_SOS_CONFIG.longBlinkMax,
        pauseTimeout: Math.max(5000, Number(parsed.pauseTimeout) || DEFAULT_SOS_CONFIG.pauseTimeout),
        cooldownPeriod: Number(parsed.cooldownPeriod) || DEFAULT_SOS_CONFIG.cooldownPeriod,
        minLetterPause: Number(parsed.minLetterPause) || DEFAULT_SOS_CONFIG.minLetterPause,
      };
    }
  } catch (e) {
    console.warn('Error loading SOS detector configuration:', e);
  }
  return { ...DEFAULT_SOS_CONFIG };
}

/**
 * Save SOS detector configuration to localStorage.
 */
export function saveSosDetectorConfig(config: SosDetectorConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.warn('Error saving SOS detector configuration:', e);
  }
}

export interface BlinkRecord {
  symbol: '.' | '-';
  timestamp: number;
  duration?: number;
}

export const SOS_PATTERN: ('.' | '-')[] = [
  '.', '.', '.',
  '-', '-', '-',
  '.', '.', '.'
];

export interface SosProgress {
  /** Number of matching symbols so far (0 to 9) */
  step: number;
  /** Total symbols required (always 9) */
  total: number;
  /** Expected pattern symbols array */
  pattern: string[];
  /** String representation of matched symbols so far */
  matchedString: string;
  /** Whether the system is currently in cooldown lockout */
  isCooldown: boolean;
  /** Remaining cooldown seconds */
  cooldownRemaining: number;
}

export class SosBlinkDetector {
  private config: SosDetectorConfig;
  private sequence: BlinkRecord[] = [];
  private lastTriggerTime: number = 0;
  private onTriggerCallback?: () => void;
  private onProgressCallback?: (progress: SosProgress) => void;

  constructor(
    config?: Partial<SosDetectorConfig>,
    onTrigger?: () => void,
    onProgress?: (progress: SosProgress) => void
  ) {
    this.config = { ...loadSosDetectorConfig(), ...config };
    this.onTriggerCallback = onTrigger;
    this.onProgressCallback = onProgress;
  }

  public getConfig(): SosDetectorConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<SosDetectorConfig>): void {
    this.config = { ...this.config, ...newConfig };
    saveSosDetectorConfig(this.config);
  }

  public setOnTrigger(callback: () => void): void {
    this.onTriggerCallback = callback;
  }

  public setOnProgress(callback: (progress: SosProgress) => void): void {
    this.onProgressCallback = callback;
  }

  /**
   * Check if cooldown is currently active.
   */
  public isCooldownActive(): boolean {
    return Date.now() < this.lastTriggerTime + this.config.cooldownPeriod;
  }

  /**
   * Returns remaining cooldown in seconds (0 if not in cooldown).
   */
  public getCooldownRemainingSeconds(): number {
    const remaining = Math.max(0, (this.lastTriggerTime + this.config.cooldownPeriod) - Date.now());
    return Math.ceil(remaining / 1000);
  }

  /**
   * Reset current blink history and progress.
   */
  public reset(): void {
    this.sequence = [];
    this.notifyProgress();
  }

  /**
   * Mark the detector as triggered: initiates cooldown period and resets active sequence.
   */
  public markTriggered(): void {
    this.lastTriggerTime = Date.now();
    this.sequence = [];
    this.notifyProgress();
  }

  /**
   * Classify a raw blink duration (ms) into a Morse symbol based on current thresholds.
   */
  public classifyBlinkDuration(durationMs: number): '.' | '-' | null {
    if (durationMs < 60 || durationMs > this.config.longBlinkMax) {
      return null; // Ignore micro-jitters (<60ms) or prolonged closed eyes / sleep (>longBlinkMax)
    }
    if (durationMs < this.config.shortBlinkMax) {
      return '.';
    }
    if (durationMs >= this.config.longBlinkMin) {
      return '-';
    }
    // Ambiguous middle range: classify by proximity
    const mid = (this.config.shortBlinkMax + this.config.longBlinkMin) / 2;
    return durationMs < mid ? '.' : '-';
  }

  /**
   * Process a new blink input symbol ('.' or '-').
   * @param symbol '.' or '-'
   * @param duration Optional duration in ms of this blink episode
   * @returns true if the SOS pattern was completed and triggered
   */
  public processBlink(symbol: '.' | '-', duration?: number): boolean {
    const now = Date.now();

    // 1. Lockout check during cooldown
    if (this.isCooldownActive()) {
      this.notifyProgress();
      return false;
    }

    // 2. Pause timeout check: if elapsed silence exceeds pauseTimeout, reset previous sequence
    if (this.sequence.length > 0) {
      const lastBlink = this.sequence[this.sequence.length - 1];
      if (now - lastBlink.timestamp > this.config.pauseTimeout) {
        this.sequence = [];
      }
    }

    // 3. Append current blink
    this.sequence.push({
      symbol,
      timestamp: now,
      duration,
    });

    // Keep only the most recent 9 items
    if (this.sequence.length > SOS_PATTERN.length) {
      this.sequence.shift();
    }

    // 4. Check if the current sliding window matches the exact SOS pattern
    const isFullMatch = this.checkSequenceMatch();

    if (isFullMatch) {
      // Trigger confirmation
      this.lastTriggerTime = now;
      this.sequence = [];
      this.notifyProgress();

      if (this.onTriggerCallback) {
        this.onTriggerCallback();
      }
      return true;
    }

    // If not a full match, calculate partial match from the tail
    this.pruneInvalidPrefix();
    this.notifyProgress();
    return false;
  }

  /**
   * Directly test if a sequence of letters / string corresponds to SOS
   * (e.g. if the user spells "SOS" or sends "...---...").
   */
  public triggerManualSos(): boolean {
    const now = Date.now();
    if (this.isCooldownActive()) {
      this.notifyProgress();
      return false;
    }

    this.lastTriggerTime = now;
    this.sequence = [];
    this.notifyProgress();

    if (this.onTriggerCallback) {
      this.onTriggerCallback();
    }
    return true;
  }

  /**
   * Check if current sequence matches the complete 9-symbol SOS pattern.
   */
  private checkSequenceMatch(): boolean {
    if (this.sequence.length !== SOS_PATTERN.length) {
      return false;
    }

    for (let i = 0; i < SOS_PATTERN.length; i++) {
      if (this.sequence[i].symbol !== SOS_PATTERN[i]) {
        return false;
      }
    }

    return true;
  }

  /**
   * Find the longest prefix of SOS_PATTERN that matches the suffix of our sequence.
   * If the sequence has invalid symbols at the end, prune until only valid prefixes remain.
   */
  private pruneInvalidPrefix(): void {
    while (this.sequence.length > 0) {
      let matches = true;
      for (let i = 0; i < this.sequence.length; i++) {
        if (this.sequence[i].symbol !== SOS_PATTERN[i]) {
          matches = false;
          break;
        }
      }
      if (matches) {
        return; // Current sequence is a valid prefix of SOS
      }
      // Drop the oldest element to see if a later sub-sequence is valid
      this.sequence.shift();
    }
  }

  /**
   * Get current progress representation.
   */
  public getProgress(): SosProgress {
    const isCooldown = this.isCooldownActive();
    const cooldownRemaining = this.getCooldownRemainingSeconds();
    const matchedString = this.sequence.map(s => s.symbol).join('');

    return {
      step: this.sequence.length,
      total: SOS_PATTERN.length,
      pattern: SOS_PATTERN,
      matchedString,
      isCooldown,
      cooldownRemaining,
    };
  }

  private notifyProgress(): void {
    if (this.onProgressCallback) {
      this.onProgressCallback(this.getProgress());
    }
  }
}
