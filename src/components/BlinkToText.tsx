import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { NavTab } from '../types';
import { speakText, playBeep } from '../utils/sound';
import blinkModelWeights from '../data/blink_model_weights.json';
import { sendRemoteEvent } from '../utils/remote';
import {
  SosBlinkDetector,
  SosProgress,
  SosDetectorConfig,
  loadSosDetectorConfig,
} from '../utils/sosBlinkDetector';

// New layout subcomponents
import { Sidebar, type SidebarAction } from './dashboard/Sidebar';
import { Topbar, type SearchEntry, type NotificationEntry } from './dashboard/Topbar';
import { SettingsDrawer, type SettingsTab } from './dashboard/SettingsDrawer';
import { SosConfirmDialog } from './dashboard/SosConfirmDialog';
import { DEFAULT_USER } from './dashboard/dashboardData';

// Blink Page specific components
import { LiveCameraFeed } from './blink/LiveCameraFeed';
import { MorseGuide } from './blink/MorseGuide';
import { CurrentInput } from './blink/CurrentInput';
import { BlinkControls } from './blink/BlinkControls';
import { NeuralBlinkTracker } from './blink/NeuralBlinkTracker';
import { DetectedBlinks, type BlinkEventItem } from './blink/DetectedBlinks';

interface BlinkToTextProps {
  onAddPhraseHistory: (text: string, mode: 'Blink') => void;
  remoteCode?: string;
  onOpenSos?: () => void;
  // Navigation & session integration with main app
  onSelectTab?: (tab: NavTab) => void;
  patient?: any;
  sessionToken?: string | null;
  onLogout?: () => void;
  onProfileUpdate?: (updatedPatient: any) => void;
}

const morseMap: Record<string, string> = {
  '.-': 'A', '-...': 'B', '-.-.': 'C', '-..': 'D', '.': 'E',
  '..-.': 'F', '--.': 'G', '....': 'H', '..': 'I', '.---': 'J',
  '-.-': 'K', '.-..': 'L', '--': 'M', '-.': 'N', '---': 'O',
  '.--.': 'P', '--.-': 'Q', '.-.': 'R', '...': 'S', '-': 'T',
  '..-': 'U', '...-': 'V', '.--': 'W', '-..-': 'X', '-.--': 'Y',
  '--..': 'Z', '-----': '0', '.----': '1', '..---': '2', '...--': '3',
  '....-': '4', '.....': '5', '-....': '6', '--...': '7', '---..': '8',
  '----.': '9'
};

const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('') || 'AP';

