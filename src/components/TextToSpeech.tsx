import React, { useState, useEffect, useMemo, useRef } from 'react';
import { NavTab } from '../types';
import { Sidebar, type SidebarAction } from './dashboard/Sidebar';
import { Topbar, type SearchEntry, type NotificationEntry } from './dashboard/Topbar';
import { SettingsDrawer, type SettingsTab } from './dashboard/SettingsDrawer';
import { SosConfirmDialog } from './dashboard/SosConfirmDialog';
import { DEFAULT_USER } from './dashboard/dashboardData';

// TTS Subcomponents
import { TextMessageInputCard } from './tts/TextMessageInputCard';
import { VoiceControlsCard } from './tts/VoiceControlsCard';
import { PhraseBoardCard, type CategoryData } from './tts/PhraseBoardCard';
import { AIPolisherModal } from './tts/AIPolisherModal';
import { AddCategoryModal } from './tts/AddCategoryModal';
import { AddPhraseModal } from './tts/AddPhraseModal';

// Utilities
import { speakText } from '../utils/sound';
import { sendRemoteEvent } from '../utils/remote';

interface TextToSpeechProps {
  onAddPhraseHistory?: (text: string, mode: 'Blink' | 'Sign' | 'Morse' | 'TTS') => void;
  remoteCode?: string;
  onOpenSos?: () => void;
  onSelectTab?: (tab: NavTab) => void;
  patient?: any;
  sessionToken?: string | null;
  onLogout?: () => void;
  onProfileUpdate?: (updatedPatient: any) => void;
}

const DEFAULT_CATEGORIES: CategoryData[] = [
  {
    id: 1,
    category: 'URGENT NEEDS',
    phrases: [
      'I need my medicine immediately.',
      'I am feeling pain, please help.',
      'Please call my nurse or family.',
      'I need water or a drink.',
    ],
  },
  {
    id: 2,
    category: 'DAILY COMFORT',
    phrases: [
      'Please adjust my pillow position.',
      'I am tired.',
      'I want to rest.',
      'I need to use the bathroom.',
    ],
  },
];

