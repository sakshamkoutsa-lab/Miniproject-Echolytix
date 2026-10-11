/**
 * Dashboard configuration + ILLUSTRATIVE sample data.
 *
 * EchoLytix has no analytics backend yet. Everything in the `SAMPLE_*`
 * constants below is demo data used to render the dashboard design and is
 * labelled as "Sample data" in the UI. Live sources that DO exist
 * (`/api/phrases`, `/api/emergency/sos`) are wired up in Dashboard.tsx and
 * override these samples whenever they return data.
 */
import type { NavTab, RecentPhrase } from '../../types';

export const DASHBOARD_THEME = {
  primary: '#F4512A',
  background: '#F7F7F8',
  card: '#FFFFFF',
  text: '#17213A',
  muted: '#6B7280',
  success: '#159B68',
  border: '#E8E8EB',
} as const;

/** Fallback identity shown when the logged-in patient has no name. */
export const DEFAULT_USER = {
  name: 'Arjun Pratap',
  role: 'NTRO Analyst',
};

export type FeatureKey = 'blink' | 'sign' | 'morse' | 'tts' | 'video' | 'sos';

export interface FeatureMeta {
  key: FeatureKey;
  label: string;
  /** Existing App tab to navigate to; `null` means "open the SOS flow". */
  tab: NavTab | null;
  color: string;
  soft: string;
}

export const FEATURES: Record<FeatureKey, FeatureMeta> = {
  blink: { key: 'blink', label: 'Blink to Text', tab: 'blink', color: '#F4512A', soft: '#FFF1EC' },
  sign: { key: 'sign', label: 'Hand Sign', tab: 'sign', color: '#159B68', soft: '#E9F7F0' },
  morse: { key: 'morse', label: 'Morse Code', tab: 'morse', color: '#7C4DDB', soft: '#F2EDFC' },
  tts: { key: 'tts', label: 'TTS', tab: 'tts', color: '#2F6FE4', soft: '#EBF2FD' },
  // "Video Call" maps to the existing Remote camera receiver tab.
  video: { key: 'video', label: 'Video Call', tab: 'remote', color: '#E5466B', soft: '#FDEEF2' },
  sos: { key: 'sos', label: 'SOS', tab: null, color: '#E23A3A', soft: '#FDECEC' },
};

/** Map the backend phrase `mode` to a dashboard feature. */
export const MODE_TO_FEATURE: Record<RecentPhrase['mode'], FeatureKey> = {
  Blink: 'blink',
  Sign: 'sign',
  Morse: 'morse',
  TTS: 'tts',
};

export type TimeRange = 'today' | 'week' | 'month';

export interface ActivitySeries {
  labels: string[];
  series: Record<'blink' | 'sign' | 'morse' | 'tts', number[]>;
}

/** Illustrative chart data (no analytics endpoint exists yet). */
export const SAMPLE_ACTIVITY: Record<TimeRange, ActivitySeries> = {
  today: {
    labels: ['8 AM', '10 AM', '12 PM', '2 PM', '4 PM', '6 PM', '8 PM', '10 PM'],
    series: {
      blink: [12, 19, 31, 24, 21, 33, 30, 13],
      sign: [8, 14, 22, 17, 15, 24, 22, 9],
      morse: [4, 7, 10, 7, 6, 9, 8, 4],
      tts: [10, 15, 26, 20, 18, 28, 25, 11],
    },
  },
  week: {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    series: {
      blink: [38, 45, 41, 52, 48, 30, 27],
      sign: [24, 30, 28, 33, 35, 20, 18],
      morse: [14, 16, 12, 19, 17, 10, 9],
      tts: [32, 36, 34, 40, 44, 26, 22],
    },
  },
  month: {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'],
    series: {
      blink: [210, 245, 232, 268, 120],
      sign: [140, 162, 158, 175, 80],
      morse: [70, 82, 76, 91, 40],
      tts: [190, 205, 214, 236, 110],
    },
  },
};

/** Headline totals shown in the summary chips for each range (sample). */
export const SAMPLE_TOTALS: Record<TimeRange, Record<'blink' | 'sign' | 'morse' | 'tts', number>> = {
  today: { blink: 42, sign: 28, morse: 16, tts: 38 },
  week: { blink: 281, sign: 188, morse: 97, tts: 234 },
  month: { blink: 1075, sign: 715, morse: 359, tts: 955 },
};

export interface ActivityItem {
  id: string;
  feature: FeatureKey;
  title: string;
  detail: string;
  time: string;
}

export const SAMPLE_RECENT_ACTIVITY: ActivityItem[] = [
  { id: 's1', feature: 'blink', title: 'Blink to Text', detail: 'Translated: "Hello, I need help"', time: '10:24 AM' },
  { id: 's2', feature: 'sign', title: 'Hand Sign', detail: 'Recognized: "Need water"', time: '10:22 AM' },
  { id: 's3', feature: 'tts', title: 'TTS', detail: 'Spoke: "Please adjust my pillow position."', time: '10:18 AM' },
  { id: 's4', feature: 'morse', title: 'Morse Code', detail: 'Translated: "SOS"', time: '10:15 AM' },
  { id: 's5', feature: 'sos', title: 'SOS', detail: 'Distress signal sent to Saksham', time: '10:10 AM' },
  { id: 's6', feature: 'video', title: 'Video Call', detail: 'Call started with caretaker', time: '09:52 AM' },
];

export const SAMPLE_STATS = {
  totalCommunications: { value: '128', trend: '+12%' },
  successfulTranslations: { value: '124', trend: '+8%', description: '96.9% success rate' },
  avgResponse: { value: '1.2s', trend: '-28%' },
  sos: { value: '3', trend: '+200%', description: '1 resolved · 2 acknowledged' },
};