export const BlinkToText: React.FC<BlinkToTextProps> = ({
  onAddPhraseHistory,
  remoteCode,
  onOpenSos,
  onSelectTab,
  patient,
  sessionToken,
  onLogout,
  onProfileUpdate,
}) => {
  // Navigation drawer and settings state
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<SettingsTab>('settings');
  const [sosConfirmOpen, setSosConfirmOpen] = useState(false);

  // User details
  const userName: string = patient?.name?.trim() || DEFAULT_USER.name;
  const initials = getInitials(userName);
  const userRole = DEFAULT_USER.role;

  // Typing & Control settings
  const [typingMode, setTypingMode] = useState<'alphabet' | 'numbers'>('alphabet');
  const [blinkDurationThreshold, setBlinkDurationThreshold] = useState<number>(0.6); // in seconds

  // Camera & Tracking states
  const [isTracking, setIsTracking] = useState<boolean>(true);
  const [blinkCount, setBlinkCount] = useState<number>(0);
  const [ear, setEar] = useState<number>(0.25);
  const [confidence, setConfidence] = useState<number>(0);
  const [fps, setFps] = useState<number>(30);
  const [useRealWebcam, setUseRealWebcam] = useState<boolean>(() => {
    const saved = localStorage.getItem('echolytix_camera_enabled');
    if (saved !== null) return saved === 'true';
    return true; // Auto-start camera by default so eye tracking works immediately
  });

  // Text generation states
  const [outputContainer, setOutputContainer] = useState<string>('HELLO');
  const [morseBuffer, setMorseBuffer] = useState<string>('');
  const [currentSpellingWord, setCurrentSpellingWord] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [modelStatus, setModelStatus] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [errorDetails, setErrorDetails] = useState<string>('');

  // Neural tracking probabilities
  const [blinkProbabilities, setBlinkProbabilities] = useState<Record<string, number>>({
    OPEN: 1.0,
    BLINK: 0.0,
    WINK: 0.0,
  });
  const [predictedState, setPredictedState] = useState<string>('OPEN');
  const lastWinkTimeRef = useRef<number>(0);

  // Live per-eye readout
  const [leftEyeOpen, setLeftEyeOpen] = useState<boolean>(true);
  const [rightEyeOpen, setRightEyeOpen] = useState<boolean>(true);
  const [faceDetected, setFaceDetected] = useState<boolean>(false);

  // Detected Blinks live log
  const [detectedBlinksList, setDetectedBlinksList] = useState<BlinkEventItem[]>([
    { id: 'b1', eye: 'left', action: 'Select', timestamp: '10:24:15' },
    { id: 'b2', eye: 'right', action: 'Type', timestamp: '10:24:17' },
    { id: 'b3', eye: 'left', action: 'Select', timestamp: '10:24:19' },
    { id: 'b4', eye: 'right', action: 'Type', timestamp: '10:24:21' },
    { id: 'b5', eye: 'left', action: 'Select', timestamp: '10:24:23' },
  ]);

  const addBlinkEvent = useCallback((eye: 'left' | 'right' | 'both', action: BlinkEventItem['action']) => {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0] || '10:24:00';
    const newEvent: BlinkEventItem = {
      id: `${Date.now()}-${Math.random()}`,
      eye,
      action,
      timestamp: timeStr,
    };
    setDetectedBlinksList((prev) => [newEvent, ...prev.slice(0, 14)]);
  }, []);

  // Moving average smoothing buffers
  const leftEarBufferRef = useRef<number[]>([]);
  const rightEarBufferRef = useRef<number[]>([]);
  const leftBaselineRef = useRef<number>(0);
  const rightBaselineRef = useRef<number>(0);
  const winkStartRef = useRef<number>(0);

  // Commit Delay
  const [commitDelay, setCommitDelay] = useState<number>(() => {
    const saved = localStorage.getItem('profile_commit_delay');
    const parsed = saved ? Number(saved) : 1800;
    return isNaN(parsed) || parsed <= 0 ? 1800 : parsed;
  });

  // SOS Detector
  const [sosConfig] = useState<SosDetectorConfig>(() => loadSosDetectorConfig());
  const [, setSosProgress] = useState<SosProgress>({
    step: 0,
    total: 4,
    pattern: ['.', '-', '.', '-'],
    matchedString: '',
    isCooldown: false,
    cooldownRemaining: 0,
  });
  const sosDetectorRef = useRef<SosBlinkDetector | null>(null);
  if (!sosDetectorRef.current) {
    sosDetectorRef.current = new SosBlinkDetector(
      sosConfig,
      undefined,
      (progress) => setSosProgress(progress)
    );
  }

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const landmarkerRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop camera tracks safely
  const stopCamera = () => {
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
          track.enabled = false;
        });
      } catch (e) {
        console.warn('Error stopping stream tracks:', e);
      }
      streamRef.current = null;
    }
    if (videoRef.current) {
      try {
        if (videoRef.current.srcObject) {
          const s = videoRef.current.srcObject as MediaStream;
          s.getTracks().forEach((track) => {
            track.stop();
            track.enabled = false;
          });
        }
        videoRef.current.pause();
      } catch (e) {
        console.warn('Error stopping video tracks:', e);
      }
      videoRef.current.srcObject = null;
    }
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  };

  const wasClosedRef = useRef<boolean>(false);
  const blinkStartRef = useRef<number>(0);
  const lastBlinkTimeRef = useRef<number>(0);
  const lastFaceSeenTimeRef = useRef<number>(0);

  // Dynamic ES Module importer for MediaPipe
  const loadVisionModule = async () => {
    const urls = [
      window.location.origin + '/wasm/vision_bundle.mjs',
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/vision_bundle.mjs',
      'https://unpkg.com/@mediapipe/tasks-vision@0.10.8/vision_bundle.mjs',
    ];
    for (const url of urls) {
      try {
        const mod = await import(/* @vite-ignore */ url);
        let wasmPrefix;
        if (url.startsWith(window.location.origin)) {
          wasmPrefix = window.location.origin + '/wasm';
        } else {
          const prefix = url.substring(0, url.lastIndexOf('/'));
          wasmPrefix = `${prefix}/wasm`;
        }
        return { vision: mod, wasmPrefix };
      } catch (e) {
        console.warn(`Failed to import ESM vision from ${url}, trying fallback...`);
      }
    }
    throw new Error('All vision bundle ESM URLs failed to load. Check your internet connection.');
  };

  // Load FaceLandmarker on mount
  useEffect(() => {
    let active = true;
    setModelStatus('loading');
    setErrorDetails('');

    const initLandmarker = async () => {
      try {
        const { vision, wasmPrefix } = await loadVisionModule();
        if (!active) return;

        const filesetResolver = await vision.FilesetResolver.forVisionTasks(wasmPrefix);
        if (!active) return;

        const modelUrl = window.location.origin + '/models/face_landmarker.task';
        const fallbackModelUrl =
          'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

        const attempts: { url: string; delegate: 'GPU' | 'CPU' }[] = [
          { url: modelUrl, delegate: 'GPU' },
          { url: modelUrl, delegate: 'CPU' },
          { url: fallbackModelUrl, delegate: 'GPU' },
          { url: fallbackModelUrl, delegate: 'CPU' },
        ];
        let landmarkerInstance: any = null;
        let lastErr: any = null;
        for (const attempt of attempts) {
          if (!active) return;
          try {
            landmarkerInstance = await vision.FaceLandmarker.createFromOptions(filesetResolver, {
              baseOptions: { modelAssetPath: attempt.url, delegate: attempt.delegate },
              runningMode: 'VIDEO',
              outputFaceBlendshapes: false,
            });
            break;
          } catch (e) {
            lastErr = e;
            console.warn(`FaceLandmarker load failed (${attempt.delegate}) from ${attempt.url}, trying next...`, e);
          }
        }
        if (!landmarkerInstance) throw lastErr || new Error('FaceLandmarker failed to load.');

        if (!active) {
          if (landmarkerInstance) landmarkerInstance.close();
          return;
        }

        landmarkerRef.current = landmarkerInstance;
        setModelStatus('ready');
      } catch (err: any) {
        console.error('Critical FaceLandmarker load error:', err);
        if (active) {
          setModelStatus('failed');
          setErrorDetails(err.message || String(err));
        }
      }
    };

    initLandmarker();

    return () => {
      active = false;
      if (landmarkerRef.current) {
        landmarkerRef.current.close();
      }
    };
  }, []);

  // Video Frame loop & FPS measurement
  const frameCountRef = useRef<number>(0);
  const lastFpsUpdateRef = useRef<number>(performance.now());

  useEffect(() => {
    let active = true;
    let animationFrameId: number;

    const processVideoFrame = () => {
      if (!active) return;

      const isCameraActive = useRealWebcam && isTracking;
      if (
        isCameraActive &&
        videoRef.current &&
        videoRef.current.readyState >= 2 &&
        videoRef.current.videoWidth > 0 &&
        landmarkerRef.current
      ) {
        try {
          const timestamp = performance.now();
          const results = landmarkerRef.current.detectForVideo(videoRef.current, timestamp);
          handleLandmarkerResults(results);

          // Update FPS counter every 500ms
          frameCountRef.current++;
          if (timestamp - lastFpsUpdateRef.current >= 500) {
            const calculatedFps = Math.round(
              (frameCountRef.current * 1000) / (timestamp - lastFpsUpdateRef.current)
            );
            setFps(calculatedFps > 0 ? calculatedFps : 30);
            frameCountRef.current = 0;
            lastFpsUpdateRef.current = timestamp;
          }
        } catch (e) {
          // Ignore transient frame dropping
        }
      }

      if (isCameraActive) {
        animationFrameId = requestAnimationFrame(processVideoFrame);
      }
    };

    if (useRealWebcam && isTracking) {
      animationFrameId = requestAnimationFrame(processVideoFrame);
    }

    return () => {
      active = false;
      cancelAnimationFrame(animationFrameId);
    };
  }, [useRealWebcam, isTracking]);

  // Webcam stream lifecycle
  useEffect(() => {
    let isCancelled = false;
    const shouldRunCamera = useRealWebcam && isTracking;

    if (shouldRunCamera) {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setErrorDetails(
          'Camera access is not supported by this browser or is blocked by security policy. A secure HTTPS connection is required.'
        );
        setModelStatus('failed');
        return;
      }

      const startCamera = async () => {
        stopCamera();

        const constraintsList: MediaStreamConstraints[] = [
          { video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } },
          { video: { facingMode: 'user' } },
          { video: true },
        ];

        let stream: MediaStream | null = null;
        let lastErr: any = null;

        for (const constraints of constraintsList) {
          if (isCancelled) break;
          try {
            stream = await navigator.mediaDevices.getUserMedia(constraints);
            break;
          } catch (err) {
            lastErr = err;
          }
        }

        if (isCancelled) {
          if (stream) {
            stream.getTracks().forEach((track) => track.stop());
          }
          return;
        }

        if (stream) {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch((e) => console.warn('Video play failed:', e));
          }
        } else if (lastErr) {
          setErrorDetails(
            'Camera access denied or blocked. Please check your browser permissions to allow webcam access.'
          );
          setModelStatus('failed');
        }
      };

      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      isCancelled = true;
      stopCamera();
    };
  }, [useRealWebcam, isTracking]);

  // Emergency SOS Auto-Trigger Handler
  const lastSosDispatchTimeRef = useRef<number>(0);
  const handleTriggerEmergencySos = useCallback(
    (triggerReason = 'Blink Morse (... --- ...)') => {
      const now = Date.now();
      const cooldown = sosDetectorRef.current?.getConfig().cooldownPeriod ?? 30000;
      if (now - lastSosDispatchTimeRef.current < cooldown) return;
      lastSosDispatchTimeRef.current = now;

      sosDetectorRef.current?.markTriggered();
      playBeep(950, 0.25);
      setTimeout(() => playBeep(1200, 0.3), 150);
      speakText('SOS detected. Sending emergency alert.');

      setMorseBuffer('');
      setCurrentSpellingWord('');
      addBlinkEvent('both', 'SOS');

      if (onOpenSos) {
        onOpenSos();
      }
    },
    [onOpenSos, addBlinkEvent]
  );

  // Synchronize detector configuration
  useEffect(() => {
    if (sosDetectorRef.current) {
      sosDetectorRef.current.setOnTrigger(() => {
        handleTriggerEmergencySos('Blink Sequence (... --- ...)');
      });
      sosDetectorRef.current.setOnProgress((progress) => {
        setSosProgress(progress);
      });
    }
  }, [handleTriggerEmergencySos]);

  // Morse Code Character Commit loop
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();

      // Commit Morse buffer into a character
      if (morseBuffer && now - lastBlinkTimeRef.current > commitDelay) {
        if (morseBuffer === '----') {
          // Morse Command: Backspace
          setCurrentSpellingWord((prev) => prev.slice(0, -1));
          playBeep(600, 0.15);
          addBlinkEvent('right', 'Backspace');
        } else if (morseBuffer === '...---...' || morseBuffer === '... --- ...') {
          handleTriggerEmergencySos('Morse Buffer (...---...)');
        } else if (morseBuffer === '.-.-') {
          // Space / Commit Word
          if (currentSpellingWord) {
            setOutputContainer((prev) => (prev ? `${prev}${currentSpellingWord} ` : `${currentSpellingWord} `));
            speakText(currentSpellingWord);
            setCurrentSpellingWord('');
            playBeep(700, 0.1);
            addBlinkEvent('left', 'Space');
          } else {
            setOutputContainer((prev) => prev + ' ');
            playBeep(600, 0.1);
          }
        } else {
          const char = morseMap[morseBuffer];
          if (char) {
            const nextWord = currentSpellingWord + char;
            setCurrentSpellingWord(nextWord);
            setOutputContainer((prev) => (prev ? `${prev}${char}` : char));
            playBeep(1000, 0.15);
            speakText(char.toLowerCase());
            addBlinkEvent('right', 'Type');

            if (nextWord.trim().toUpperCase().endsWith('SOS')) {
              handleTriggerEmergencySos('Spelled SOS Word');
            }
          } else {
            playBeep(300, 0.2);
          }
        }
        setMorseBuffer('');
        lastBlinkTimeRef.current = now;
      }
    }, 100);

    return () => clearInterval(interval);
  }, [morseBuffer, currentSpellingWord, commitDelay, handleTriggerEmergencySos, addBlinkEvent]);

  // Handle blink input (dot or dash)
  const handleBlinkInput = (symbol: string, duration?: number) => {
    playBeep(900, symbol === '.' ? 0.08 : 0.25);
    setMorseBuffer((prev) => {
      const nextMorse = prev + symbol;
      if (nextMorse === '...---...' || nextMorse.endsWith('...---...')) {
        setTimeout(() => handleTriggerEmergencySos('Morse Buffer (...---...)'), 50);
      }
      return nextMorse;
    });
    setBlinkCount((prev) => prev + 1);
    lastBlinkTimeRef.current = Date.now();

    const isDash = symbol === '-';
    addBlinkEvent(isDash ? 'right' : 'left', isDash ? 'Type' : 'Select');

    if (sosDetectorRef.current && (symbol === '.' || symbol === '-')) {
      sosDetectorRef.current.processBlink(symbol, duration);
    }
  };

  // Custom Neural Network Inference for Blink Tracking
  const predictBlink = (leftEAR: number, rightEAR: number) => {
    const savedThreshold = localStorage.getItem('profile_blink_threshold');
    const bThreshold = savedThreshold ? parseFloat(savedThreshold) : 0.18;
    const scaleFactor = 0.185 / bThreshold;
    const scaledLeft = leftEAR * scaleFactor;
    const scaledRight = rightEAR * scaleFactor;

    const x = [scaledLeft, scaledRight];
    const w1 = blinkModelWeights.w1;
    const b1 = blinkModelWeights.b1;
    const h1_a: number[] = [];
    for (let r = 0; r < w1.length; r++) {
      let sum = b1[r];
      for (let c = 0; c < x.length; c++) {
        sum += w1[r][c] * x[c];
      }
      h1_a.push(Math.max(0, sum));
    }

    const w2 = blinkModelWeights.w2;
    const b2 = blinkModelWeights.b2;
    const out_z: number[] = [];
    for (let r = 0; r < w2.length; r++) {
      let sum = b2[r];
      for (let c = 0; c < h1_a.length; c++) {
        sum += w2[r][c] * h1_a[c];
      }
      out_z.push(sum);
    }

    const maxZ = Math.max(...out_z);
    const exps = out_z.map((z) => Math.exp(z - maxZ));
    const sumExps = exps.reduce((a, b) => a + b, 0);
    const probabilities = exps.map((e) => e / (sumExps || 1e-10));

    let maxIdx = -1;
    let maxProb = -1;
    for (let i = 0; i < probabilities.length; i++) {
      if (probabilities[i] > maxProb) {
        maxProb = probabilities[i];
        maxIdx = i;
      }
    }

    const classes = blinkModelWeights.classes;
    const predictedStateVal = classes[maxIdx] as 'OPEN' | 'BLINK' | 'WINK';

    const probsMap: Record<string, number> = {};
    for (let i = 0; i < classes.length; i++) {
      probsMap[classes[i]] = probabilities[i];
    }

    return {
      state: predictedStateVal,
      confidence: maxProb,
      probabilities: probsMap,
    };
  };

  const handleWinkInput = () => {
    const now = Date.now();
    if (now - lastWinkTimeRef.current > 1500) {
      lastWinkTimeRef.current = now;
      playBeep(450, 0.2);

      if (morseBuffer.length > 0) {
        setMorseBuffer((prev) => prev.slice(0, -1));
        addBlinkEvent('right', 'Backspace');
      } else if (outputContainer.length > 0) {
        setOutputContainer((prev) => prev.slice(0, -1));
        speakText('delete');
        addBlinkEvent('right', 'Backspace');
      }
      lastBlinkTimeRef.current = now;
    }
  };

  const drawEyeContours = (ctx: CanvasRenderingContext2D, landmarks: any[], width: number, height: number) => {
    const leftEyeIndices = [362, 385, 386, 387, 263, 373, 374, 380];
    const rightEyeIndices = [33, 158, 159, 160, 133, 153, 154, 145];

    ctx.fillStyle = '#F4512A';
    ctx.strokeStyle = '#F16B4F';
    ctx.lineWidth = 2;

    const drawContour = (indices: number[]) => {
      ctx.beginPath();
      const p0 = landmarks[indices[0]];
      ctx.moveTo(p0.x * width, p0.y * height);
      for (let i = 1; i < indices.length; i++) {
        const p = landmarks[indices[i]];
        ctx.lineTo(p.x * width, p.y * height);
      }
      ctx.closePath();
      ctx.stroke();

      for (const idx of indices) {
        const p = landmarks[idx];
        ctx.beginPath();
        ctx.arc(p.x * width, p.y * height, 2, 0, 2 * Math.PI);
        ctx.fill();
      }
    };

    drawContour(leftEyeIndices);
    drawContour(rightEyeIndices);
  };

  const handleLandmarkerResults = (results: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const now = performance.now();

    if (results.faceLandmarks && results.faceLandmarks.length > 0) {
      lastFaceSeenTimeRef.current = now;
      const landmarks = results.faceLandmarks[0];
      setFaceDetected(true);

      const dist = (p1: any, p2: any) => Math.hypot(p1.x - p2.x, p1.y - p2.y);
      const leftEARRaw =
        (dist(landmarks[386], landmarks[374]) + dist(landmarks[385], landmarks[380])) /
        (2 * dist(landmarks[362], landmarks[263]));
      const rightEARRaw =
        (dist(landmarks[159], landmarks[145]) + dist(landmarks[160], landmarks[144])) /
        (2 * dist(landmarks[33], landmarks[133]));

      const pushAvg = (buf: number[], v: number) => {
        buf.push(v);
        if (buf.length > 2) buf.shift();
        return buf.reduce((a, b) => a + b, 0) / buf.length;
      };
      const leftEAR = pushAvg(leftEarBufferRef.current, leftEARRaw);
      const rightEAR = pushAvg(rightEarBufferRef.current, rightEARRaw);
      const earVal = parseFloat(((leftEAR + rightEAR) / 2).toFixed(3));

      setEar(earVal);

      if (isTracking) {
        drawEyeContours(ctx, landmarks, canvas.width, canvas.height);
      }

      const updateBaseline = (ref: React.MutableRefObject<number>, earNum: number, wasOpen: boolean) => {
        if (ref.current === 0) {
          ref.current = earNum;
          return earNum;
        }
        if (earNum > ref.current) ref.current = ref.current * 0.9 + earNum * 0.1;
        else if (wasOpen) ref.current = ref.current * 0.997 + earNum * 0.003;
        return ref.current;
      };
      const leftBase = updateBaseline(leftBaselineRef, leftEAR, leftEyeOpen);
      const rightBase = updateBaseline(rightBaselineRef, rightEAR, rightEyeOpen);

      const closedRatio = 0.68;
      const reopenRatio = 0.8;
      const savedThreshold = localStorage.getItem('profile_blink_threshold');
      const bThreshold = savedThreshold ? parseFloat(savedThreshold) : 0.18;

      const closeThresholdLeft = Math.max(leftBase * closedRatio, bThreshold);
      const reopenThresholdLeft = Math.max(leftBase * reopenRatio, bThreshold * 1.18);
      const leftClosed = leftEyeOpen ? leftEAR < closeThresholdLeft : leftEAR < reopenThresholdLeft;

      const closeThresholdRight = Math.max(rightBase * closedRatio, bThreshold);
      const reopenThresholdRight = Math.max(rightBase * reopenRatio, bThreshold * 1.18);
      const rightClosed = rightEyeOpen ? rightEAR < closeThresholdRight : rightEAR < reopenThresholdRight;

      setLeftEyeOpen(!leftClosed);
      setRightEyeOpen(!rightClosed);

      const prediction = predictBlink(leftEAR, rightEAR);
      setConfidence(parseFloat((prediction.confidence * 100).toFixed(1)));

      const bothClosed = leftClosed && rightClosed;
      const oneClosed = leftClosed !== rightClosed;

      const uiState: 'OPEN' | 'BLINK' | 'WINK' = bothClosed ? 'BLINK' : oneClosed ? 'WINK' : 'OPEN';
      setPredictedState(uiState);
      setBlinkProbabilities(prediction.probabilities);

      const endBlinkEpisode = () => {
        if (!wasClosedRef.current) return;
        wasClosedRef.current = false;
        const duration = now - blinkStartRef.current;
        // Threshold in ms from user slider: blinkDurationThreshold * 1000 (default 600ms)
        const thresholdMs = blinkDurationThreshold * 1000;
        if (duration >= 60 && duration < 2000 && isTracking) {
          const classified = duration < thresholdMs ? '.' : '-';
          handleBlinkInput(classified, duration);
        }
      };

      if (bothClosed) {
        if (!wasClosedRef.current) {
          wasClosedRef.current = true;
          blinkStartRef.current = now;
        }
        winkStartRef.current = 0;
      } else if (oneClosed) {
        endBlinkEpisode();
        if (!winkStartRef.current) winkStartRef.current = now;
        if (now - winkStartRef.current > 450 && isTracking) {
          handleWinkInput();
          winkStartRef.current = now + 100000;
        }
      } else {
        endBlinkEpisode();
        winkStartRef.current = 0;
      }
    } else {
      setConfidence(0);
      setPredictedState('OPEN');
      setBlinkProbabilities({ OPEN: 1.0, BLINK: 0.0, WINK: 0.0 });
      setFaceDetected(false);
      setLeftEyeOpen(true);
      setRightEyeOpen(true);
    }
  };

  // Button handlers
  const handleClear = () => {
    setOutputContainer('');
    setCurrentSpellingWord('');
    setMorseBuffer('');
  };

  const handleSpeak = () => {
    if (!outputContainer.trim()) return;
    speakText(outputContainer);
    onAddPhraseHistory(`"${outputContainer}"`, 'Blink');
  };

  const handleAiExpand = async () => {
    if (!outputContainer.trim()) return;
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/ai/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: outputContainer,
          mode: 'blink',
          context: 'Blink to Morse text expansion',
        }),
      });
      const data = await res.json();
      if (data.expanded) {
        setOutputContainer(data.expanded);
      }
    } catch (e) {
      console.warn('AI suggestions fetch failed:', e);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Manual Select (Left Eye) & Type (Right Eye) button triggers
  const handleLeftEyeButton = () => {
    handleBlinkInput('.');
    setPredictedState('BLINK');
    setBlinkProbabilities({ OPEN: 0.02, BLINK: 0.98, WINK: 0.0 });
    setTimeout(() => {
      setPredictedState('OPEN');
      setBlinkProbabilities({ OPEN: 0.98, BLINK: 0.02, WINK: 0.0 });
    }, 200);
  };

  const handleRightEyeButton = () => {
    handleBlinkInput('-');
    setPredictedState('BLINK');
    setBlinkProbabilities({ OPEN: 0.02, BLINK: 0.98, WINK: 0.0 });
    setTimeout(() => {
      setPredictedState('OPEN');
      setBlinkProbabilities({ OPEN: 0.98, BLINK: 0.02, WINK: 0.0 });
    }, 400);
  };

  // Append character selected from Morse Guide
  const handleSelectCharacterFromGuide = (char: string) => {
    setOutputContainer((prev) => (prev ? `${prev}${char}` : char));
    speakText(char.toLowerCase());
    playBeep(1000, 0.1);
  };

  // Navigation handlers
  const openDrawer = useCallback((tab: SettingsTab) => {
    setDrawerTab(tab);
    setDrawerOpen(true);
  }, []);

  const requestSos = useCallback(() => setSosConfirmOpen(true), []);

  const handleSidebar = useCallback(
    (action: SidebarAction) => {
      switch (action.type) {
        case 'tab':
          if (onSelectTab) onSelectTab(action.tab);
          break;
        case 'sos':
          requestSos();
          break;
        case 'reports':
          openDrawer('admin');
          break;
        case 'settings':
          openDrawer('settings');
          break;
      }
    },
    [onSelectTab, openDrawer, requestSos]
  );

  // Notifications and search entries
  const notifications: NotificationEntry[] = useMemo(
    () => [
      { id: '1', title: 'System Status', detail: 'Camera & Vision engine ready', time: '10:24 AM' },
      { id: '2', title: 'Blink Model', detail: 'Accuracy calibrated at 100%', time: '10:20 AM' },
      { id: '3', title: 'Session Armed', detail: 'Emergency SOS watcher active', time: '10:15 AM' },
    ],
    []
  );

  const searchEntries: SearchEntry[] = useMemo(
    () => [
      { id: 'dash', label: 'Dashboard', hint: 'Overview', onSelect: () => onSelectTab && onSelectTab('dashboard') },
      { id: 'blink', label: 'Blink to Text', hint: 'Eye-blink typing', onSelect: () => {} },
      { id: 'sign', label: 'Hand Sign', hint: 'Sign gesture AI', onSelect: () => onSelectTab && onSelectTab('sign') },
      { id: 'morse', label: 'Morse Code', hint: 'Tap translator', onSelect: () => onSelectTab && onSelectTab('morse') },
      { id: 'tts', label: 'Text-to-Speech', hint: 'Synthesizer', onSelect: () => onSelectTab && onSelectTab('tts') },
      { id: 'remote', label: 'Video Call', hint: 'Remote camera', onSelect: () => onSelectTab && onSelectTab('remote') },
    ],
    [onSelectTab]
  );

  return (
    <div
      className="min-h-screen w-full overflow-x-hidden bg-[#F7F7F8] text-[#202938] lg:pl-[280px]"
      style={{ fontFamily: "'Inter', var(--font-body)" }}
    >
      {/* 280px Fixed Left Sidebar */}
      <Sidebar
        activeId="blink"
        onAction={handleSidebar}
        userName={userName}
        userRole={userRole}
        initials={initials}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      <div className="flex min-h-screen min-w-0 flex-col">
        {/* Top Navigation Bar with breadcrumb "Blink to Text" */}
        <Topbar
          userName={userName}
          userRole={userRole}
          initials={initials}
          searchEntries={searchEntries}
          notifications={notifications}
          breadcrumbTitle="Blink to Text"
          onOpenMobileNav={() => setMobileNavOpen(true)}
          onHome={() => onSelectTab && onSelectTab('dashboard')}
          onOpenSettings={() => openDrawer('settings')}
          onLogout={onLogout || (() => {})}
        />

        <main className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-5 px-4 py-6 animate-fade-in sm:px-6 lg:gap-6 lg:px-8 lg:py-7">
          {/* Main Page Header */}
          <section>
            <h1 className="text-[26px] font-bold tracking-tight text-[#202938] sm:text-[30px]">
              Blink to Text
            </h1>
            <p className="mt-1 text-[15px] text-[#6B7280]">
              Convert eye blinks into text in real-time using your webcam.
            </p>
          </section>

          {/* Main Content Grid: 2 Columns on Desktop */}
          <div className="grid grid-cols-1 gap-5 lg:gap-6 lg:grid-cols-12">
            {/* LEFT COLUMN: Live Camera Feed + Morse Guide below it */}
            <div className="flex flex-col gap-5 lg:gap-6 lg:col-span-7">
              {/* Live Camera Feed Card */}
              <LiveCameraFeed
                videoRef={videoRef}
                canvasRef={canvasRef}
                isCameraActive={useRealWebcam && isTracking}
                fps={fps}
                faceDetected={faceDetected}
                leftEyeOpen={leftEyeOpen}
                rightEyeOpen={rightEyeOpen}
                onToggleCamera={() => {
                  const nextState = !useRealWebcam;
                  localStorage.setItem('echolytix_camera_enabled', String(nextState));
                  if (!nextState) {
                    stopCamera();
                  } else {
                    setIsTracking(true);
                  }
                  setUseRealWebcam(nextState);
                  playBeep(750, 0.1);
                }}
                onOpenSettings={() => openDrawer('settings')}
                onLeftEyeClick={handleLeftEyeButton}
                onRightEyeClick={handleRightEyeButton}
                errorDetails={errorDetails}
                modelStatus={modelStatus}
              />

              {/* Morse Guide Card */}
              <MorseGuide
                typingMode={typingMode}
                activeMorse={morseBuffer}
                onSelectCharacter={handleSelectCharacterFromGuide}
              />
            </div>

            {/* RIGHT COLUMN: Current Input, Blink Controls, Neural Blink Tracker, Detected Blinks */}
            <div className="flex flex-col gap-5 lg:gap-6 lg:col-span-5">
              {/* Current Input Card */}
              <CurrentInput
                text={outputContainer}
                morseBuffer={morseBuffer}
                onClear={handleClear}
                onSpeak={handleSpeak}
                onAiExpand={handleAiExpand}
                isAiLoading={isAiLoading}
              />

              {/* Blink Controls Card */}
              <BlinkControls
                blinkThreshold={blinkDurationThreshold}
                onThresholdChange={setBlinkDurationThreshold}
                typingMode={typingMode}
                onTypingModeChange={setTypingMode}
              />

              {/* Neural Blink Tracker Card */}
              <NeuralBlinkTracker
                predictedState={predictedState}
                probabilities={blinkProbabilities}
                accuracy="100.00%"
                architecture="2 in → 8 Hidden → 3 out"
              />

              {/* Detected Blinks (Live) Card */}
              <DetectedBlinks events={detectedBlinksList} />
            </div>
          </div>
        </main>
      </div>

      {/* Settings / Reports slide-over drawer */}
      <SettingsDrawer
        open={drawerOpen}
        initialTab={drawerTab}
        onClose={() => setDrawerOpen(false)}
        patient={patient}
        sessionToken={sessionToken || null}
        recentPhrases={[]}
        onProfileUpdate={onProfileUpdate || (() => {})}
      />

      {/* Emergency SOS confirmation dialog */}
      <SosConfirmDialog
        open={sosConfirmOpen}
        onCancel={() => setSosConfirmOpen(false)}
        onConfirm={() => {
          setSosConfirmOpen(false);
          if (onOpenSos) onOpenSos();
        }}
      />
    </div>
  );
};
