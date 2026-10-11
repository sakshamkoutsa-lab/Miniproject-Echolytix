import React from 'react';
import { Gauge } from 'lucide-react';
import { MORSE_MODEL_ACCURACY } from '../../utils/morseClassifier';

interface NeuralTapClassifierCardProps {
  durationMs: number;
  classified: 'NONE' | 'DOT' | 'DASH';
  confidence: number;
  dotProb: number;
  dashProb: number;
}

export const NeuralTapClassifierCard: React.FC<NeuralTapClassifierCardProps> = ({
  durationMs,
  classified,
  confidence,
  dotProb,
  dashProb,
}) => {
  const confidencePercent =
    classified === 'NONE'
      ? '0%'
      : `${(confidence * 100).toFixed(confidence * 100 === 100 ? 0 : 1)}%`;

  const dotPercent = (dotProb * 100).toFixed(1);
  const dashPercent = (dashProb * 100).toFixed(1);

  return (
    <div className="w-full rounded-2xl border border-[#E8E8EB] bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between transition-all">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#F5F5F7]">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F1EDFC] text-[#7251E8]">
            <Gauge size={16} strokeWidth={2.4} />
          </div>
          <h3 className="text-sm sm:text-base font-bold text-[#17213A]">
            Neural Tap Classifier
          </h3>
        </div>

        {/* Accuracy badge matching screenshot: Accuracy: 100.00% */}
        <span className="rounded-full bg-[#E6F4EA] px-2.5 py-0.5 text-xs font-semibold text-[#159B68] font-mono">
          Accuracy: {MORSE_MODEL_ACCURACY}%
        </span>
      </div>

      {/* 3 Metrics Row: DURATION | CLASSIFIED | CONFIDENCE */}
      <div className="grid grid-cols-3 gap-2 py-4 text-center">
        {/* Metric 1: Duration */}
        <div>
          <span className="text-[10px] sm:text-[11px] font-bold tracking-wider text-[#718096] uppercase font-mono">
            DURATION
          </span>
          <p className="mt-1 text-base sm:text-lg font-extrabold text-[#17213A] font-mono">
            {durationMs} ms
          </p>
        </div>

        {/* Metric 2: Classified */}
        <div>
          <span className="text-[10px] sm:text-[11px] font-bold tracking-wider text-[#718096] uppercase font-mono">
            CLASSIFIED
          </span>
          <p
            className={`mt-1 text-base sm:text-lg font-extrabold font-mono ${
              classified === 'NONE'
                ? 'text-[#718096]'
                : classified === 'DOT'
                ? 'text-[#159B68]'
                : 'text-[#F4512A]'
            }`}
          >
            {classified}
          </p>
        </div>

        {/* Metric 3: Confidence */}
        <div>
          <span className="text-[10px] sm:text-[11px] font-bold tracking-wider text-[#718096] uppercase font-mono">
            CONFIDENCE
          </span>
          <p className="mt-1 text-base sm:text-lg font-extrabold text-[#7251E8] font-mono">
            {confidencePercent}
          </p>
        </div>
      </div>

      {/* Probability Bars: DOT & DASH */}
      <div className="space-y-3 pt-2">
        {/* DOT Bar */}
        <div>
          <div className="flex items-center justify-between text-xs font-mono text-[#718096] mb-1">
            <span className="font-bold text-[#17213A]">DOT</span>
            <span>{dotPercent}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[#F5EFE3]">
            <div
              className="h-full rounded-full bg-[#159B68] transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, dotProb * 100))}%` }}
            />
          </div>
        </div>

        {/* DASH Bar */}
        <div>
          <div className="flex items-center justify-between text-xs font-mono text-[#718096] mb-1">
            <span className="font-bold text-[#17213A]">DASH</span>
            <span>{dashPercent}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[#F5EFE3]">
            <div
              className="h-full rounded-full bg-[#F4512A] transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, dashProb * 100))}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
