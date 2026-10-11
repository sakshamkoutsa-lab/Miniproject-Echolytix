import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { MessageSquareText, CircleCheck, Clock3, Siren } from 'lucide-react';
import { NavTab, RecentPhrase } from '../types';
import { INITIAL_RECENT_PHRASES } from '../data';
import { Sidebar, type SidebarAction } from './dashboard/Sidebar';
import { Topbar, type SearchEntry, type NotificationEntry } from './dashboard/Topbar';
import { WelcomeSection } from './dashboard/WelcomeSection';
import { StatCard } from './dashboard/StatCard';
import { CommunicationActivity } from './dashboard/CommunicationActivity';
import { RecentActivity } from './dashboard/RecentActivity';
import { QuickAccess } from './dashboard/QuickAccess';
import { SystemStatus } from './dashboard/SystemStatus';
import { SettingsDrawer, type SettingsTab } from './dashboard/SettingsDrawer';
import { SosConfirmDialog } from './dashboard/SosConfirmDialog';
import {
  DEFAULT_USER,
  FEATURES,
  MODE_TO_FEATURE,
  SAMPLE_RECENT_ACTIVITY,
  SAMPLE_STATS,
  type ActivityItem,
  type FeatureKey,
} from './dashboard/dashboardData';

interface DashboardProps {
  onSelectTab: (tab: NavTab) => void;
  recentPhrases: RecentPhrase[];
  patient: any;
  sessionToken: string | null;
  onLogout: () => void;
  onProfileUpdate: (updatedPatient: any) => void;
  /** Opens the app's existing SOS modal. */
  onOpenSos: () => void;
}

const MODE_VERB: Record<RecentPhrase['mode'], string> = {
  Blink: 'Translated',
  Sign: 'Recognized',
  Morse: 'Translated',
  TTS: 'Spoke',
};

const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('') || 'AP';

