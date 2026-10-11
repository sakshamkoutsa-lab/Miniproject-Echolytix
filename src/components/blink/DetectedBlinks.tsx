import React from 'react';
import { Activity, Eye } from 'lucide-react';

export interface BlinkEventItem {
  id: string;
  eye: 'left' | 'right' | 'both';
  action: 'Select' | 'Type' | 'Backspace' | 'Space' | 'SOS';
  timestamp: string;
}

interface DetectedBlinksProps {
  events: BlinkEventItem[];
}

export const DetectedBlinks: React.FC<DetectedBlinksProps> = ({ events }) => {
  return (
    <section className="flex flex-col rounded-2xl border border-[#E8E8EB] bg-white p-5 shadow-[0_1px_3px_rgba(16,24,40,0.05)] sm:p-6">
      {/* Header */}
      <header className="flex items-center gap-2 pb-3">
        <Activity size={18} strokeWidth={2.2} className="text-[#F4512A]" />
        <h2 className="text-[17px] font-semibold text-[#17213A]">Detected Blinks (Live)</h2>
      </header>

      {/* Events list */}
      <div className="flex max-h-[190px] flex-col gap-2 overflow-y-auto pr-1">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center text-xs text-[#9CA3AF]">
            <Eye size={22} className="mb-1 text-[#D1D5DB]" />
            <span>Waiting for blink events...</span>
          </div>
        ) : (
          events.slice(0, 7).map((ev) => (
            <div
              key={ev.id}
              className="flex items-center justify-between rounded-lg bg-[#FAF9F7] px-3 py-2 text-xs transition-colors hover:bg-[#F3F1EC]"
            >
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#FFF1EC] text-[#F4512A]">
                  <Eye size={12} strokeWidth={2.4} />
                </span>
                <span className="font-medium text-[#202938]">
                  {ev.eye === 'left'
                    ? 'Left Eye Blink'
                    : ev.eye === 'right'
                    ? 'Right Eye Blink'
                    : 'Eye Blink'}{' '}
                  <span className="text-[#9CA3AF]">→</span>{' '}
                  <span className="font-semibold text-[#F4512A]">{ev.action}</span>
                </span>
              </div>
              <time className="font-mono text-[11px] text-[#9CA3AF]">{ev.timestamp}</time>
            </div>
          ))
        )}
      </div>
    </section>
  );
};
