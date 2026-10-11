import React from 'react';
import { Zap, ArrowRight } from 'lucide-react';
import { FEATURES, type FeatureKey } from './dashboardData';
import { FEATURE_ICONS } from './RecentActivity';

const ITEMS: { key: FeatureKey; title: string; action: string }[] = [
  { key: 'blink', title: 'Blink to Text', action: 'Start now' },
  { key: 'sign', title: 'Hand Sign', action: 'Start now' },
  { key: 'morse', title: 'Morse Code', action: 'Start now' },
  { key: 'tts', title: 'Text-to-Speech', action: 'Start now' },
  { key: 'video', title: 'Video Call', action: 'Start now' },
  { key: 'sos', title: 'Emergency SOS', action: 'Trigger now' },
];

interface QuickAccessProps {
  onSelect: (key: FeatureKey) => void;
}

export const QuickAccess: React.FC<QuickAccessProps> = ({ onSelect }) => (
  <section className="flex h-full flex-col rounded-2xl border border-[#E8E8EB] bg-white p-5 shadow-[0_1px_3px_rgba(16,24,40,0.05)] sm:p-6">
    <header className="flex items-center gap-2.5">
      <Zap size={20} strokeWidth={2} className="text-[#F4512A]" />
      <h2 className="text-[17px] font-semibold text-[#17213A]">Quick Access</h2>
    </header>

    <div className="mt-4 grid flex-1 grid-cols-2 content-center gap-2.5 sm:grid-cols-3 xl:grid-cols-6">
      {ITEMS.map((item) => {
        const f = FEATURES[item.key];
        const Icon = FEATURE_ICONS[item.key];
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onSelect(item.key)}
            className="group flex min-h-[118px] flex-col items-center justify-center gap-1.5 rounded-xl border px-1.5 py-4 text-center transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(16,24,40,0.08)] focus-visible:outline-none focus-visible:ring-4"
            style={{ backgroundColor: f.soft, borderColor: `${f.color}22`, ['--tw-ring-color' as string]: `${f.color}33` }}
          >
            <Icon size={28} strokeWidth={1.7} style={{ color: f.color }} className="transition-transform duration-200 group-hover:scale-110" />
            <span className="mt-1.5 text-[13px] font-semibold leading-tight text-[#17213A]">{item.title}</span>
            <span className="flex items-center gap-1 whitespace-nowrap text-[11.5px] font-medium" style={{ color: f.color }}>
              {item.action}
              <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
            </span>
          </button>
        );
      })}
    </div>
  </section>
);
