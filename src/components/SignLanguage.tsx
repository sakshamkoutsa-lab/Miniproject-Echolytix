import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { NavTab } from '../types';
import { speakText, playBeep } from '../utils/sound';
import { sendRemoteEvent } from '../utils/remote';
import { classifyGesture, FingerStates } from '../utils/gesture';

// New layout subcomponents
import { Sidebar, type SidebarAction } from './dashboard/Sidebar';
import { Topbar, type SearchEntry, type NotificationEntry } from './dashboard/Topbar';
import { SettingsDrawer, type SettingsTab } from './dashboard/SettingsDrawer';
import { SosConfirmDialog } from './dashboard/SosConfirmDialog';
import { DEFAULT_USER } from './dashboard/dashboardData';

// Hand Sign specific components
import { LiveCameraFeed } from './handsign/LiveCameraFeed';
import { TranslationPanel } from './handsign/TranslationPanel';
import { GeometricGestureEngine } from './handsign/GeometricGestureEngine';
import { GestureCheatSheet } from './handsign/GestureCheatSheet';

const EMPTY_FINGERS: FingerStates = { thumb: false, index: false, middle: false, ring: false, pinky: false };

interface SignLanguageProps {
  onAddPhraseHistory: (text: string, mode: 'Sign') => void;
  remoteCode?: string;
  onOpenSos?: () => void;
  // Navigation & session integration with main app
  onSelectTab?: (tab: NavTab) => void;
  patient?: any;
  sessionToken?: string | null;
  onLogout?: () => void;
  onProfileUpdate?: (updatedPatient: any) => void;
}

const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('') || 'AP';

