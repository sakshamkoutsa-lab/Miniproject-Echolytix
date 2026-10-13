import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { NavTab, RecentPhrase } from '../types';
import { Sidebar, SidebarAction } from './dashboard/Sidebar';
import { Topbar, SearchEntry, NotificationEntry } from './dashboard/Topbar';
import { SettingsDrawer, SettingsTab } from './dashboard/SettingsDrawer';
import { EmergencyStatusBanner } from './sos/EmergencyStatusBanner';
import { CaretakerTargetCard } from './sos/CaretakerTargetCard';
import { BroadcastContentPreview } from './sos/BroadcastContentPreview';
import { LocationCard } from './sos/LocationCard';
import { AudibleSirenCard } from './sos/AudibleSirenCard';
import { EmergencyActivityTimeline, TimelineEvent } from './sos/EmergencyActivityTimeline';
import { QuickActionsCard } from './sos/QuickActionsCard';
import { CaretakerModal, ContactItem } from './sos/CaretakerModal';
import { LocationEditModal } from './sos/LocationEditModal';
import { TestBroadcastModal } from './sos/TestBroadcastModal';
import { SosSettingsModal } from './sos/SosSettingsModal';
import { toggleEmergencySiren } from '../utils/sound';

interface EmergencySosProps {
  onSelectTab: (tab: NavTab) => void;
  patient?: any;
  sessionToken?: string | null;
  onLogout: () => void;
  onProfileUpdate: (updated: any) => void;
  recentPhrases?: RecentPhrase[];
}

