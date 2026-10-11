import React from 'react';
import { Activity } from 'lucide-react';

interface NeuralBlinkTrackerProps {
  predictedState: string;
  probabilities: Record<string, number>;
  accuracy?: number | string;
  architecture?: string;
}

export const NeuralBlinkTracker: React.FC<NeuralBlinkTrackerProps> = ({
  predictedState = 'OPEN',
  probabilities = {},
  accuracy = '100.00%',
  architecture = '2 in → 8 Hidden → 3 out',
}) => {
  const classes = ['OPEN', 'BLINK', 'WINK'];

  return (
    <section className="flex flex-col rounded-2xl border border-[#E8E8EB] bg-white p-5 shadow-[0_1px_3px_rgba(16,24,40,0.05)] sm:p-6">
      {/* Header */}
      <header className="flex items-center justify-between gap-3 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F2EDFC] text-[#7C4DDB]">
            <Activity size={18} strokeWidth={2.2} />
          </div>
          <h2 className="text-[17px] font-semibold text-[#17213A]">Neural Blink Tracker</h2>
        </div>

        {/* Accuracy badge */}
        <span className="rounded-full bg-[#E9F7F0] px-2.5 py-0.5 text-xs font-semibold text-[#10B981]">
          Accuracy: {typeof accuracy === 'number' ? `${accuracy}%` : accuracy}
        </span>
      </header>

      {/* State and Architecture description */}
      <div className="space-y-1 py-1 font-mono text-xs">
        <div className="flex items-center justify-between">
          <span className="text-[#6B7280]">Predictor State:</span>
          <span className="font-bold text-[#7C4DDB]">{predictedState}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[#6B7280]">Architecture:</span>
          <span className="text-[#202938]">{architecture}</span>
        </div>
      </div>

      {/* Probability bars */}
      <div className="mt-3 space-y-2.5">
        {classes.map((cls) => {
          const rawVal = probabilities[cls] ?? (cls === predictedState ? 1.0 : 0.0);
          const pct = Math.min(100, Math.max(0, rawVal * 100));
          const isActive = cls === predictedState;

          return (
            <div key={cls} className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className={isActive ? 'text-[#7C4DDB]' : 'text-[#6B7280]'}>
                  {cls}
                </span>
                <span className={isActive ? 'font-mono text-[#F4512A]' : 'font-mono text-[#6B7280]'}>
                  {pct.toFixed(1)}%
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#F0EFEA]">
                <div
                  className={`h-full rounded-full transition-all duration-150 ${
                    isActive ? 'bg-[#F4512A]' : 'bg-[#E5E7EB]'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
