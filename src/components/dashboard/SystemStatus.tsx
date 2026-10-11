import React, { useCallback, useEffect, useState } from 'react';
import { ShieldCheck, RefreshCw } from 'lucide-react';

type Health = 'checking' | 'online' | 'offline' | 'unknown';

interface ServiceCheck {
  id: string;
  name: string;
  /** What is actually probed – shown as a tooltip so the status is never opaque. */
  probe: string;
  run: () => Promise<Health>;
}

const withTimeout = <T,>(p: Promise<T>, ms = 5000) =>
  Promise.race([p, new Promise<T>((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);

const httpOk = async (url: string, method: 'GET' | 'HEAD' = 'GET'): Promise<Health> => {
  try {
    const res = await withTimeout(fetch(url, { method, cache: 'no-store' }));
    return res.ok ? 'online' : 'offline';
  } catch {
    return 'offline';
  }
};

/**
 * Real, lightweight client-side probes. EchoLytix has no dedicated health-check
 * API, so each row checks the concrete dependency it represents instead of
 * hard-coding "Online".
 */
const CHECKS: ServiceCheck[] = [
  {
    id: 'camera',
    name: 'Camera Services',
    probe: 'Detects an available video input device',
    run: async () => {
      if (!navigator.mediaDevices?.enumerateDevices) return 'unknown';
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        return devices.some((d) => d.kind === 'videoinput') ? 'online' : 'offline';
      } catch {
        return 'unknown';
      }
    },
  },
  {
    id: 'ai',
    name: 'AI Models',
    probe: 'MediaPipe vision runtime (/wasm) is reachable',
    run: () => httpOk('/wasm/vision_wasm_internal.wasm', 'HEAD'),
  },
  {
    id: 'translation',
    name: 'Translation Engine',
    probe: 'Browser speech synthesis engine is available',
    run: async () => ('speechSynthesis' in window ? 'online' : 'offline'),
  },
  {
    id: 'notifications',
    name: 'Notification Services',
    probe: 'Emergency SOS API responds',
    run: () => httpOk('/api/emergency/sos?limit=1'),
  },
  {
    id: 'sync',
    name: 'Cloud Sync',
    probe: 'Network is online and phrase history API responds',
    run: async () => (navigator.onLine ? httpOk('/api/phrases?limit=1') : 'offline'),
  },
];

const LABEL: Record<Health, string> = {
  checking: 'Checking…',
  online: 'Online',
  offline: 'Unavailable',
  unknown: 'Unknown',
};
const COLOR: Record<Health, string> = {
  checking: '#9CA3AF',
  online: '#159B68',
  offline: '#E23A3A',
  unknown: '#D97706',
};

export const SystemStatus: React.FC = () => {
  const [status, setStatus] = useState<Record<string, Health>>(() =>
    Object.fromEntries(CHECKS.map((c) => [c.id, 'checking' as Health]))
  );
  const [checkedAt, setCheckedAt] = useState<Date | null>(null);

  const runChecks = useCallback(async () => {
    setStatus(Object.fromEntries(CHECKS.map((c) => [c.id, 'checking' as Health])));
    const results = await Promise.all(CHECKS.map(async (c) => [c.id, await c.run()] as const));
    setStatus(Object.fromEntries(results));
    setCheckedAt(new Date());
  }, []);

  useEffect(() => {
    runChecks();
    const id = window.setInterval(runChecks, 60_000);
    return () => window.clearInterval(id);
  }, [runChecks]);

  const values = Object.values(status);
  const checking = values.includes('checking');
  const allOnline = values.every((v) => v === 'online');
  const anyOffline = values.includes('offline');

  const badge = checking
    ? { text: 'Checking systems…', color: '#6B7280', bg: '#F3F4F6' }
    : allOnline
      ? { text: 'All Systems Operational', color: '#159B68', bg: '#E9F7F0' }
      : anyOffline
        ? { text: 'Partial Outage', color: '#E23A3A', bg: '#FDECEC' }
        : { text: 'Some Checks Inconclusive', color: '#B45309', bg: '#FEF3C7' };

  return (
    <section className="h-full rounded-2xl border border-[#E8E8EB] bg-white p-5 shadow-[0_1px_3px_rgba(16,24,40,0.05)] sm:p-6">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <ShieldCheck size={20} strokeWidth={2} className="text-[#159B68]" />
          <h2 className="text-[17px] font-semibold text-[#17213A]">System Status</h2>
        </div>
        <span
          className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-medium"
          style={{ color: badge.color, backgroundColor: badge.bg }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: badge.color }} />
          {badge.text}
        </span>
      </header>

      <ul className="mt-3">
        {CHECKS.map((c) => {
          const h = status[c.id];
          return (
            <li key={c.id} className="flex items-center gap-3 border-b border-[#F1F1F3] py-2.5 last:border-0" title={c.probe}>
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${h === 'checking' ? 'animate-pulse' : ''}`}
                style={{ backgroundColor: COLOR[h] }}
              />
              <span className="flex-1 text-[13px] text-[#3A4256]">{c.name}</span>
              <span className="text-[13px] font-medium" style={{ color: COLOR[h] }}>
                {LABEL[h]}
              </span>
            </li>
          );
        })}
      </ul>

      <div className="mt-2 flex items-center justify-between text-[11px] text-[#9CA3AF]">
        <span>{checkedAt ? `Last checked ${checkedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Running checks…'}</span>
        <button
          type="button"
          onClick={runChecks}
          disabled={checking}
          className="flex items-center gap-1 rounded-md px-1.5 py-1 font-medium text-[#6B7280] transition-colors hover:text-[#17213A] disabled:opacity-50"
        >
          <RefreshCw size={12} className={checking ? 'animate-spin' : ''} /> Re-check
        </button>
      </div>
    </section>
  );
};