export const EmergencySos: React.FC<EmergencySosProps> = ({
  onSelectTab,
  patient,
  sessionToken,
  onLogout,
  onProfileUpdate,
  recentPhrases = [],
}) => {
  // Mobile drawer & sidebar state
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<SettingsTab>('settings');

  // Caretaker details state
  const [caretakerName, setCaretakerName] = useState<string>(
    patient?.caregiver_name || 'Saksham'
  );
  const [caretakerPhone, setCaretakerPhone] = useState<string>(
    patient?.caregiver_phone || '+91 8130896226'
  );
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<number>(1);

  // Location state
  const [locationSource, setLocationSource] = useState<'GPS' | 'IP' | 'MANUAL'>('IP');
  const [address, setAddress] = useState<string>('Delhi, Delhi, India');
  const [latitude, setLatitude] = useState<number>(28.5300);
  const [longitude, setLongitude] = useState<number>(77.1400);
  const [isLocating, setIsLocating] = useState<boolean>(false);

  // Emergency status & alert state
  const [isSosActive, setIsSosActive] = useState<boolean>(true);
  const [broadcastStatus, setBroadcastStatus] = useState<string>('READY TO BROADCAST');
  const [activeAlertId, setActiveAlertId] = useState<number | null>(null);
  const [isBroadcasting, setIsBroadcasting] = useState<boolean>(false);

  // Siren audio state
  const [isSirenActive, setIsSirenActive] = useState<boolean>(false);
  const [autoSirenEnabled, setAutoSirenEnabled] = useState<boolean>(false);

  // Modals state
  const [isCaretakerModalOpen, setIsCaretakerModalOpen] = useState<boolean>(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState<boolean>(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);

  // Dynamic broadcast message
  const patientDisplayName = patient?.name || 'Sachin Gupta';
  const defaultDistressText = `EMERGENCY: Patient ${patientDisplayName} requires urgent assistance at ${address}. Caretaker: ${caretakerName} (${caretakerPhone}).`;
  const [customMessage, setCustomMessage] = useState<string>(defaultDistressText);

  // Keep custom message synchronized with address/caretaker changes if not manually modified
  useEffect(() => {
    setCustomMessage(
      `EMERGENCY: Patient ${patientDisplayName} requires urgent assistance at ${address}. Caretaker: ${caretakerName} (${caretakerPhone}).`
    );
  }, [patientDisplayName, address, caretakerName, caretakerPhone]);

  // Timeline events state
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([
    {
      id: 'step-1',
      title: 'SOS prepared',
      detail: 'Emergency message generated',
      time: '10:24:15',
      completed: true,
    },
    {
      id: 'step-2',
      title: 'Caretaker selected',
      detail: `${caretakerName} (${caretakerPhone})`,
      time: '10:24:17',
      completed: true,
    },
    {
      id: 'step-3',
      title: 'Location attached',
      detail: address,
      time: '10:24:19',
      completed: true,
    },
    {
      id: 'step-4',
      title: 'Ready to broadcast',
      detail: 'Waiting for user confirmation',
      time: '10:24:21',
      completed: true,
    },
    {
      id: 'step-5',
      title: 'Broadcast sent',
      detail: 'Will appear here after sending',
      time: '--:--:--',
      completed: false,
    },
  ]);

  // Update step 2 & 3 in timeline when caretaker or location updates
  useEffect(() => {
    setTimelineEvents((prev) =>
      prev.map((e) => {
        if (e.id === 'step-2') {
          return { ...e, detail: `${caretakerName} (${caretakerPhone})` };
        }
        if (e.id === 'step-3') {
          return { ...e, detail: address };
        }
        return e;
      })
    );
  }, [caretakerName, caretakerPhone, address]);

  // Load contacts from backend SQLite
  const loadContacts = useCallback(async () => {
    try {
      const res = await fetch('/api/contacts');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setContacts(data);
          const primary = data.find((c: any) => c.category === 'caregivers') || data[0];
          if (primary) {
            setSelectedContactId(primary.id);
            if (primary.name) setCaretakerName(primary.name);
            if (primary.phone) setCaretakerPhone(primary.phone);
          }
        }
      }
    } catch (e) {
      console.warn('Could not fetch contacts:', e);
    }
  }, []);

  // Fetch location (attempts browser GPS, falls back to IP geolocation)
  const detectLocation = useCallback(async () => {
    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(pos.coords.latitude);
          setLongitude(pos.coords.longitude);
          setLocationSource('GPS');
          setIsLocating(false);
        },
        async () => {
          // Fallback to IP geolocation
          try {
            const res = await fetch('/api/emergency/location');
            if (res.ok) {
              const data = await res.json();
              if (data.latitude && data.longitude) {
                setLatitude(data.latitude);
                setLongitude(data.longitude);
                if (data.address) setAddress(data.address);
                setLocationSource('IP');
              }
            }
          } catch (e) {}
          setIsLocating(false);
        },
        { timeout: 4000 }
      );
    } else {
      setIsLocating(false);
    }
  }, []);

  // Fetch initial data on mount
  useEffect(() => {
    loadContacts();
    detectLocation();
  }, [loadContacts, detectLocation]);

  // Handle WhatsApp action
  const handleSendWhatsApp = async () => {
    setIsBroadcasting(true);
    const timeStr = new Date().toLocaleTimeString();

    try {
      // 1. Record SOS broadcast in database
      const res = await fetch('/api/emergency/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: patient?.id || 1,
          message: customMessage,
          latitude,
          longitude,
          address,
          caregiverPhone: caretakerPhone,
          caregiverName: caretakerName,
          patientName: patientDisplayName,
        }),
      });

      const data = await res.json();
      if (data?.id) {
        setActiveAlertId(data.id);
      }

      setIsSosActive(true);
      setBroadcastStatus('DISPATCHED VIA WHATSAPP');

      // Update timeline
      setTimelineEvents((prev) =>
        prev.map((e) =>
          e.id === 'step-5'
            ? {
                ...e,
                title: 'Broadcast sent',
                detail: `Dispatched to ${caretakerName} via WhatsApp`,
                time: timeStr,
                completed: true,
              }
            : e
        )
      );

      // Open WhatsApp direct link
      const cleanDigits = caretakerPhone.replace(/\D/g, '');
      const fullDigits = cleanDigits.length === 10 ? `91${cleanDigits}` : cleanDigits;
      const mapsUrl = `https://maps.google.com/?q=${latitude.toFixed(4)},${longitude.toFixed(4)}`;
      const textToSend = `🚨 *ECHOLYTIX EMERGENCY SOS* 🚨\nPatient *${patientDisplayName}* requires urgent help!\n📍 Location: ${address}\n🗺️ Maps: ${mapsUrl}\n👨‍⚕️ Caretaker: ${caretakerName}\n⚡ Message: ${customMessage}`;
      const whatsappUrl = `https://api.whatsapp.com/send?phone=${fullDigits}&text=${encodeURIComponent(
        textToSend
      )}`;

      window.open(whatsappUrl, '_blank');
    } catch (err) {
      console.error('WhatsApp SOS dispatch failed:', err);
    } finally {
      setIsBroadcasting(false);
    }
  };

  // Handle SMS action
  const handleSendSms = async () => {
    setIsBroadcasting(true);
    const timeStr = new Date().toLocaleTimeString();

    try {
      // 1. Record SOS broadcast in backend
      const res = await fetch('/api/emergency/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: patient?.id || 1,
          message: customMessage,
          latitude,
          longitude,
          address,
          caregiverPhone: caretakerPhone,
          caregiverName: caretakerName,
          patientName: patientDisplayName,
        }),
      });

      const data = await res.json();
      if (data?.id) {
        setActiveAlertId(data.id);
      }

      setIsSosActive(true);
      setBroadcastStatus('DISPATCHED VIA SMS');

      // Update timeline
      setTimelineEvents((prev) =>
        prev.map((e) =>
          e.id === 'step-5'
            ? {
                ...e,
                title: 'Broadcast sent',
                detail: `Dispatched to ${caretakerName} via Direct SMS`,
                time: timeStr,
                completed: true,
              }
            : e
        )
      );

      // Trigger system SMS composer
      const smsUrl = `sms:${caretakerPhone}?body=${encodeURIComponent(customMessage)}`;
      window.location.href = smsUrl;
    } catch (err) {
      console.error('SMS SOS dispatch failed:', err);
    } finally {
      setIsBroadcasting(false);
    }
  };

  // Handle Call Now
  const handleCallNow = () => {
    window.location.href = `tel:${caretakerPhone}`;
  };

  // Handle Siren Toggle
  const handleToggleSiren = () => {
    const nextState = !isSirenActive;
    setIsSirenActive(nextState);
    toggleEmergencySiren(nextState);
  };

  // Handle Re-broadcast Signal
  const handleRebroadcast = async () => {
    setIsBroadcasting(true);
    const timeStr = new Date().toLocaleTimeString();

    try {
      const res = await fetch('/api/emergency/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: patient?.id || 1,
          message: customMessage,
          latitude,
          longitude,
          address,
          caregiverPhone: caretakerPhone,
          caregiverName: caretakerName,
          patientName: patientDisplayName,
        }),
      });

      const data = await res.json();
      if (data?.id) {
        setActiveAlertId(data.id);
      }

      setIsSosActive(true);
      setBroadcastStatus('RE-BROADCAST ACTIVE');

      if (autoSirenEnabled && !isSirenActive) {
        setIsSirenActive(true);
        toggleEmergencySiren(true);
      }

      setTimelineEvents((prev) =>
        prev.map((e) =>
          e.id === 'step-5'
            ? {
                ...e,
                title: 'Broadcast sent',
                detail: `Re-broadcast signal dispatched to ${caretakerName}`,
                time: timeStr,
                completed: true,
              }
            : e
        )
      );
    } catch (e) {
      console.error('Rebroadcast error:', e);
    } finally {
      setIsBroadcasting(false);
    }
  };

  // Handle Dismiss SOS Signal
  const handleDismiss = async () => {
    try {
      await fetch('/api/emergency/sos/dismiss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: activeAlertId }),
      });
    } catch (e) {}

    setIsSosActive(false);
    setBroadcastStatus('READY TO BROADCAST');
    if (isSirenActive) {
      setIsSirenActive(false);
      toggleEmergencySiren(false);
    }

    setTimelineEvents((prev) =>
      prev.map((e) =>
        e.id === 'step-5'
          ? {
              ...e,
              title: 'Broadcast sent',
              detail: 'Signal dismissed / on standby',
              time: '--:--:--',
              completed: false,
            }
          : e
      )
    );
  };

  // Cleanup audio siren on component unmount
  useEffect(() => {
    return () => {
      toggleEmergencySiren(false);
    };
  }, []);

  // Update contact phone and name
  const handleUpdateContact = async (id: number, phone: string, name: string) => {
    const res = await fetch(`/api/contacts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, name }),
    });

    if (res.ok) {
      await loadContacts();
      if (id === selectedContactId) {
        setCaretakerName(name);
        setCaretakerPhone(phone);
      }
    }
  };

  // Add new contact
  const handleAddContact = async (name: string, role: string, phone: string) => {
    const res = await fetch('/api/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, role, phone, category: 'caregivers' }),
    });

    if (res.ok) {
      await loadContacts();
    }
  };

  // Select contact from modal
  const handleSelectContact = (c: ContactItem) => {
    setSelectedContactId(c.id);
    if (c.name) setCaretakerName(c.name);
    if (c.phone) setCaretakerPhone(c.phone);
  };

  // Update manual location
  const handleSaveLocation = (newAddr: string, newLat: number, newLng: number) => {
    setAddress(newAddr);
    setLatitude(newLat);
    setLongitude(newLng);
    setLocationSource('MANUAL');
  };

  // Sidebar actions handler
  const handleSidebar = useCallback(
    (action: SidebarAction) => {
      switch (action.type) {
        case 'tab':
          onSelectTab(action.tab);
          break;
        case 'sos':
          // Already on SOS
          break;
        case 'reports':
          setDrawerTab('admin');
          setDrawerOpen(true);
          break;
        case 'settings':
          setDrawerTab('settings');
          setDrawerOpen(true);
          break;
      }
    },
    [onSelectTab]
  );

  // Search entries in Topbar
  const searchEntries: SearchEntry[] = useMemo(
    () => [
      { id: 'dashboard', label: 'Dashboard', hint: 'Overview & telemetry', onSelect: () => onSelectTab('dashboard') },
      { id: 'blink', label: 'Blink to Text', hint: 'Eye-blink communication', onSelect: () => onSelectTab('blink') },
      { id: 'sign', label: 'Hand Sign', hint: 'Sign language recognition', onSelect: () => onSelectTab('sign') },
      { id: 'morse', label: 'Morse Code', hint: 'Tap / blink Morse translator', onSelect: () => onSelectTab('morse') },
      { id: 'tts', label: 'Text-to-Speech', hint: 'TTS phrases & voices', onSelect: () => onSelectTab('tts') },
      { id: 'remote', label: 'Video Call', hint: 'Accessible video call', onSelect: () => onSelectTab('remote') },
    ],
    [onSelectTab]
  );

  const notifications: NotificationEntry[] = useMemo(
    () => [
      {
        id: '1',
        title: 'Distress Beacon Ready',
        detail: `Target: ${caretakerName} (${caretakerPhone})`,
        time: 'Just now',
      },
    ],
    [caretakerName, caretakerPhone]
  );

  const userName = patient?.name || 'Arjun Pratap';
  const userRole = patient?.medical_id ? `ID: ${patient.medical_id}` : 'NTRO Analyst';
  const initials = userName
    .split(' ')
    .map((p: string) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className="min-h-screen w-full overflow-x-hidden bg-[#F7F7F8] text-[#17213A] lg:pl-[270px]"
      style={{ fontFamily: "'Inter', var(--font-body)" }}
    >
      {/* Unified Left Sidebar */}
      <Sidebar
        activeId="sos"
        onAction={handleSidebar}
        userName={userName}
        userRole={userRole}
        initials={initials}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      {/* Unified Top Navigation Bar */}
      <Topbar
        userName={userName}
        userRole={userRole}
        initials={initials}
        breadcrumbTitle="SOS"
        searchEntries={searchEntries}
        notifications={notifications}
        onOpenMobileNav={() => setMobileNavOpen(true)}
        onHome={() => onSelectTab('dashboard')}
        onOpenSettings={() => {
          setDrawerTab('settings');
          setDrawerOpen(true);
        }}
        onLogout={onLogout}
      />

      {/* Main Content Area */}
      <main className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
        {/* Page Heading & Subtitle */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#17213A]">
            Emergency SOS
          </h1>
          <p className="mt-1 text-sm text-[#5B6375]">
            Send distress signal to your caretaker with your current location and message.
          </p>
        </div>

        {/* 2-Column Responsive Dashboard Layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Column (~60-65% width) */}
          <div className="space-y-5 lg:col-span-7 xl:col-span-8">
            {/* Top Alert Banner */}
            <EmergencyStatusBanner
              isActive={isSosActive}
              statusText="DISTRESS BEACON DISPATCHED TO CARETAKER"
            />

            {/* Card 1: Caretaker Broadcast Target */}
            <CaretakerTargetCard
              caretakerName={caretakerName}
              caretakerPhone={caretakerPhone}
              broadcastStatusText={broadcastStatus}
              onChangeNumber={() => setIsCaretakerModalOpen(true)}
              onSendWhatsApp={handleSendWhatsApp}
              onSendSms={handleSendSms}
              onCallNow={handleCallNow}
              isSending={isBroadcasting}
            />

            {/* Card 2: Broadcast Content Preview */}
            <BroadcastContentPreview
              message={customMessage}
              onUpdateMessage={(newMsg) => setCustomMessage(newMsg)}
            />

            {/* Card 3: Position Details */}
            <LocationCard
              locationSource={locationSource}
              address={address}
              latitude={latitude}
              longitude={longitude}
              isLocating={isLocating}
              onRefreshLocation={detectLocation}
              onEditLocation={() => setIsLocationModalOpen(true)}
            />

            {/* Card 4: Audible Distress Siren Alarm */}
            <AudibleSirenCard
              isSirenActive={isSirenActive}
              onDismiss={handleDismiss}
              onRebroadcast={handleRebroadcast}
              onToggleSirenSound={handleToggleSiren}
              isBroadcasting={isBroadcasting}
            />
          </div>

          {/* Right Column (~35-40% width) */}
          <div className="space-y-5 lg:col-span-5 xl:col-span-4">
            {/* Right Card 1: Emergency Activity Timeline */}
            <EmergencyActivityTimeline
              events={timelineEvents}
              isConnected={true}
            />

            {/* Right Card 2: Quick Actions & Tip Card */}
            <QuickActionsCard
              onOpenTestBroadcast={() => setIsTestModalOpen(true)}
              onOpenManageCaretakers={() => setIsCaretakerModalOpen(true)}
              onOpenSosSettings={() => setIsSettingsModalOpen(true)}
            />
          </div>
        </div>
      </main>

      {/* Caretaker Management Modal */}
      <CaretakerModal
        isOpen={isCaretakerModalOpen}
        onClose={() => setIsCaretakerModalOpen(false)}
        contacts={contacts}
        selectedContactId={selectedContactId}
        onSelectContact={handleSelectContact}
        onUpdateContact={handleUpdateContact}
        onAddContact={handleAddContact}
      />

      {/* Location Edit Modal */}
      <LocationEditModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        currentAddress={address}
        currentLat={latitude}
        currentLng={longitude}
        onSave={handleSaveLocation}
      />

      {/* Test Broadcast Modal */}
      <TestBroadcastModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        caretakerName={caretakerName}
        caretakerPhone={caretakerPhone}
      />

      {/* SOS Settings Modal */}
      <SosSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        defaultMessage={customMessage}
        autoSiren={autoSirenEnabled}
        onSaveSettings={({ defaultMessage: newMsg, autoSiren }) => {
          setCustomMessage(newMsg);
          setAutoSirenEnabled(autoSiren);
        }}
      />

      {/* Profile & Settings Drawer */}
      <SettingsDrawer
        open={drawerOpen}
        initialTab={drawerTab}
        onClose={() => setDrawerOpen(false)}
        patient={patient}
        sessionToken={sessionToken}
        recentPhrases={recentPhrases}
        onProfileUpdate={onProfileUpdate}
      />
    </div>
  );
};
