import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { NavTab } from '../types';
import { Sidebar, type SidebarAction } from './dashboard/Sidebar';
import { Topbar, type SearchEntry, type NotificationEntry } from './dashboard/Topbar';
import { SettingsDrawer, type SettingsTab } from './dashboard/SettingsDrawer';
import { SosConfirmDialog } from './dashboard/SosConfirmDialog';
import { DEFAULT_USER } from './dashboard/dashboardData';

// Morse Subcomponents
import { BluetoothSwitchCard } from './morse/BluetoothSwitchCard';
import { KeyMappingModal } from './morse/KeyMappingModal';
import { TapToInputCard } from './morse/TapToInputCard';
import { LiveTranslationCard } from './morse/LiveTranslationCard';
import { NeuralTapClassifierCard } from './morse/NeuralTapClassifierCard';
import { TappingGuideCard } from './morse/TappingGuideCard';

// Classifier, Morse & Audio Utilities
import { classifyTap, type TapPrediction } from '../utils/morseClassifier';
import { translateMorseSymbolToChar } from '../utils/morse';
import { playMorseTone, speakText, playBeep } from '../utils/sound';
import { sendRemoteEvent } from '../utils/remote';

interface MorseTranslatorProps {
  onAddPhraseHistory?: (text: string, mode: 'Blink' | 'Sign' | 'Morse' | 'TTS') => void;
  remoteCode?: string;
  onOpenSos?: () => void;
  onSelectTab?: (tab: NavTab) => void;
  patient?: any;
  sessionToken?: string | null;
  onLogout?: () => void;
  onProfileUpdate?: (updatedPatient: any) => void;
}