export const Dashboard: React.FC<DashboardProps> = ({
  onSelectTab,
  recentPhrases,
  patient,
  sessionToken,
  onLogout,
  onProfileUpdate,
  onOpenSos,
}) => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<SettingsTab>('settings');
  const [sosConfirmOpen, setSosConfirmOpen] = useState(false);

  // Live data from existing APIs (null = not loaded / unavailable → fall back to sample).
  const [phraseCount, setPhraseCount] = useState<number | null>(null);
  const [sosAlerts, setSosAlerts] = useState<any[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/phrases?limit=1000')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => !cancelled && Array.isArray(d) && setPhraseCount(d.length))
      .catch(() => !cancelled && setPhraseCount(null));
    fetch('/api/emergency/sos?limit=100')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => !cancelled && Array.isArray(d) && setSosAlerts(d))
      .catch(() => !cancelled && setSosAlerts(null));
    return () => {
      cancelled = true;
    };
  }, []);

  // Identity
  const userName: string = patient?.name?.trim() || DEFAULT_USER.name;
  const firstName = userName.split(/\s+/)[0];
  const initials = getInitials(userName);
  const userRole = DEFAULT_USER.role;

  // Actions
  const openDrawer = useCallback((tab: SettingsTab) => {
    setDrawerTab(tab);
    setDrawerOpen(true);
  }, []);
  const requestSos = useCallback(() => setSosConfirmOpen(true), []);

  const handleSidebar = useCallback(
    (action: SidebarAction) => {
      switch (action.type) {
        case 'tab':
          onSelectTab(action.tab);
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

  const handleFeature = useCallback(
    (key: FeatureKey) => {
      const tab = FEATURES[key].tab;
      if (tab) onSelectTab(tab);
      else requestSos();
    },
    [onSelectTab, requestSos]
  );

  // Recent activity: use the real phrase history when the API returned data.
  const phrasesAreLive = recentPhrases !== INITIAL_RECENT_PHRASES && recentPhrases.length > 0;
  const activityItems: ActivityItem[] = useMemo(() => {
    if (!phrasesAreLive) return SAMPLE_RECENT_ACTIVITY;
    return recentPhrases.slice(0, 6).map((p) => {
      const feature = MODE_TO_FEATURE[p.mode] ?? 'tts';
      const clean = p.text.replace(/^"+|"+$/g, '');
      return {
        id: p.id,
        feature,
        title: FEATURES[feature].label,
        detail: `${MODE_VERB[p.mode] ?? 'Logged'}: "${clean}"`,
        time: p.timestamp,
      };
    });
  }, [phrasesAreLive, recentPhrases]);

  // SOS stat
  const sosStat = useMemo(() => {
    if (!sosAlerts) return null;
    const delivered = sosAlerts.filter(
      (a) => a.broadcast_status?.includes('DELIVERED') || a.broadcast_status?.includes('SENT')
    ).length;
    return {
      value: String(sosAlerts.length),
      description: sosAlerts.length === 0 ? 'No alerts sent' : `${delivered} delivered · ${sosAlerts.length - delivered} pending`,
    };
  }, [sosAlerts]);

  // Notifications: latest real SOS alerts.
  const notifications: NotificationEntry[] = useMemo(
    () =>
      (sosAlerts ?? []).slice(0, 3).map((a) => ({
        id: String(a.id),
        title: 'SOS alert dispatched',
        detail: a.message || 'Emergency distress signal',
        time: a.timestamp
          ? new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : '',
      })),
    [sosAlerts]
  );

  const searchEntries: SearchEntry[] = useMemo(
    () => [
      { id: 'blink', label: 'Blink to Text', hint: 'Eye-blink communication', onSelect: () => onSelectTab('blink') },
      { id: 'sign', label: 'Hand Sign', hint: 'Sign language recognition', onSelect: () => onSelectTab('sign') },
      { id: 'morse', label: 'Morse Code', hint: 'Tap / blink Morse translator', onSelect: () => onSelectTab('morse') },
      { id: 'tts', label: 'Text-to-Speech', hint: 'TTS phrases & voices', onSelect: () => onSelectTab('tts') },
      { id: 'remote', label: 'Video Call', hint: 'Remote camera / caretaker link', onSelect: () => onSelectTab('remote') },
      { id: 'sos', label: 'Emergency SOS', hint: 'Alert caregiver', onSelect: requestSos },
      { id: 'reports', label: 'Usage Reports', hint: 'SOS logs, support requests, speech history', onSelect: () => openDrawer('admin') },
      { id: 'settings', label: 'Settings', hint: 'Profile, caregiver & calibration', onSelect: () => openDrawer('settings') },
      { id: 'support', label: 'Contact Support', hint: 'Submit feedback', onSelect: () => openDrawer('support') },
      {
        id: 'activity',
        label: 'Communication Activity',
        hint: 'Dashboard chart',
        onSelect: () => document.getElementById('communication-activity')?.scrollIntoView({ behavior: 'smooth' }),
      },
    ],
    [onSelectTab, openDrawer, requestSos]
  );

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#F7F7F8] text-[#17213A] lg:pl-[270px]" style={{ fontFamily: "'Inter', var(--font-body)" }}>
      <Sidebar
        activeId="dashboard"
        onAction={handleSidebar}
        userName={userName}
        userRole={userRole}
        initials={initials}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      <div className="flex min-h-screen min-w-0 flex-col">
        <Topbar
          userName={userName}
          userRole={userRole}
          initials={initials}
          searchEntries={searchEntries}
          notifications={notifications}
          onOpenMobileNav={() => setMobileNavOpen(true)}
          onHome={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          onOpenSettings={() => openDrawer('settings')}
          onLogout={onLogout}
        />

        <main className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-5 px-4 py-6 animate-fade-in sm:px-6 lg:gap-6 lg:px-8 lg:py-7">
          <WelcomeSection firstName={firstName} />

          {/* Statistics */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 lg:gap-5" aria-label="Key statistics">
            <StatCard
              title="Total Communications"
              value={phraseCount !== null && phrasesAreLive ? String(phraseCount) : SAMPLE_STATS.totalCommunications.value}
              trend={phraseCount !== null && phrasesAreLive ? undefined : SAMPLE_STATS.totalCommunications.trend}
              description="Across all input methods"
              icon={MessageSquareText}
              color={FEATURES.blink.color}
              soft={FEATURES.blink.soft}
              sourceTag={phraseCount !== null && phrasesAreLive ? 'Live' : 'Sample'}
            />
            <StatCard
              title="Successful Translations"
              value={SAMPLE_STATS.successfulTranslations.value}
              trend={SAMPLE_STATS.successfulTranslations.trend}
              description={SAMPLE_STATS.successfulTranslations.description}
              icon={CircleCheck}
              color={FEATURES.sign.color}
              soft={FEATURES.sign.soft}
              sourceTag="Sample"
            />
            <StatCard
              title="Avg. Response Time"
              value={SAMPLE_STATS.avgResponse.value}
              trend={SAMPLE_STATS.avgResponse.trend}
              trendPositive
              description="Faster than last week"
              icon={Clock3}
              color={FEATURES.morse.color}
              soft={FEATURES.morse.soft}
              sourceTag="Sample"
            />
            <StatCard
              title="SOS Signals Sent"
              value={sosStat?.value ?? SAMPLE_STATS.sos.value}
              trend={sosStat ? undefined : SAMPLE_STATS.sos.trend}
              trendPositive={false}
              description={sosStat?.description ?? SAMPLE_STATS.sos.description}
              icon={Siren}
              color={FEATURES.sos.color}
              soft={FEATURES.sos.soft}
              sourceTag={sosStat ? 'Live' : 'Sample'}
            />
          </section>

          {/* Activity row */}
          <div className="grid grid-cols-1 gap-5 lg:gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(290px,330px)]">
            <CommunicationActivity onNavigate={onSelectTab} />
            <RecentActivity items={activityItems} isSample={!phrasesAreLive} onViewAll={() => openDrawer('admin')} />
          </div>

          {/* Bottom row */}
          <div className="grid grid-cols-1 gap-5 lg:gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(290px,330px)]">
            <QuickAccess onSelect={handleFeature} />
            <SystemStatus />
          </div>
        </main>
      </div>

      <SettingsDrawer
        open={drawerOpen}
        initialTab={drawerTab}
        onClose={() => setDrawerOpen(false)}
        patient={patient}
        sessionToken={sessionToken}
        recentPhrases={recentPhrases}
        onProfileUpdate={onProfileUpdate}
      />

      <SosConfirmDialog
        open={sosConfirmOpen}
        onCancel={() => setSosConfirmOpen(false)}
        onConfirm={() => {
          setSosConfirmOpen(false);
          onOpenSos();
        }}
      />
    </div>
  );
};
