import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { NavTab } from '../types';
import { Play, AlertCircle, X } from 'lucide-react';
import { Sidebar, type SidebarAction } from './dashboard/Sidebar';
import { Topbar, type SearchEntry, type NotificationEntry } from './dashboard/Topbar';
import { SettingsDrawer, type SettingsTab } from './dashboard/SettingsDrawer';
import { SosConfirmDialog } from './dashboard/SosConfirmDialog';
import { DEFAULT_USER } from './dashboard/dashboardData';

// Video Call Subcomponents
import { ContactListPanel, type ContactItem } from './videocall/ContactListPanel';
import { VideoCallFeed } from './videocall/VideoCallFeed';
import { RealtimeTranslationPanel, type TranslationMode } from './videocall/RealtimeTranslationPanel';
import { TranscriptPanel, type TranscriptMessage } from './videocall/TranscriptPanel';
import { CommunicationModeSelector } from './videocall/CommunicationModeSelector';
import { CallSettingsPanel, type CallSettingsState } from './videocall/CallSettingsPanel';
import { AdditionalActionsPanel } from './videocall/AdditionalActionsPanel';
import { HowItWorksModal } from './videocall/HowItWorksModal';
import { AddContactModal } from './videocall/AddContactModal';
import { QuickPhraseModal } from './videocall/QuickPhraseModal';
import { IncomingCallModal } from './videocall/IncomingCallModal';

// WebRTC & Speech Utilities
import { WebRTCClient, type IncomingCallEvent } from '../utils/webrtcClient';
import { SpeechClient } from '../utils/speechClient';
import { speakText } from '../utils/sound';

interface VideoCallProps {
  onAddPhraseHistory?: (text: string, mode: 'Blink' | 'Sign' | 'Morse' | 'TTS') => void;
  onOpenSos?: () => void;
  onSelectTab?: (tab: NavTab) => void;
  patient?: any;
  sessionToken?: string | null;
  onLogout?: () => void;
  onProfileUpdate?: (updatedPatient: any) => void;
}

const INITIAL_TRANSCRIPT: TranscriptMessage[] = [
  {
    id: 'm1',
    sender_name: 'You',
    sender_role: 'local',
    method: 'Sign',
    text: 'GOOD',
    timestamp: '10:24 AM',
  },
  {
    id: 'm2',
    sender_name: 'Saksham',
    sender_role: 'remote',
    method: 'Speech',
    text: "That's great! How are you feeling now?",
    timestamp: '10:24 AM',
  },
  {
    id: 'm3',
    sender_name: 'You',
    sender_role: 'local',
    method: 'Blink',
    text: 'I NEED WATER',
    timestamp: '10:25 AM',
  },
  {
    id: 'm4',
    sender_name: 'Saksham',
    sender_role: 'remote',
    method: 'Speech',
    text: 'Okay, I will get you some water.',
    timestamp: '10:25 AM',
  },
];

