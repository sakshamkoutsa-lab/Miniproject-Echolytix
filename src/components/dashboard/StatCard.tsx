import React from 'react';
import { ArrowUp, ArrowDown, type LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
  color: string;
  soft: string;
  /** e.g. "+12%" or "-28%". Omit to hide the trend chip. */
  trend?: string;
  /** Whether the trend direction is good news (controls green vs red). */
  trendPositive?: boolean;
  /** Small source tag such as "Live" or "Sample". */
  sourceTag?: 'Live' | 'Sample';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  description,
  icon: Icon,
  color,
  soft,
  trend,
  trendPositive = true,
  sourceTag,
}) => {
  const isDown = trend?.trim().startsWith('-');
  const trendColor = trendPositive ? '#159B68' : '#E23A3A';
  const TrendIcon = isDown ? ArrowDown : ArrowUp;

  return (
    <div className="relative flex h-full items-start gap-3.5 rounded-2xl border border-[#E8E8EB] bg-white p-5 shadow-[0_1px_3px_rgba(16,24,40,0.05)] transition-shadow hover:shadow-[0_6px_18px_rgba(16,24,40,0.07)]">
      {sourceTag && (
        <span
          className={`absolute right-3 top-3 rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${
            sourceTag === 'Live' ? 'bg-[#E9F7F0] text-[#159B68]' : 'bg-[#F3F4F6] text-[#9CA3AF]'
          }`}
          title={sourceTag === 'Live' ? 'Connected to live data' : 'Illustrative sample data'}
        >
          {sourceTag}
        </span>
      )}
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: soft }}>
        <Icon size={24} strokeWidth={1.8} style={{ color }} />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="pr-10 text-sm font-medium leading-snug text-[#17213A]">{title}</h3>
        <div className="mt-1.5 flex items-baseline gap-3">
          <span className="text-[28px] font-bold leading-none tracking-tight text-[#17213A]">{value}</span>
          {trend && (
            <span className="flex items-center gap-0.5 text-[13px] font-semibold" style={{ color: trendColor }}>
              <TrendIcon size={14} strokeWidth={2.4} />
              {trend.replace(/^-/, '')}
            </span>
          )}
        </div>
        <p className="mt-2 truncate text-[13px] text-[#6B7280]">{description}</p>
      </div>
    </div>
  );
};