export const TextToSpeech: React.FC<TextToSpeechProps> = ({
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

  // Message & Speech States
  const [textInput, setTextInput] = useState<string>('Hello, I am using Echolytix to communicate.');
  const [rate, setRate] = useState<number>(() => {
    const saved = localStorage.getItem('echolytix_tts_rate');
    return saved ? parseFloat(saved) : 1.0;
  });
  const [pitch, setPitch] = useState<number>(() => {
    const saved = localStorage.getItem('echolytix_tts_pitch');
    return saved ? parseFloat(saved) : 1.0;
  });
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>(() => {
    return localStorage.getItem('echolytix_tts_voice') || '';
  });
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [speakingPhrase, setSpeakingPhrase] = useState<string | null>(null);

  // Phrase Categories
  const [categories, setCategories] = useState<CategoryData[]>(DEFAULT_CATEGORIES);

  // Modals
  const [aiPolisherOpen, setAiPolisherOpen] = useState(false);
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [addPhraseCategory, setAddPhraseCategory] = useState<{ id: number; name: string } | null>(null);

  // Fetch Categories from Database API
  useEffect(() => {
    fetch('/api/categories')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: any[]) => {
        if (Array.isArray(data) && data.length > 0) {
          // Normalize categories to match uppercase display if matching default
          const normalized = data.map((cat) => ({
            id: cat.id,
            category: cat.category.toUpperCase(),
            phrases: cat.phrases || [],
          }));
          setCategories(normalized);
        }
      })
      .catch((err) => console.warn('Categories API unavailable, using defaults:', err));
  }, []);

  // Fetch Stored TTS Preferences from Server
  useEffect(() => {
    fetch('/api/tts/preferences')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          if (data.rate) setRate(data.rate);
          if (data.pitch) setPitch(data.pitch);
          if (data.voice) setSelectedVoice(data.voice);
        }
      })
      .catch((err) => console.warn('Could not load TTS preferences from server:', err));
  }, []);

  // Populate System Voices
  useEffect(() => {
    const updateVoices = () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const vList = window.speechSynthesis.getVoices();
        setVoices(vList);
        if (vList.length > 0 && !selectedVoice) {
          const defaultV = vList.find((v) => v.default || v.lang.startsWith('en')) || vList[0];
          setSelectedVoice(defaultV.name);
        }
      }
    };

    updateVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, [selectedVoice]);

  // Persist Rate / Pitch / Voice changes
  const handleUpdateRate = (newRate: number) => {
    setRate(newRate);
    localStorage.setItem('echolytix_tts_rate', String(newRate));
    fetch('/api/tts/preferences', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
      },
      body: JSON.stringify({ rate: newRate }),
    }).catch(() => {});
  };

  const handleUpdatePitch = (newPitch: number) => {
    setPitch(newPitch);
    localStorage.setItem('echolytix_tts_pitch', String(newPitch));
    fetch('/api/tts/preferences', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
      },
      body: JSON.stringify({ pitch: newPitch }),
    }).catch(() => {});
  };

  const handleSelectVoice = (voiceName: string) => {
    setSelectedVoice(voiceName);
    localStorage.setItem('echolytix_tts_voice', voiceName);
    fetch('/api/tts/preferences', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
      },
      body: JSON.stringify({ voice: voiceName }),
    }).catch(() => {});
  };

  // Main Speech Execution
  const handleSpeakMessage = () => {
    if (!textInput.trim()) return;

    window.speechSynthesis?.cancel();
    setIsSpeaking(true);
    setSpeakingPhrase(null);

    speakText(textInput, selectedVoice, rate, pitch);
    onAddPhraseHistory?.(`"${textInput}"`, 'TTS');

    if (remoteCode) {
      sendRemoteEvent(remoteCode, 'phrase', textInput);
      sendRemoteEvent(remoteCode, 'speak', textInput);
    }

    // Estimate speaking duration
    const words = textInput.trim().split(/\s+/).filter(Boolean).length;
    const durSec = Math.max(1.5, (words / (140 * rate)) * 60);
    setTimeout(() => {
      setIsSpeaking(false);
    }, durSec * 1000);
  };

  // Speak Quick Phrase from Board
  const handleSpeakPhrase = (phraseText: string) => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(true);
    setSpeakingPhrase(phraseText);

    speakText(phraseText, selectedVoice, rate, pitch);
    onAddPhraseHistory?.(`"${phraseText}"`, 'TTS');

    if (remoteCode) {
      sendRemoteEvent(remoteCode, 'phrase', phraseText);
      sendRemoteEvent(remoteCode, 'speak', phraseText);
    }

    const words = phraseText.trim().split(/\s+/).filter(Boolean).length;
    const durSec = Math.max(1.5, (words / (140 * rate)) * 60);
    setTimeout(() => {
      setIsSpeaking(false);
      setSpeakingPhrase(null);
    }, durSec * 1000);
  };

  // Clear Input Box
  const handleClearBox = () => {
    setTextInput('');
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
    setSpeakingPhrase(null);
    if (remoteCode) sendRemoteEvent(remoteCode, 'clear', '');
  };

  // Add Category Handler
  const handleAddCategory = async (categoryName: string) => {
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: categoryName }),
      });
      if (res.ok) {
        const added = await res.json();
        setCategories((prev) => [
          ...prev,
          { id: added.id, category: added.category.toUpperCase(), phrases: [] },
        ]);
      } else {
        // Fallback local
        setCategories((prev) => [
          ...prev,
          { id: Date.now(), category: categoryName.toUpperCase(), phrases: [] },
        ]);
      }
    } catch (e) {
      setCategories((prev) => [
        ...prev,
        { id: Date.now(), category: categoryName.toUpperCase(), phrases: [] },
      ]);
    }
  };

  // Add Phrase Handler
  const handleAddPhrase = async (catId: number, phraseText: string) => {
    try {
      const res = await fetch(`/api/categories/${catId}/phrases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: phraseText }),
      });
      if (res.ok) {
        setCategories((prev) =>
          prev.map((c) => {
            if (c.id === catId) {
              return { ...c, phrases: [...c.phrases, phraseText] };
            }
            return c;
          })
        );
      } else {
        // Fallback local
        setCategories((prev) =>
          prev.map((c) => {
            if (c.id === catId) {
              return { ...c, phrases: [...c.phrases, phraseText] };
            }
            return c;
          })
        );
      }
    } catch (e) {
      setCategories((prev) =>
        prev.map((c) => {
          if (c.id === catId) {
            return { ...c, phrases: [...c.phrases, phraseText] };
          }
          return c;
        })
      );
    }
  };

  // Sidebar action handler
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
      { id: '1', title: 'TTS Engine Ready', detail: 'Native speech synthesis active', time: '10:24 AM' },
      { id: '2', title: 'Voice Installed', detail: `${voices.length} system voices available`, time: '10:20 AM' },
      { id: '3', title: 'Audio Output', detail: 'Configured at 1.0x rate', time: '10:15 AM' },
    ],
    [voices.length]
  );

  const searchEntries: SearchEntry[] = useMemo(
    () => [
      { id: 'dash', label: 'Dashboard', hint: 'Overview', onSelect: () => onSelectTab?.('dashboard') },
      { id: 'blink', label: 'Blink to Text', hint: 'Eye-blink typing', onSelect: () => onSelectTab?.('blink') },
      { id: 'sign', label: 'Hand Sign', hint: 'Hand gesture AI', onSelect: () => onSelectTab?.('sign') },
      { id: 'morse', label: 'Morse Code', hint: 'Tap translator', onSelect: () => onSelectTab?.('morse') },
      { id: 'tts', label: 'Text-to-Speech', hint: 'Synthesizer', onSelect: () => {} },
      { id: 'remote', label: 'Video Call', hint: 'Accessible communication', onSelect: () => onSelectTab?.('remote') },
    ],
    [onSelectTab]
  );

  return (
    <div className="flex min-h-screen bg-[#F7F7F8] font-body text-[#202938]">
      {/* 1. Left Fixed Sidebar */}
      <Sidebar
        activeId="tts"
        onAction={handleSidebarAction}
        userName={userName}
        userRole={userRole}
        initials={initials}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      {/* 2. Main Content Viewport */}
      <div className="flex flex-1 flex-col lg:pl-[280px]">
        {/* Top Navigation Bar */}
        <Topbar
          breadcrumbTitle="TTS"
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
              Text-to-Speech Communication
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-[#6B7280]">
              Convert text into natural speech for clear and effective communication.
            </p>
          </div>

          {/* Main 2-Column Dashboard Layout (Left ~58%, Right ~42%) */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
            {/* Left Column: Text Message Input & Voice Controls (7 cols on xl) */}
            <div className="xl:col-span-7 flex flex-col gap-5">
              <TextMessageInputCard
                text={textInput}
                onChangeText={setTextInput}
                onClearText={handleClearBox}
                onSpeak={handleSpeakMessage}
                onOpenAiPolisher={() => setAiPolisherOpen(true)}
                isSpeaking={isSpeaking}
                selectedVoiceName={selectedVoice}
                rate={rate}
                pitch={pitch}
              />

              <VoiceControlsCard
                voices={voices}
                selectedVoiceName={selectedVoice}
                onSelectVoice={handleSelectVoice}
                rate={rate}
                onChangeRate={handleUpdateRate}
                pitch={pitch}
                onChangePitch={handleUpdatePitch}
              />
            </div>

            {/* Right Column: Phrase Board (5 cols on xl) */}
            <div className="xl:col-span-5 flex flex-col">
              <PhraseBoardCard
                categories={categories}
                onSpeakPhrase={handleSpeakPhrase}
                onOpenAddCategory={() => setAddCategoryOpen(true)}
                onOpenAddPhrase={(catId) => {
                  const targetCat = categories.find((c) => c.id === catId);
                  setAddPhraseCategory({ id: catId, name: targetCat?.category || '' });
                }}
                currentlySpeakingPhrase={speakingPhrase}
              />
            </div>
          </div>
        </main>
      </div>

      {/* Modals & Dialogs */}
      <AIPolisherModal
        isOpen={aiPolisherOpen}
        onClose={() => setAiPolisherOpen(false)}
        originalText={textInput}
        onApplyPolishedText={(improved) => setTextInput(improved)}
      />

      <AddCategoryModal
        isOpen={addCategoryOpen}
        onClose={() => setAddCategoryOpen(false)}
        onAddCategory={handleAddCategory}
      />

      <AddPhraseModal
        isOpen={Boolean(addPhraseCategory)}
        onClose={() => setAddPhraseCategory(null)}
        categoryId={addPhraseCategory?.id || null}
        categoryName={addPhraseCategory?.name}
        onAddPhrase={handleAddPhrase}
      />

      {/* Settings Drawer */}
      <SettingsDrawer
        open={drawerOpen}
        initialTab={drawerTab}
        onClose={() => setDrawerOpen(false)}
        patient={patient}
        sessionToken={sessionToken || null}
        recentPhrases={[]}
        onProfileUpdate={onProfileUpdate || (() => {})}
      />

      {/* SOS Confirm Dialog */}
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
export default TextToSpeech;