export const VideoCall: React.FC<VideoCallProps> = ({
  onAddPhraseHistory,
  onOpenSos,
  onSelectTab,
  patient,
  sessionToken,
  onLogout,
  onProfileUpdate,
}) => {
  // Navigation & Shell State
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<SettingsTab>('settings');
  const [sosConfirmOpen, setSosConfirmOpen] = useState(false);

  // User Profile details
  const userName = patient?.name?.trim() || DEFAULT_USER.name;
  const userRole = DEFAULT_USER.role;
  const initials =
    userName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p: string) => p[0]?.toUpperCase())
      .join('') || 'AP';

  // Modals state
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);
  const [addContactOpen, setAddContactOpen] = useState(false);
  const [quickPhraseOpen, setQuickPhraseOpen] = useState(false);

  // Contacts state
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [selectedContact, setSelectedContact] = useState<ContactItem | null>(null);
  const [isLoadingContacts, setIsLoadingContacts] = useState(true);

  // Active Call & Signaling State
  const [activeCallId, setActiveCallId] = useState<string>('call_demo_default');
  const [callDuration, setCallDuration] = useState<number>(0);
  const [connectionState, setConnectionState] = useState<
    'idle' | 'initiating' | 'ringing' | 'connecting' | 'connected' | 'ended'
  >('idle');
  const [incomingCall, setIncomingCall] = useState<IncomingCallEvent | null>(null);
  const [callError, setCallError] = useState<string | null>(null);

  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isSharingScreen, setIsSharingScreen] = useState(false);

  // Streams state
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0.2);

  // Translation & Communication Mode state
  const [commMode, setCommMode] = useState<TranslationMode>('Sign');
  const [detectedSign, setDetectedSign] = useState<string>('GOOD');
  const [confidence, setConfidence] = useState<number>(98.7);
  const [translatedText, setTranslatedText] = useState<string>('GOOD');

  // Conversation Transcript state
  const [messages, setMessages] = useState<TranscriptMessage[]>(INITIAL_TRANSCRIPT);

  // Call Settings state
  const [callSettings, setCallSettings] = useState<CallSettingsState>({
    auto_translate: true,
    show_detected_gestures: true,
    speak_translations: true,
    noise_reduction: true,
  });

  // Client references
  const webrtcRef = useRef<WebRTCClient | null>(null);
  const speechRef = useRef<SpeechClient | null>(null);
  const durationTimerRef = useRef<any>(null);

  // Duration timer helpers
  const startDurationTimer = useCallback(() => {
    if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    setCallDuration(0);
    durationTimerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  }, []);

  const stopDurationTimer = useCallback(() => {
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
  }, []);

  // 1. Fetch Contacts from Backend API
  const fetchContacts = useCallback(async () => {
    setIsLoadingContacts(true);
    try {
      const res = await fetch('/api/contacts', {
        headers: sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setContacts(data);
          if (!selectedContact) {
            setSelectedContact(data[0]);
          }
        }
      }
    } catch (e) {
      console.warn('Failed to load contacts from API:', e);
    } finally {
      setIsLoadingContacts(false);
    }
  }, [sessionToken, selectedContact]);

  // 2. Fetch Call Settings from Backend API
  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/calls/settings', {
        headers: sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setCallSettings(data);
      }
    } catch (e) {
      console.warn('Failed to load call settings:', e);
    }
  }, [sessionToken]);

  // 3. Fetch Transcript Messages for Active Call
  const fetchMessages = useCallback(async (callId: string) => {
    try {
      const res = await fetch(`/api/calls/${callId}/messages`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setMessages(data);
        }
      }
    } catch (e) {
      console.warn('Failed to load call messages:', e);
    }
  }, []);

  // 4. Initialize WebRTC Client & Media Tracks
  useEffect(() => {
    fetchContacts();
    fetchSettings();

    const client = new WebRTCClient({
      onLocalStream: (stream) => {
        setLocalStream(stream);
      },
      onRemoteStream: (stream) => {
        setRemoteStream(stream);
        setConnectionState('connected');
        startDurationTimer();
      },
      onCallRinging: () => {
        setConnectionState('ringing');
      },
      onIncomingCall: (evt) => {
        setIncomingCall(evt);
      },
      onCallAccepted: (data) => {
        setConnectionState('connecting');
      },
      onCallRejected: (data) => {
        setConnectionState('idle');
        setCallError(data.reason || 'Recipient declined the call.');
        stopDurationTimer();
      },
      onCallCancelled: () => {
        setIncomingCall(null);
        setConnectionState('idle');
        stopDurationTimer();
      },
      onCallFailed: (data) => {
        setConnectionState('idle');
        setCallError(data.error || 'Call could not be completed.');
        stopDurationTimer();
      },
      onCallConnected: () => {
        setConnectionState('connected');
        startDurationTimer();
      },
      onCallEnded: (reason) => {
        setConnectionState('ended');
        stopDurationTimer();
      },
      onAudioLevel: (level) => {
        setAudioLevel(level);
      },
      onTranscriptMessage: (msg) => {
        setMessages((prev) => [
          ...prev,
          {
            id: msg.id || String(Date.now()),
            sender_name: msg.sender_name,
            sender_role: msg.sender_role,
            method: msg.method,
            text: msg.text,
            timestamp: msg.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        if (callSettings.speak_translations) {
          speakText(msg.text);
        }
      },
      onCommunicationModeChange: (mode) => {
        setCommMode(mode as TranslationMode);
      },
      onError: (err) => {
        console.warn('[WebRTC Error]:', err);
      },
    });

    webrtcRef.current = client;

    // Connect authenticated signaling socket to receive inbound calls & register presence
    client.connectSignaling(String(patient?.id || '1'), userName, sessionToken);

    // Acquire local media gracefully for local video preview
    client
      .startLocalMedia({ video: true, audio: true })
      .catch((err) => {
        console.warn('Webcam initialization was not allowed or failed:', err);
      });

    // Initialize Speech Client
    const speech = new SpeechClient({
      onTranscript: (text, isFinal) => {
        if (isFinal) {
          handleSendMessage(text, 'Speech');
        }
      },
    });
    speechRef.current = speech;

    return () => {
      client.close();
      speech.stopListening();
      stopDurationTimer();
    };
  }, []);

  // Handler: Initiate Call to Contact
  const handleCallContact = async (contact: ContactItem) => {
    setSelectedContact(contact);
    setConnectionState('initiating');
    setCallError(null);
    const newCallId = `call_${Date.now()}`;
    setActiveCallId(newCallId);

    try {
      const res = await fetch('/api/calls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
        },
        body: JSON.stringify({
          id: newCallId,
          recipient_id: String(contact.id),
          recipient_name: contact.name,
          phone: contact.phone || undefined,
          initiator_name: userName,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setConnectionState('idle');
        setCallError(data.error || 'Failed to start call');
        return;
      }

      if (data.online === false) {
        setConnectionState('idle');
        setCallError(data.error || `${contact.name} is currently offline and cannot receive in-app calls.`);
        return;
      }

      if (webrtcRef.current) {
        webrtcRef.current.initiateCall({
          phone: contact.phone || undefined,
          recipientId: String(contact.id),
          callType: 'video',
        });
      }
    } catch (e: any) {
      console.warn('Call start failed:', e);
      setConnectionState('idle');
      setCallError('Could not connect to calling service.');
    }
  };

  // Handler: Initiate Direct Call via Mobile Number
  const handleCallPhone = async (phone: string) => {
    setCallError(null);
    setConnectionState('initiating');
    const newCallId = `call_${Date.now()}`;
    setActiveCallId(newCallId);

    try {
      // 1. Check if user is registered with EchoLytix
      const lookupRes = await fetch(`/api/contacts/lookup?phone=${encodeURIComponent(phone)}`);
      const lookupData = await lookupRes.json();

      if (!lookupRes.ok || !lookupData.registered) {
        setConnectionState('idle');
        setCallError(lookupData.error || 'This number is not registered with EchoLytix.');
        return;
      }

      // 2. Set contact details
      const userContact: ContactItem = {
        id: lookupData.id,
        name: lookupData.name,
        role: lookupData.role || 'Registered User',
        category: 'caregivers',
        phone: lookupData.phone,
        avatar_initials: lookupData.avatar_initials,
        presence_status: lookupData.online ? 'online' : 'offline',
      };
      setSelectedContact(userContact);

      // 3. Initiate call via API
      const callRes = await fetch('/api/calls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
        },
        body: JSON.stringify({
          id: newCallId,
          phone: lookupData.phone,
          recipient_name: lookupData.name,
          initiator_name: userName,
        }),
      });

      const callData = await callRes.json();
      if (!callRes.ok) {
        setConnectionState('idle');
        setCallError(callData.error || 'Failed to initiate call');
        return;
      }

      if (callData.online === false) {
        setConnectionState('idle');
        setCallError(callData.error || `${lookupData.name} is currently offline and cannot receive in-app calls.`);
        return;
      }

      // 4. Send signaling message
      if (webrtcRef.current) {
        webrtcRef.current.initiateCall({
          phone: lookupData.phone,
          recipientId: String(lookupData.id),
          callType: 'video',
        });
      }
    } catch (e: any) {
      console.warn('Direct phone call error:', e);
      setConnectionState('idle');
      setCallError('Network error while looking up phone number.');
    }
  };

  // Handler: Accept Incoming Call
  const handleAcceptIncomingCall = async () => {
    if (!incomingCall) return;
    const callId = incomingCall.callId;
    setActiveCallId(callId);
    setConnectionState('connecting');

    // Update selected contact
    setSelectedContact({
      id: Number(incomingCall.caller.id) || Date.now(),
      name: incomingCall.caller.name,
      role: 'Caller',
      category: 'caregivers',
      phone: incomingCall.caller.phone || null,
      avatar_initials: incomingCall.caller.avatar_initials,
      presence_status: 'online',
    });

    try {
      await fetch(`/api/calls/${callId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (webrtcRef.current) {
        await webrtcRef.current.acceptCall(callId);
      }
    } catch (e) {
      console.warn('Accept call error:', e);
    } finally {
      setIncomingCall(null);
    }
  };

  // Handler: Decline Incoming Call
  const handleDeclineIncomingCall = async () => {
    if (!incomingCall) return;
    const callId = incomingCall.callId;
    try {
      await fetch(`/api/calls/${callId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'declined' }),
      });
      if (webrtcRef.current) {
        webrtcRef.current.rejectCall(callId, 'declined');
      }
    } catch (e) {
      console.warn('Decline call error:', e);
    } finally {
      setIncomingCall(null);
    }
  };

  // Handler: End Call
  const handleEndCall = async () => {
    const prevCallId = activeCallId;
    const currentDuration = callDuration;
    const isOngoing = connectionState === 'connected' || connectionState === 'connecting';

    setConnectionState('ended');
    stopDurationTimer();

    if (webrtcRef.current) {
      if (connectionState === 'initiating' || connectionState === 'ringing') {
        webrtcRef.current.cancelCall(prevCallId);
      } else {
        webrtcRef.current.endCall(currentDuration, 'Hang up');
      }
    }

    try {
      if (connectionState === 'initiating' || connectionState === 'ringing') {
        await fetch(`/api/calls/${prevCallId}/cancel`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
      } else {
        await fetch(`/api/calls/${prevCallId}/end`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ duration: currentDuration, reason: 'Hang up' }),
        });
      }
    } catch (e) {}

    setTimeout(() => {
      setConnectionState('idle');
    }, 2000);
  };

  // Handler: Toggle Mic Mute
  const handleToggleMute = () => {
    if (webrtcRef.current) {
      const muted = webrtcRef.current.toggleMute();
      setIsMuted(muted);
    }
  };

  // Handler: Toggle Camera
  const handleToggleCamera = () => {
    if (webrtcRef.current) {
      const camOff = webrtcRef.current.toggleCamera();
      setIsCameraOff(camOff);
    }
  };

  // Handler: Toggle Screen Share
  const handleToggleScreenShare = async () => {
    if (webrtcRef.current) {
      const isSharing = await webrtcRef.current.toggleScreenShare();
      setIsSharingScreen(isSharing);
    }
  };

  // Handler: Switch Camera
  const handleSwitchCamera = async () => {
    if (webrtcRef.current) {
      await webrtcRef.current.switchCamera();
    }
  };

  // Handler: Capture Screenshot
  const handleCaptureScreenshot = () => {
    const video = document.querySelector('video');
    if (video && webrtcRef.current) {
      const shot = webrtcRef.current.captureFrame(video);
      if (shot) {
        const a = document.createElement('a');
        a.href = shot;
        a.download = `echolytix_call_${Date.now()}.png`;
        a.click();
      }
    }
  };

  // Handler: Send Message (from Sign, Blink, Speech, Quick Phrase)
  const handleSendMessage = async (text: string, method: string) => {
    if (!text.trim()) return;
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMsg: TranscriptMessage = {
      id: `m_${Date.now()}`,
      sender_name: 'You',
      sender_role: 'local',
      method,
      text: text.trim(),
      timestamp: time,
    };

    setMessages((prev) => [...prev, newMsg]);
    setTranslatedText(text.trim());

    // Send through WebRTC client
    if (webrtcRef.current) {
      webrtcRef.current.sendTranscriptMessage({
        call_id: activeCallId,
        sender_name: 'You',
        sender_role: 'local',
        method,
        text: text.trim(),
        timestamp: time,
      });
    }

    // Persist to backend database
    try {
      await fetch(`/api/calls/${activeCallId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMsg),
      });
    } catch (e) {}

    // Add to app phrase history
    onAddPhraseHistory?.(text.trim(), method as any);

    // Speak if TTS enabled
    if (callSettings.speak_translations) {
      speakText(text.trim());
    }
  };

  // Handler: Add Custom Contact
  const handleAddCustomContact = async (contactData: Omit<ContactItem, 'id'>) => {
    const res = await fetch('/api/contacts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
      },
      body: JSON.stringify(contactData),
    });
    if (!res.ok) throw new Error('Failed to create contact');
    const created = await res.json();
    setContacts((prev) => [...prev, created]);
    setSelectedContact(created);
  };

  // Handler: Update Call Setting
  const handleUpdateSetting = async (key: keyof CallSettingsState, value: boolean) => {
    const nextSettings = { ...callSettings, [key]: value };
    setCallSettings(nextSettings);
    try {
      await fetch('/api/calls/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
        },
        body: JSON.stringify(nextSettings),
      });
    } catch (e) {}
  };

  // Switch communication mode
  const handleSelectCommMode = (mode: TranslationMode) => {
    setCommMode(mode);
    if (webrtcRef.current) {
      webrtcRef.current.sendCommunicationMode(mode);
    }
    if (mode === 'Speech') {
      speechRef.current?.startListening();
    } else {
      speechRef.current?.stopListening();
    }
  };

  // Sidebar action handler
  const handleSidebarAction = (action: SidebarAction) => {
    if (action.type === 'tab') {
      onSelectTab?.(action.tab);
    } else if (action.type === 'sos') {
      setSosConfirmOpen(true);
    } else if (action.type === 'settings' || action.type === 'reports') {
      setDrawerTab(action.type === 'reports' ? 'admin' : 'settings');
      setDrawerOpen(true);
    }
  };

  const remoteName = selectedContact ? selectedContact.name : 'Saksham';
  const remoteRole = selectedContact ? selectedContact.role : 'Caretaker';

  const notifications: NotificationEntry[] = useMemo(
    () => [
      { id: '1', title: 'Video Call Engine', detail: 'Encrypted WebRTC P2P stream active', time: '10:24 AM' },
      { id: '2', title: 'AI Translation Ready', detail: 'Real-time gesture & speech processor', time: '10:20 AM' },
      { id: '3', title: 'Caregiver Online', detail: 'Saksham connected to room', time: '10:15 AM' },
    ],
    []
  );

  const searchEntries: SearchEntry[] = useMemo(
    () => [
      { id: 'dash', label: 'Dashboard', hint: 'Overview', onSelect: () => onSelectTab?.('dashboard') },
      { id: 'blink', label: 'Blink to Text', hint: 'Eye-blink typing', onSelect: () => onSelectTab?.('blink') },
      { id: 'sign', label: 'Hand Sign', hint: 'Hand gesture AI', onSelect: () => onSelectTab?.('sign') },
      { id: 'morse', label: 'Morse Code', hint: 'Tap translator', onSelect: () => onSelectTab?.('morse') },
      { id: 'tts', label: 'Text-to-Speech', hint: 'Synthesizer', onSelect: () => onSelectTab?.('tts') },
      { id: 'remote', label: 'Video Call', hint: 'Accessible communication', onSelect: () => {} },
    ],
    [onSelectTab]
  );

  return (
    <div className="flex min-h-screen bg-[#F7F7F8] font-body text-[#202938]">
      {/* 1. Left Fixed Sidebar */}
      <Sidebar
        activeId="remote"
        onAction={handleSidebarAction}
        userName={userName}
        userRole={userRole}
        initials={initials}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      {/* 2. Main Content Viewport */}
      <div className="flex flex-1 flex-col lg:pl-[270px]">
        {/* Top Navigation Bar */}
        <Topbar
          breadcrumbTitle="Video Call"
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
          {/* Call Error Banner */}
          {callError && (
            <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700 animate-fade-in shadow-xs">
              <div className="flex items-center gap-2">
                <AlertCircle size={16} className="text-red-500 shrink-0" />
                <span>{callError}</span>
              </div>
              <button
                type="button"
                onClick={() => setCallError(null)}
                className="rounded-md p-1 hover:bg-red-100 text-red-600"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Page Header */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-[26px] font-bold text-[#17213A] tracking-tight">
                Accessible Video Call
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-[#6B7280]">
                Communicate seamlessly using speech, sign, blink, or tap with real-time translation.
              </p>
            </div>

            {/* How It Works Button matching reference screenshot */}
            <button
              type="button"
              onClick={() => setHowItWorksOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-[#F4512A] bg-white px-3.5 py-2 text-xs font-semibold text-[#F4512A] shadow-xs transition hover:bg-[#FFF8F5] active:scale-95"
            >
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#F4512A] text-white">
                <Play size={9} fill="currentColor" className="ml-0.5" />
              </span>
              <span>How it works?</span>
            </button>
          </div>

          {/* Upper 3-Column Grid */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 xl:grid-cols-12 items-stretch">
            {/* Column 1: Who to Call? */}
            <div className="lg:col-span-5 xl:col-span-3 min-h-[460px]">
              <ContactListPanel
                contacts={contacts}
                selectedContactId={selectedContact?.id ?? null}
                onSelectContact={(c) => setSelectedContact(c)}
                onCallContact={handleCallContact}
                onCallPhone={handleCallPhone}
                onOpenAddContact={() => setAddContactOpen(true)}
                isLoading={isLoadingContacts}
              />
            </div>

            {/* Column 2: Video Call Feed */}
            <div className="lg:col-span-7 xl:col-span-4 min-h-[460px]">
              <VideoCallFeed
                remoteStream={remoteStream}
                localStream={localStream}
                remoteParticipantName={remoteName}
                remoteParticipantRole={remoteRole}
                callDurationSeconds={callDuration}
                connectionState={connectionState}
                isMuted={isMuted}
                isCameraOff={isCameraOff}
                onToggleMute={handleToggleMute}
                onToggleCamera={handleToggleCamera}
                onEndCall={handleEndCall}
                onOpenSettings={() => {
                  setDrawerTab('settings');
                  setDrawerOpen(true);
                }}
              />
            </div>

            {/* Column 3: Real-Time Translation & Transcript */}
            <div className="lg:col-span-12 xl:col-span-5 flex flex-col gap-4 min-h-[460px]">
              {/* Top: Real-Time Translation */}
              <RealtimeTranslationPanel
                activeMode={commMode}
                onSelectMode={handleSelectCommMode}
                detectedSign={detectedSign}
                confidence={confidence}
                translatedText={translatedText}
                isLive={connectionState === 'connected'}
                audioLevel={audioLevel}
                onSpeakText={() => speakText(translatedText)}
                onClearText={() => setTranslatedText('')}
              />

              {/* Bottom: Conversation Transcript */}
              <TranscriptPanel messages={messages} />
            </div>
          </div>

          {/* Lower Row: 3 Cards */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {/* Card 1: Communication Mode */}
            <CommunicationModeSelector
              currentMode={commMode}
              onSelectMode={handleSelectCommMode}
            />

            {/* Card 2: Call Settings */}
            <CallSettingsPanel
              settings={callSettings}
              onUpdateSetting={handleUpdateSetting}
            />

            {/* Card 3: Additional Actions */}
            <AdditionalActionsPanel
              isSharingScreen={isSharingScreen}
              onToggleScreenShare={handleToggleScreenShare}
              onOpenQuickPhrases={() => setQuickPhraseOpen(true)}
              onCaptureScreenshot={handleCaptureScreenshot}
              onSwitchCamera={handleSwitchCamera}
            />
          </div>
        </main>
      </div>

      {/* Incoming Call Modal */}
      <IncomingCallModal
        incomingCall={incomingCall}
        onAccept={handleAcceptIncomingCall}
        onDecline={handleDeclineIncomingCall}
      />

      {/* Modals & Drawers */}
      <HowItWorksModal
        isOpen={howItWorksOpen}
        onClose={() => setHowItWorksOpen(false)}
      />

      <AddContactModal
        isOpen={addContactOpen}
        onClose={() => setAddContactOpen(false)}
        onAddContact={handleAddCustomContact}
      />

      <QuickPhraseModal
        isOpen={quickPhraseOpen}
        onClose={() => setQuickPhraseOpen(false)}
        onSendPhrase={(phrase) => handleSendMessage(phrase, 'QuickPhrase')}
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
        open={sosConfirmOpen}
        onCancel={() => setSosConfirmOpen(false)}
        onConfirm={() => {
          setSosConfirmOpen(false);
          onOpenSos?.();
        }}
      />
    </div>
  );
};
