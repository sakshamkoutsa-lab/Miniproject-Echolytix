import React, { useState } from 'react';
import { Cpu, CheckCircle2 } from 'lucide-react';
import { FingerStates } from '../../utils/gesture';

interface GeometricGestureEngineProps {
  handDetected: boolean;
  fingerStates: FingerStates;
  probabilities: Record<string, number>;
}

const FINGER_KEYS: { key: keyof FingerStates; label: string }[] = [
  { key: 'thumb', label: 'Thumb' },
  { key: 'index', label: 'Index' },
  { key: 'middle', label: 'Middle' },
  { key: 'ring', label: 'Ring' },
  { key: 'pinky', label: 'Pinky' },
];

const PREDICTION_CLASSES = ['HELLO', 'YES', 'NO', 'HELP', 'NEED WATER'];

export const GeometricGestureEngine: React.FC<GeometricGestureEngineProps> = ({
  handDetected,
  fingerStates,
  probabilities,
}) => {
  return (
    <section className="flex flex-col rounded-2xl border border-[#E8E8EB] bg-white p-5 shadow-[0_1px_3px_rgba(16,24,40,0.05)] sm:p-6">
      {/* Header */}
      <header className="flex items-center justify-between pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F2EDFC] text-[#7751E8]">
            <Cpu size={19} strokeWidth={2.2} />
          </div>
          <div>
            <h2 className="text-[17px] font-semibold leading-tight text-[#17213A]">
              Geometric Gesture Engine
            </h2>
            <p className="text-xs font-medium text-[#16A36A]">Real-time finger tracking</p>
          </div>
        </div>

        {/* Status Badge */}
        <span
          className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
            handDetected
              ? 'bg-[#E9F7F0] text-[#16A36A]'
              : 'bg-[#F3F4F6] text-[#6B7280]'
          }`}
        >
          {handDetected ? 'Hand Detected' : 'No Hand'}
        </span>
      </header>

      {/* LIVE FINGER SIGNAL Section */}
      <div className="space-y-2">
        <h3 className="text-[11px] font-bold tracking-wider text-[#6B7280] uppercase">
          LIVE FINGER SIGNAL
        </h3>
        <div className="grid grid-cols-5 gap-2">
          {FINGER_KEYS.map(({ key, label }) => {
            const isActive = handDetected && !!fingerStates[key];
            return (
              <div
                key={key}
                className={`flex flex-col items-center justify-center rounded-xl border p-2.5 transition-all ${
                  isActive
                    ? 'border-[#F4512A] bg-[#FFF8F5] text-[#F4512A] shadow-sm'
                    : 'border-[#EAE8E2] bg-[#FAF8F5] text-[#6B7280]'
                }`}
              >
                {/* Circular Indicator */}
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors ${
                    isActive
                      ? 'border-[#F4512A] bg-[#F4512A] text-white'
                      : 'border-[#D1D5DB] bg-white'
                  }`}
                >
                  {isActive ? (
                    <span className="h-2 w-2 rounded-full bg-white" />
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-transparent" />
                  )}
                </div>
                <span className="mt-1.5 text-xs font-medium">{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* PREDICTION PROBABILITY Section */}
      <div className="mt-5 space-y-2.5">
        <h3 className="text-[11px] font-bold tracking-wider text-[#6B7280] uppercase">
          PREDICTION PROBABILITY
        </h3>
        <div className="space-y-3">
          {PREDICTION_CLASSES.map((cls) => {
            const rawProb = handDetected ? probabilities[cls] ?? 0.0 : 0.0;
            const pct = Math.min(100, Math.max(0, rawProb * 100));
            const isHighest = handDetected && pct > 60;

            return (
              <div key={cls} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className={isHighest ? 'text-[#F4512A]' : 'text-[#202938]'}>
                    {cls}
                  </span>
                  <span className="font-mono text-[#6B7280]">{pct.toFixed(1)}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[#F5EFE6]">
                  <div
                    className={`h-full rounded-full transition-all duration-150 ${
                      isHighest ? 'bg-[#F4512A]' : 'bg-[#E5E7EB]'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
