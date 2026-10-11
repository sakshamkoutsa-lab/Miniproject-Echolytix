import React from 'react';
import { History, ArrowRight, Eye, Hand, MessageSquareText, Grip, TriangleAlert, Video, type LucideIcon } from 'lucide-react';
import { FEATURES, type ActivityItem, type FeatureKey } from './dashboardData';

export const FEATURE_ICONS: Record<FeatureKey, LucideIcon> = {
  blink: Eye,
  sign: Hand,
  morse: Grip,
  tts: MessageSquareText,
  video: Video,
  sos: TriangleAlert,
};

interface RecentActivityProps {
  items: ActivityItem[];
  isSample: boolean;
  onViewAll: () => void;
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ items, isSample, onViewAll }) => (
  <section className="flex h-full flex-col rounded-2xl border border-[#E8E8EB] bg-white p-5 shadow-[0_1px_3px_rgba(16,24,40,0.05)] sm:p-6">
    <header className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2.5">
        <History size={20} strokeWidth={2} className="text-[#F4512A]" />
        <h2 className="text-[17px] font-semibold text-[#17213A]">Recent Activity</h2>
        {isSample && (
          <span className="rounded-full bg-[#F3F4F6] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#9CA3AF]">
            Sample
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={onViewAll}
        className="group flex items-center gap-1 text-[13px] font-medium text-[#F4512A] hover:text-[#D9401C]"
      >
        View All
        <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
      </button>
    </header>

    {items.length === 0 ? (
      <p className="mt-6 text-sm text-[#6B7280]">No activity recorded yet.</p>
    ) : (
      <ol className="mt-4 flex-1">
        {items.map((item, idx) => {
          const f = FEATURES[item.feature];
          const Icon = FEATURE_ICONS[item.feature];
          const last = idx === items.length - 1;
          return (
            <li key={item.id} className="relative flex gap-3 pb-3.5 last:pb-0">
              {/* Timeline dot + connector */}
              <div className="relative flex w-2 shrink-0 justify-center pt-[13px]">
                <span className="relative z-10 h-2 w-2 rounded-full" style={{ backgroundColor: f.color }} />
                {!last && <span className="absolute top-[24px] -bottom-[2px] w-px bg-[#E8E8EB]" aria-hidden="true" />}
              </div>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: f.soft }}>
                <Icon size={16} strokeWidth={2} style={{ color: f.color }} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[13px] font-semibold text-[#17213A]">{item.title}</span>
                  <time className="shrink-0 text-[11.5px] text-[#9CA3AF]">{item.time}</time>
                </div>
                <p className="truncate text-[12.5px] text-[#6B7280]" title={item.detail}>
                  {item.detail}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    )}
  </section>
);