export const MorseTranslator: React.FC<MorseTranslatorProps> = ({
  onAddPhraseHistory,
  remoteCode,
  onOpenSos,
  onSelectTab,
  patient,
  sessionToken,
  onLogout,
  onProfileUpdate,
}) => {
  // Shell Navigation & User Info
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<SettingsTab>('settings');
  const [sosModalOpen, setSosModalOpen] = useState(false);

  const userName = patient?.name || DEFAULT_USER.name;
  const userRole = DEFAULT_USER.role;
  const initials = useMemo(() => {
    return userName
      .split(' ')
      .map((part: string) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'AP';
  }, [userName]);

  // Morse Translation & Buffer State
  const [currentSequence, setCurrentSequence] = useState<string>('');
  const [translatedText, setTranslatedText] = useState<string>('');
  const [isPressing, setIsPressing] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Neural Tap Classifier Metrics
  const [tapDuration, setTapDuration] = useState<number>(0);
  const [classifiedSymbol, setClassifiedSymbol] = useState<'NONE' | 'DOT' | 'DASH'>('NONE');
  const [tapConfidence, setTapConfidence] = useState<number>(0);
  const [dotProb, setDotProb] = useState<number>(0);
  const [dashProb, setDashProb] = useState<number>(0);

  const pressStartRef = useRef<number>(0);

  // Bluetooth Switch Key Configuration
  const [triggerKey, setTriggerKey] = useState<string>(() => {
    return localStorage.getItem('echolytix_trigger_key') || ' ';
  });
  const [triggerCode, setTriggerCode] = useState<string>(() => {
    return localStorage.getItem('echolytix_trigger_code') || 'Space';
  });
  const [isMappingModalOpen, setIsMappingModalOpen] = useState<boolean>(false);
  const [letterGapTimeout, setLetterGapTimeout] = useState<number>(1200);

  // Fetch initial preferences from Backend API
  useEffect(() => {
    fetch('/api/morse/settings')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          if (data.trigger_key) setTriggerKey(data.trigger_key);
          if (data.trigger_code) setTriggerCode(data.trigger_code);
          if (data.letter_gap_timeout) setLetterGapTimeout(data.letter_gap_timeout);
        }
      })
      .catch((err) => {
        console.warn('Using local morse settings fallback:', err);
      });
  }, []);

  // Save Settings to Backend & LocalStorage
  const handleSaveKeyMapping = async (newKey: string, newCode: string) => {
    setTriggerKey(newKey);
    setTriggerCode(newCode);
    localStorage.setItem('echolytix_trigger_key', newKey);
    localStorage.setItem('echolytix_trigger_code', newCode);

    try {
      await fetch('/api/morse/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
        },
        body: JSON.stringify({
          trigger_key: newKey,
          trigger_code: newCode,
          letter_gap_timeout: letterGapTimeout,
        }),
      });
    } catch (e) {
      console.warn('Could not save morse settings to server:', e);
    }
  };

  const handleResetKeyMapping = async () => {
    handleSaveKeyMapping(' ', 'Space');
  };

  // Pointer & Touch Press Start
  const handlePressStart = (e: React.PointerEvent | React.MouseEvent | React.TouchEvent | KeyboardEvent) => {
    if ('cancelable' in e && e.cancelable && e.type !== 'pointerdown') {
      e.preventDefault();
    }
    pressStartRef.current = Date.now();
    setIsPressing(true);
  };

  // Pointer & Touch Press End
  const handlePressEnd = useCallback(() => {
    if (!pressStartRef.current) return;

    const duration = Date.now() - pressStartRef.current;
    pressStartRef.current = 0;
    setIsPressing(false);

    // Run Neural Network Inference on Tap Duration
    const prediction: TapPrediction = classifyTap(duration);
    const isDash = prediction.class === 'DASH';
    const symbol = isDash ? '—' : '·';

    setTapDuration(duration);
    setClassifiedSymbol(prediction.class);
    setTapConfidence(prediction.confidence);
    setDotProb(prediction.probabilities.DOT);
    setDashProb(prediction.probabilities.DASH);

    // Play Acoustic Audio Feedback
    playMorseTone(isDash);

    // Append Symbol to Current Morse Buffer
    setCurrentSequence((prev) => (prev ? `${prev} ${symbol}` : symbol));
  }, []);

  // Commit Sequence into Final Character
  const handleCommitSequence = useCallback(() => {
    if (!currentSequence.trim()) return;

    // Check for SOS prosign sequence: ...---...
    const cleanSeq = currentSequence.replace(/\s+/g, '').replace(/·/g, '.').replace(/—/g, '-');
    if (cleanSeq === '...---...') {
      playBeep(950, 0.3);
      if (onOpenSos) onOpenSos();
      else setSosModalOpen(true);
      setCurrentSequence('');
      return;
    }

    const char = translateMorseSymbolToChar(currentSequence);
    if (char && char !== '?') {
      const nextText = translatedText + char;
      setTranslatedText(nextText);
      speakText(char.toLowerCase());

      // Check if text ends with SOS
      if (nextText.trim().endsWith('SOS')) {
        playBeep(950, 0.3);
        if (onOpenSos) onOpenSos();
        else setSosModalOpen(true);
      }

      if (remoteCode) {
        sendRemoteEvent(remoteCode, 'char', char);
        sendRemoteEvent(remoteCode, 'speak', char.toLowerCase());
      }
    } else {
      playBeep(350, 0.2, 'triangle'); // Error feedback for invalid sequences
      if (remoteCode) {
        sendRemoteEvent(remoteCode, 'beep', { freq: 350, duration: 0.2 });
      }
    }

    setCurrentSequence('');
  }, [currentSequence, translatedText, remoteCode, onOpenSos]);

  // Auto-commit sequence when idle for letterGapTimeout
  useEffect(() => {
    if (!currentSequence) return;

    const timer = setTimeout(() => {
      handleCommitSequence();
    }, letterGapTimeout);

    return () => clearTimeout(timer);
  }, [currentSequence, letterGapTimeout, handleCommitSequence]);

  // Keyboard Event Handlers for switch key input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't hijack if user is typing inside an input or textarea or mapping modal
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        isMappingModalOpen
      ) {
        return;
      }

      const isTrigger = e.key === triggerKey || e.code === triggerCode;
      if (isTrigger) {
        e.preventDefault(); // Prevent browser scrolling on Spacebar!
        if (isPressing) return;
        pressStartRef.current = Date.now();
        setIsPressing(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        isMappingModalOpen
      ) {
        return;
      }

      const isTrigger = e.key === triggerKey || e.code === triggerCode;
      if (isTrigger) {
        e.preventDefault();
        handlePressEnd();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPressing, handlePressEnd, isMappingModalOpen, triggerKey, triggerCode]);

  // Actions for Live Translation
  const handleAddSpace = () => {
    setTranslatedText((prev) => prev + ' ');
    if (remoteCode) sendRemoteEvent(remoteCode, 'char', ' ');
  };

  const handleDeleteLastLetter = () => {
    setTranslatedText((prev) => {
      if (!prev) return '';
      if (remoteCode) sendRemoteEvent(remoteCode, 'backspace', '');
      return prev.slice(0, -1);
    });
  };

  const handleClearAll = () => {
    setCurrentSequence('');
    setTranslatedText('');
    if (remoteCode) sendRemoteEvent(remoteCode, 'clear', '');
  };

  const handleCopy = () => {
    if (!translatedText) return;
    navigator.clipboard.writeText(translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = () => {
    if (!translatedText.trim()) return;
    setIsSpeaking(true);
    speakText(translatedText);
    onAddPhraseHistory?.(translatedText, 'Morse');

    // Post to backend history
    fetch('/api/morse/history', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
      },
      body: JSON.stringify({
        text: translatedText,
        morse_sequence: currentSequence,
      }),
    }).catch((e) => console.warn('Could not post to morse history:', e));

    if (remoteCode) {
      sendRemoteEvent(remoteCode, 'phrase', translatedText);
      sendRemoteEvent(remoteCode, 'speak', translatedText);
    }
    setTimeout(() => setIsSpeaking(false), 1500);
  };

  const handleInsertPhrase = (phraseLabel: string, morse: string) => {
    setTranslatedText((prev) =>
      prev ? `${prev} ${phraseLabel.toUpperCase()}` : phraseLabel.toUpperCase()
    );
    setCurrentSequence(morse);
    if (remoteCode) {
      sendRemoteEvent(remoteCode, 'word', phraseLabel.toUpperCase());
      sendRemoteEvent(remoteCode, 'speak', phraseLabel);
    }
  };

  // Sidebar Action Handler
  const handleSidebarAction = (action: SidebarAction) => {
    setMobileNavOpen(false);
    if (action.type === 'tab') {
      onSelectTab?.(action.tab);
    } else if (action.type === 'sos') {
      setSosModalOpen(true);
    } else if (action.type === 'settings' || action.type === 'reports') {
      setDrawerTab(action.type === 'reports' ? 'admin' : 'settings');
      setDrawerOpen(true);
    }
  };

  const notifications: NotificationEntry[] = useMemo(
    () => [
      { id: '1', title: 'Neural Tap Engine', detail: 'Real-time tap classification active', time: '10:24 AM' },
      { id: '2', title: 'Bluetooth Switch', detail: `Trigger mapped to ${triggerCode === 'Space' ? 'Spacebar' : triggerKey}`, time: '10:20 AM' },
      { id: '3', title: 'Audio Synthesizer', detail: 'Acoustic tone feedback enabled', time: '10:15 AM' },
    ],
    [triggerCode, triggerKey]
  );

  const searchEntries: SearchEntry[] = useMemo(
    () => [
      { id: 'dash', label: 'Dashboard', hint: 'Overview', onSelect: () => onSelectTab?.('dashboard') },
      { id: 'blink', label: 'Blink to Text', hint: 'Eye-blink typing', onSelect: () => onSelectTab?.('blink') },
      { id: 'sign', label: 'Hand Sign', hint: 'Hand gesture AI', onSelect: () => onSelectTab?.('sign') },
      { id: 'morse', label: 'Morse Code', hint: 'Tap translator', onSelect: () => {} },
      { id: 'tts', label: 'Text-to-Speech', hint: 'Synthesizer', onSelect: () => onSelectTab?.('tts') },
      { id: 'remote', label: 'Video Call', hint: 'Accessible communication', onSelect: () => onSelectTab?.('remote') },
    ],
    [onSelectTab]
  );

  const mappedKeyDisplayName =
    triggerCode === 'Space' || triggerKey === ' '
      ? 'Spacebar'
      : triggerKey.length === 1
      ? triggerKey.toUpperCase()
      : triggerCode || triggerKey;

  return (
    <div className="flex min-h-screen bg-[#F7F7F8] font-body text-[#202938]">
      {/* 1. Left Fixed Sidebar */}
      <Sidebar
        activeId="morse"
        onAction={handleSidebarAction}
        userName={userName}
        userRole={userRole}
        initials={initials}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      {/* 2. Main Content Viewport */}
      <div className="flex flex-1 flex-col lg:pl-[275px]">
        {/* Top Navigation Bar */}
        <Topbar
          breadcrumbTitle="Morse Code"
          onOpenMobileNav={() => setMobileNavOpen(true)}
          userName={userName}
          userRole={userRole}
          initials={initials}
          searchEntries={searchEntries}
          notifications={notifications}
          onHome={() => onSelectTab?.('dashboard')}
          onOpenSettings={() => {
            setDrawerTab('settings');
            setDrawerOpen(true);
          }}
          onLogout={onLogout || (() => {})}
        />

        {/* Page Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-7 space-y-5 max-w-[1600px] w-full mx-auto">
          {/* Page Header matching screenshot */}
          <div>
            <h1 className="text-2xl sm:text-[26px] font-bold text-[#17213A] tracking-tight">
              Morse Code Translator
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-[#718096]">
              Translate taps into text using short and long presses.
            </p>
          </div>

          {/* Full-Width Bluetooth Switch Key Card matching reference screenshot */}
          <BluetoothSwitchCard
            mappedKeyName={mappedKeyDisplayName}
            onOpenMapKeyModal={() => setIsMappingModalOpen(true)}
          />

          {/* Main 2-Column Dashboard Layout */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-stretch">
            {/* Left Column: Tap to Input & Live Translation */}
            <div className="flex flex-col gap-5">
              <TapToInputCard
                isPressing={isPressing}
                currentSequence={currentSequence}
                onPressStart={handlePressStart}
                onPressEnd={handlePressEnd}
              />
              <LiveTranslationCard
                translatedText={translatedText}
                isSpeaking={isSpeaking}
                copied={copied}
                onChangeText={setTranslatedText}
                onCopy={handleCopy}
                onSpeak={handleSpeak}
                onAddSpace={handleAddSpace}
                onDeleteLastLetter={handleDeleteLastLetter}
                onClearAll={handleClearAll}
              />
            </div>

            {/* Right Column: Neural Tap Classifier & Tapping Guide / Quick Phrases */}
            <div className="flex flex-col gap-5">
              <NeuralTapClassifierCard
                durationMs={tapDuration}
                classified={classifiedSymbol}
                confidence={tapConfidence}
                dotProb={dotProb}
                dashProb={dashProb}
              />
              <TappingGuideCard onInsertPhrase={handleInsertPhrase} />
            </div>
          </div>
        </main>
      </div>

      {/* Modals & Drawers */}
      <KeyMappingModal
        isOpen={isMappingModalOpen}
        onClose={() => setIsMappingModalOpen(false)}
        currentKey={triggerKey}
        currentCode={triggerCode}
        onSave={handleSaveKeyMapping}
        onReset={handleResetKeyMapping}
      />

      {/* Global Settings & Reports Drawer */}
      <SettingsDrawer
        open={drawerOpen}
        initialTab={drawerTab}
        onClose={() => setDrawerOpen(false)}
        patient={patient}
        sessionToken={sessionToken || null}
        recentPhrases={[]}
        onProfileUpdate={onProfileUpdate || (() => {})}
      />

      {/* SOS Confirmation Dialog */}
      <SosConfirmDialog
        open={sosModalOpen}
        onCancel={() => setSosModalOpen(false)}
        onConfirm={() => {
          setSosModalOpen(false);
          onOpenSos?.();
        }}
      />
    </div>
  );
};
export default MorseTranslator;
