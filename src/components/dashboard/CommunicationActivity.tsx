import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChartColumn, Info, ChevronRight } from 'lucide-react';
import {
  FEATURES,
  SAMPLE_ACTIVITY,
  SAMPLE_TOTALS,
  type TimeRange,
} from './dashboardData';
import type { NavTab } from '../../types';

type SeriesKey = 'blink' | 'sign' | 'morse' | 'tts';
const SERIES_ORDER: SeriesKey[] = ['blink', 'sign', 'morse', 'tts'];
const RANGES: { id: TimeRange; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' },
];

/** Catmull-Rom → cubic Bézier for a smooth line through every point. */
function smoothPath(points: [number, number][]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M${points[0][0]},${points[0][1]}`;
  let d = `M${points[0][0]},${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const t = 0.18;
    const c1x = p1[0] + (p2[0] - p0[0]) * t;
    const c1y = p1[1] + (p2[1] - p0[1]) * t;
    const c2x = p2[0] - (p3[0] - p1[0]) * t;
    const c2y = p2[1] - (p3[1] - p1[1]) * t;
    d += ` C${c1x},${c1y} ${c2x},${c2y} ${p2[0]},${p2[1]}`;
  }
  return d;
}

/** Round the axis max up so 4 equal steps land on friendly integers (e.g. 33 → 40). */
function niceMax(v: number): number {
  if (v <= 0) return 4;
  const rawStep = v / 4;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const nice = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find((m) => m * magnitude >= rawStep) ?? 10;
  return nice * magnitude * 4;
}

interface ActivityChartProps {
  labels: string[];
  series: Record<SeriesKey, number[]>;
}