export const SignLanguage: React.FC<SignLanguageProps> = ({
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

  // Recognition and text state
  const [currentGesture, setCurrentGesture] = useState<string>('None');
  const [constructedPhrase, setConstructedPhrase] = useState<string>('HELLO');
  const [confidence, setConfidence] = useState<number>(0);
  const [fps, setFps] = useState<number>(30);
  const [isSkeletonActive] = useState<boolean>(true);
  const [cameraFacing] = useState<'user' | 'environment'>('user');

  // Real Webcam and model status
  const [useRealWebcam, setUseRealWebcam] = useState<boolean>(() => {
    return true; // Start camera by default
  });
  const [isRecognitionActive, setIsRecognitionActive] = useState<boolean>(true);
  const [modelStatus, setModelStatus] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [errorDetails, setErrorDetails] = useState<string>('');

  // Geometric gesture states
  const [probabilities, setProbabilities] = useState<Record<string, number>>({});
  const [fingerStates, setFingerStates] = useState<FingerStates>(EMPTY_FINGERS);
  const [handDetected, setHandDetected] = useState<boolean>(false);

  // Buffer of recent predictions for temporal smoothing
  const predictionBufferRef = useRef<string[]>([]);
  const lastAppendedGestureRef = useRef<string>('');
  const gestureHoldStartRef = useRef<number>(0);
  const activeGestureRef = useRef<string>('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const landmarkerRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Safely stop and release all camera hardware tracks
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
        console.warn('Error stopping video srcObject tracks:', e);
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

  // Load MediaPipe HandLandmarker on mount
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

        const modelUrl = window.location.origin + '/models/hand_landmarker.task';
        const fallbackModelUrl =
          'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

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
            landmarkerInstance = await vision.HandLandmarker.createFromOptions(filesetResolver, {
              baseOptions: { modelAssetPath: attempt.url, delegate: attempt.delegate },
              runningMode: 'VIDEO',
              numHands: 1,
              minHandDetectionConfidence: 0.4,
              minHandPresenceConfidence: 0.4,
              minTrackingConfidence: 0.4,
            });
            break;
          } catch (e) {
            lastErr = e;
            console.warn(`HandLandmarker load failed (${attempt.delegate}) from ${attempt.url}, trying next...`, e);
          }
        }
        if (!landmarkerInstance) throw lastErr || new Error('HandLandmarker failed to load.');

        if (!active) {
          if (landmarkerInstance) landmarkerInstance.close();
          return;
        }

        landmarkerRef.current = landmarkerInstance;
        setModelStatus('ready');
      } catch (err: any) {
        console.error('Critical MediaPipe load error:', err);
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

  // Frame processing loop when webcam is running
  const frameCountRef = useRef<number>(0);
  const lastFpsUpdateRef = useRef<number>(performance.now());

  useEffect(() => {
    let active = true;
    let animationFrameId: number;

    const processVideoFrame = () => {
      if (!active) return;

      if (
        useRealWebcam &&
        isRecognitionActive &&
        videoRef.current &&
        videoRef.current.readyState >= 2 &&
        videoRef.current.videoWidth > 0 &&
        landmarkerRef.current
      ) {
        try {
          const timestamp = performance.now();
          const results = landmarkerRef.current.detectForVideo(videoRef.current, timestamp);
          handleLandmarkerResults(results);

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
          // Ignore transient frame drop
        }
      }

      if (useRealWebcam) {
        animationFrameId = requestAnimationFrame(processVideoFrame);
      }
    };

    if (useRealWebcam) {
      animationFrameId = requestAnimationFrame(processVideoFrame);
    }

    return () => {
      active = false;
      cancelAnimationFrame(animationFrameId);
    };
  }, [useRealWebcam, isRecognitionActive]);

  // Webcam stream lifecycle
  useEffect(() => {
    let isCancelled = false;

    if (useRealWebcam) {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setErrorDetails(
          'Camera access is not supported by this browser or is blocked. Please check browser permissions.'
        );
        setModelStatus('failed');
        return;
      }

      const startCamera = async () => {
        stopCamera();

        const constraintsList: MediaStreamConstraints[] = [
          {
            video: {
              facingMode: cameraFacing === 'user' ? 'user' : 'environment',
              width: { ideal: 640 },
              height: { ideal: 480 },
            },
          },
          { video: { facingMode: cameraFacing === 'user' ? 'user' : 'environment' } },
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
          setErrorDetails('Camera access denied or blocked. Please check your browser permissions.');
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
  }, [useRealWebcam, cameraFacing]);

  // Temporal smoothing for gesture recognition
  const smoothGesture = (gesture: string): string => {
    const buf = predictionBufferRef.current;
    buf.push(gesture);
    if (buf.length > 6) buf.shift();

    const counts: Record<string, number> = {};
    for (const g of buf) counts[g] = (counts[g] || 0) + 1;

    let best = 'None';
    let bestCount = 0;
    for (const [g, c] of Object.entries(counts)) {
      if (c > bestCount) {
        bestCount = c;
        best = g;
      }
    }
    return bestCount >= Math.ceil(buf.length * 0.6) ? best : 'None';
  };

  const drawSkeleton = (ctx: CanvasRenderingContext2D, landmarks: any[], width: number, height: number) => {
    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4],
      [0, 5], [5, 6], [6, 7], [7, 8],
      [9, 10], [10, 11], [11, 12],
      [13, 14], [14, 15], [15, 16],
      [0, 17], [17, 18], [18, 19], [19, 20],
      [5, 9], [9, 13], [13, 17],
    ];

    ctx.strokeStyle = '#F4512A';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    for (const [start, end] of connections) {
      const pStart = landmarks[start];
      const pEnd = landmarks[end];
      if (pStart && pEnd) {
        ctx.beginPath();
        ctx.moveTo(pStart.x * width, pStart.y * height);
        ctx.lineTo(pEnd.x * width, pEnd.y * height);
        ctx.stroke();
      }
    }

    ctx.fillStyle = '#FFFFFF';
    for (const lm of landmarks) {
      ctx.beginPath();
      ctx.arc(lm.x * width, lm.y * height, 4.5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = '#F4512A';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  };

  const handleLandmarkerResults = (results: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (results.landmarks && results.landmarks.length > 0) {
      const landmarks = results.landmarks[0];

      if (isSkeletonActive) {
        drawSkeleton(ctx, landmarks, canvas.width, canvas.height);
      }

      const prediction = classifyGesture(landmarks);
      const confPct = parseFloat((prediction.confidence * 100).toFixed(1));

      setConfidence(confPct);
      setProbabilities(prediction.probabilities);
      setFingerStates(prediction.fingers);
      setHandDetected(true);

      const stable = smoothGesture(prediction.confidence >= 0.8 ? prediction.gesture : 'None');
      const filteredGesture = stable !== 'None' && prediction.confidence >= 0.8 ? stable : 'None';

      if (filteredGesture !== 'None') {
        if (activeGestureRef.current !== filteredGesture) {
          activeGestureRef.current = filteredGesture;
          setCurrentGesture(filteredGesture);
          gestureHoldStartRef.current = Date.now();
        } else {
          const holdTime = Date.now() - gestureHoldStartRef.current;
          if (holdTime >= 1200 && lastAppendedGestureRef.current !== filteredGesture) {
            setConstructedPhrase((prev) => {
              if (!prev) return filteredGesture;
              return prev.endsWith(' ') ? `${prev}${filteredGesture}` : `${prev} ${filteredGesture}`;
            });
            lastAppendedGestureRef.current = filteredGesture;
            playBeep(850, 0.1);
            speakText(filteredGesture.toLowerCase());
            if (remoteCode) {
              sendRemoteEvent(remoteCode, 'word', filteredGesture);
            }
          }
        }
      } else {
        activeGestureRef.current = '';
        setCurrentGesture('None');
        lastAppendedGestureRef.current = '';
        gestureHoldStartRef.current = 0;
      }
    } else {
      activeGestureRef.current = '';
      setCurrentGesture('None');
      lastAppendedGestureRef.current = '';
      gestureHoldStartRef.current = 0;
      setConfidence(0);
      setProbabilities({});
      setFingerStates(EMPTY_FINGERS);
      setHandDetected(false);
    }
  };

  // Actions for Translation Panel
  const handleDeleteWord = () => {
    setConstructedPhrase((prev) => {
      const trimmed = prev.trim();
      const lastSpaceIndex = trimmed.lastIndexOf(' ');
      if (lastSpaceIndex === -1) return '';
      return trimmed.slice(0, lastSpaceIndex);
    });
    playBeep(600, 0.1);
  };

  const handleClearAll = () => {
    setConstructedPhrase('');
    setCurrentGesture('None');
    playBeep(500, 0.1);
  };

  const handleSubmit = () => {
    if (!constructedPhrase.trim()) return;
    speakText(constructedPhrase);
    onAddPhraseHistory(`"${constructedPhrase}"`, 'Sign');
    playBeep(1000, 0.15);
  };

  const handleSelectGestureFromCheatSheet = (gesture: string) => {
    setConstructedPhrase((prev) => {
      if (!prev) return gesture;
      return prev.endsWith(' ') ? `${prev}${gesture}` : `${prev} ${gesture}`;
    });
    setCurrentGesture(gesture);
    speakText(gesture.toLowerCase());
    playBeep(900, 0.1);
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

  const notifications: NotificationEntry[] = useMemo(
    () => [
      { id: '1', title: 'Hand Sign Engine', detail: 'Geometric finger detector ready', time: '10:24 AM' },
      { id: '2', title: 'Camera Calibrated', detail: '30 FPS streaming at 640x480', time: '10:20 AM' },
      { id: '3', title: 'System Armed', detail: 'Emergency SOS watcher active', time: '10:15 AM' },
    ],
    []
  );

  const searchEntries: SearchEntry[] = useMemo(
    () => [
      { id: 'dash', label: 'Dashboard', hint: 'Overview', onSelect: () => onSelectTab && onSelectTab('dashboard') },
      { id: 'blink', label: 'Blink to Text', hint: 'Eye-blink typing', onSelect: () => onSelectTab && onSelectTab('blink') },
      { id: 'sign', label: 'Hand Sign', hint: 'Hand gesture AI', onSelect: () => {} },
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
        activeId="sign"
        onAction={handleSidebar}
        userName={userName}
        userRole={userRole}
        initials={initials}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      <div className="flex min-h-screen min-w-0 flex-col">
        {/* Top Navigation Bar with breadcrumb "Hand Sign" */}
        <Topbar
          userName={userName}
          userRole={userRole}
          initials={initials}
          searchEntries={searchEntries}
          notifications={notifications}
          breadcrumbTitle="Hand Sign"
          onOpenMobileNav={() => setMobileNavOpen(true)}
          onHome={() => onSelectTab && onSelectTab('dashboard')}
          onOpenSettings={() => openDrawer('settings')}
          onLogout={onLogout || (() => {})}
        />

        <main className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-5 px-4 py-6 animate-fade-in sm:px-6 lg:gap-6 lg:px-8 lg:py-7">
          {/* Main Page Header */}
          <section>
            <h1 className="text-[26px] font-bold tracking-tight text-[#202938] sm:text-[30px]">
              Hand Sign Recognition
            </h1>
            <p className="mt-1 text-[15px] text-[#6B7280]">
              Recognize hand gestures in real time and translate them into text.
            </p>
          </section>

          {/* Main Content Grid: Two-Column Layout */}
          <div className="grid grid-cols-1 gap-5 lg:gap-6 lg:grid-cols-12">
            {/* LEFT COLUMN: Live Camera Feed + Geometric Gesture Engine below it */}
            <div className="flex flex-col gap-5 lg:gap-6 lg:col-span-7">
              {/* Live Camera Feed Card */}
              <LiveCameraFeed
                videoRef={videoRef}
                canvasRef={canvasRef}
                isCameraActive={useRealWebcam}
                isRecognitionActive={isRecognitionActive}
                fps={fps}
                handDetected={handDetected}
                onStartRecognition={() => {
                  setUseRealWebcam(true);
                  setIsRecognitionActive(true);
                  playBeep(750, 0.1);
                }}
                onTurnOffCamera={() => {
                  setUseRealWebcam(false);
                  setIsRecognitionActive(false);
                  stopCamera();
                  playBeep(500, 0.1);
                }}
                onOpenSettings={() => openDrawer('settings')}
                errorDetails={errorDetails}
                modelStatus={modelStatus}
              />

              {/* Geometric Gesture Engine Card */}
              <GeometricGestureEngine
                handDetected={handDetected}
                fingerStates={fingerStates}
                probabilities={probabilities}
              />
            </div>

            {/* RIGHT COLUMN: Translation Card + Gesture Cheat Sheet below it */}
            <div className="flex flex-col gap-5 lg:gap-6 lg:col-span-5">
              {/* Translation Card */}
              <TranslationPanel
                currentGesture={currentGesture}
                confidence={confidence}
                translatedText={constructedPhrase}
                onTextChange={setConstructedPhrase}
                onDeleteWord={handleDeleteWord}
                onClearAll={handleClearAll}
                onSubmit={handleSubmit}
              />

              {/* Gesture Cheat Sheet Card */}
              <GestureCheatSheet onSelectGesture={handleSelectGestureFromCheatSheet} />
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