const ActivityChart: React.FC<ActivityChartProps> = ({ labels, series }) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(260, entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const height = 230;
  const pad = { top: 12, right: 24, bottom: 28, left: 32 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  const max = niceMax(Math.max(...SERIES_ORDER.flatMap((k) => series[k])));
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(max * f));
  const x = (i: number) => pad.left + (labels.length === 1 ? innerW / 2 : (i / (labels.length - 1)) * innerW);
  const y = (v: number) => pad.top + innerH - (v / max) * innerH;

  // Thin out x labels on narrow screens so they stay readable.
  const labelEvery = innerW / labels.length < 46 ? 2 : 1;

  const handleMove = (e: React.MouseEvent<SVGRectElement>) => {
    const rect = (e.currentTarget as SVGRectElement).getBoundingClientRect();
    const rel = (e.clientX - rect.left) / rect.width;
    setHover(Math.round(rel * (labels.length - 1)));
  };

  return (
    <div ref={wrapRef} className="relative w-full">
      <svg width={width} height={height} role="img" aria-label="Communication activity chart" className="block">
        <defs>
          {SERIES_ORDER.map((k) => (
            <linearGradient key={k} id={`grad-${k}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={FEATURES[k].color} stopOpacity={0.16} />
              <stop offset="100%" stopColor={FEATURES[k].color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>

        {/* Horizontal grid + Y labels */}
        {ticks.map((t) => (
          <g key={`y-${t}`}>
            <line x1={pad.left} x2={width - pad.right} y1={y(t)} y2={y(t)} stroke="#EEEFF2" strokeDasharray={t === 0 ? undefined : '3 4'} />
            <text x={pad.left - 10} y={y(t)} textAnchor="end" dominantBaseline="middle" fontSize="11" fill="#9CA3AF">
              {t}
            </text>
          </g>
        ))}

        {/* Vertical grid + X labels */}
        {labels.map((l, i) => (
          <g key={`x-${l}`}>
            <line x1={x(i)} x2={x(i)} y1={pad.top} y2={pad.top + innerH} stroke="#F3F4F6" />
            {i % labelEvery === 0 && (
              <text x={x(i)} y={height - 8} textAnchor="middle" fontSize="11" fill="#9CA3AF">
                {l}
              </text>
            )}
          </g>
        ))}

        {/* Areas then lines (draw back-to-front so the largest series sits behind) */}
        {SERIES_ORDER.map((k) => {
          const pts = series[k].map((v, i) => [x(i), y(v)] as [number, number]);
          const line = smoothPath(pts);
          const area = `${line} L${x(pts.length - 1)},${y(0)} L${x(0)},${y(0)} Z`;
          return <path key={`a-${k}`} d={area} fill={`url(#grad-${k})`} />;
        })}
        {SERIES_ORDER.map((k) => {
          const pts = series[k].map((v, i) => [x(i), y(v)] as [number, number]);
          return (
            <path
              key={`l-${k}`}
              d={smoothPath(pts)}
              fill="none"
              stroke={FEATURES[k].color}
              strokeWidth={2.2}
              strokeLinecap="round"
              className="transition-[d] duration-500"
            />
          );
        })}

        {/* Hover guide */}
        {hover !== null && (
          <g pointerEvents="none">
            <line x1={x(hover)} x2={x(hover)} y1={pad.top} y2={pad.top + innerH} stroke="#D1D5DB" strokeDasharray="3 3" />
            {SERIES_ORDER.map((k) => (
              <circle key={k} cx={x(hover)} cy={y(series[k][hover])} r={4} fill="#fff" stroke={FEATURES[k].color} strokeWidth={2} />
            ))}
          </g>
        )}
        <rect
          x={pad.left}
          y={pad.top}
          width={innerW}
          height={innerH}
          fill="transparent"
          onMouseMove={handleMove}
          onMouseLeave={() => setHover(null)}
        />
      </svg>

      {hover !== null && (
        <div
          className="pointer-events-none absolute top-2 z-10 min-w-[130px] rounded-lg border border-[#E8E8EB] bg-white px-3 py-2 text-xs shadow-md"
          style={{
            left: Math.min(Math.max(x(hover) + 12, 0), width - 150),
          }}
        >
          <div className="mb-1 font-semibold text-[#17213A]">{labels[hover]}</div>
          {SERIES_ORDER.map((k) => (
            <div key={k} className="flex items-center justify-between gap-3 text-[#6B7280]">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: FEATURES[k].color }} />
                {FEATURES[k].label}
              </span>
              <span className="font-semibold text-[#17213A]">{series[k][hover]}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

interface CommunicationActivityProps {
  onNavigate: (tab: NavTab) => void;
}

export const CommunicationActivity: React.FC<CommunicationActivityProps> = ({ onNavigate }) => {
  const [range, setRange] = useState<TimeRange>('today');
  const data = SAMPLE_ACTIVITY[range];
  const totals = SAMPLE_TOTALS[range];

  const legend = useMemo(() => SERIES_ORDER.map((k) => FEATURES[k]), []);

  return (
    <section
      id="communication-activity"
      className="flex h-full flex-col rounded-2xl border border-[#E8E8EB] bg-white p-5 shadow-[0_1px_3px_rgba(16,24,40,0.05)] sm:p-6"
    >
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <ChartColumn size={20} strokeWidth={2} className="text-[#F4512A]" />
          <h2 className="text-[17px] font-semibold text-[#17213A]">Communication Activity</h2>
          <span title="Illustrative sample data — no analytics backend is connected yet." className="cursor-help text-[#9CA3AF]">
            <Info size={15} />
          </span>
          <span className="rounded-full bg-[#F3F4F6] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#9CA3AF]">
            Sample data
          </span>
        </div>

        <div role="tablist" aria-label="Time range" className="flex rounded-lg border border-[#E8E8EB] bg-[#F7F7F8] p-0.5">
          {RANGES.map((r) => (
            <button
              key={r.id}
              type="button"
              role="tab"
              aria-selected={range === r.id}
              onClick={() => setRange(r.id)}
              className={`rounded-md px-3.5 py-1.5 text-[13px] font-medium transition-all duration-200 ${
                range === r.id ? 'bg-[#F4512A] text-white shadow-sm' : 'text-[#3A4256] hover:text-[#17213A]'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </header>

      <div className="mt-5 grid flex-1 grid-cols-1 gap-5 md:grid-cols-[minmax(0,1fr)_200px]">
        <div className="min-w-0">
          <ActivityChart labels={data.labels} series={data.series} />
          <ul className="mt-3 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {legend.map((f) => (
              <li key={f.key} className="flex items-center gap-2 text-[13px] text-[#3A4256]">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: f.color }} />
                {f.label}
              </li>
            ))}
          </ul>
        </div>

        <ul className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 md:grid-cols-1 md:content-center">
          {SERIES_ORDER.map((k) => {
            const f = FEATURES[k];
            return (
              <li key={k}>
                <button
                  type="button"
                  onClick={() => f.tab && onNavigate(f.tab)}
                  className="group flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
                  style={{ backgroundColor: f.soft, borderColor: `${f.color}26` }}
                >
                  <span className="text-[22px] font-bold leading-none" style={{ color: f.color }}>
                    {totals[k]}
                  </span>
                  <span className="flex-1 truncate text-[13px] font-medium" style={{ color: f.color }}>
                    {f.label}
                  </span>
                  <ChevronRight size={16} className="transition-transform group-hover:translate-x-0.5" style={{ color: f.color }} />
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
};
