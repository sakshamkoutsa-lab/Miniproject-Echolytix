import React from 'react';
import { Settings, Info } from 'lucide-react';

interface BlinkControlsProps {
  blinkThreshold: number; // in seconds, e.g. 0.6
  onThresholdChange: (val: number) => void;
  typingMode: 'alphabet' | 'numbers';
  onTypingModeChange: (mode: 'alphabet' | 'numbers') => void;
}

export const BlinkControls: React.FC<BlinkControlsProps> = ({
  blinkThreshold,
  onThresholdChange,
  typingMode,
  onTypingModeChange,
}) => {
  return (
    <section className="flex flex-col rounded-2xl border border-[#E8E8EB] bg-white p-5 shadow-[0_1px_3px_rgba(16,24,40,0.05)] sm:p-6">
      {/* Header */}
      <header className="flex items-center gap-2.5 pb-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FFF1EC] text-[#F4512A]">
          <Settings size={18} strokeWidth={2.2} />
        </div>
        <h2 className="text-[17px] font-semibold text-[#17213A]">Blink Controls</h2>
      </header>

      {/* Slider row */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#202938]">
            <span>Blink Duration Threshold</span>
            <span
              title="Adjust duration used to differentiate between a short dot and long dash blink"
              className="cursor-help text-[#9CA3AF] hover:text-[#6B7280]"
            >
              <Info size={14} />
            </span>
          </div>
          <span className="rounded-md bg-[#FFF1EC] px-2 py-0.5 font-mono text-xs font-bold text-[#F4512A]">
            {blinkThreshold.toFixed(1)} s
          </span>
        </div>

        {/* Range Slider */}
        <input
          type="range"
          min={0.2}
          max={1.5}
          step={0.1}
          value={blinkThreshold}
          onChange={(e) => onThresholdChange(parseFloat(e.target.value))}
          className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-[#F0EFEA] accent-[#F4512A]"
        />

        <div className="flex justify-between text-[11px] font-medium text-[#6B7280]">
          <span>Short (Select)</span>
          <span>Long (Type)</span>
        </div>
      </div>

      {/* Typing Mode Selection */}
      <div className="mt-5 flex flex-col gap-2">
        <span className="text-xs font-semibold text-[#202938]">Typing Mode</span>
        <div className="grid grid-cols-2 gap-3">
          {/* Alphabet */}
          <button
            type="button"
            onClick={() => onTypingModeChange('alphabet')}
            className={`flex items-center gap-2.5 rounded-xl border p-3 text-left transition-all ${
              typingMode === 'alphabet'
                ? 'border-[#F4512A] bg-[#FFF8F5] text-[#F4512A] shadow-sm'
                : 'border-[#E8E8EB] bg-[#FAFAFB] text-[#202938] hover:border-[#D1D5DB]'
            }`}
          >
            <span
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                typingMode === 'alphabet' ? 'border-[#F4512A]' : 'border-[#9CA3AF]'
              }`}
            >
              {typingMode === 'alphabet' && (
                <span className="h-2 w-2 rounded-full bg-[#F4512A]" />
              )}
            </span>
            <span className="font-bold text-sm">A</span>
            <span className="text-xs font-medium text-[#202938]">Alphabet</span>
          </button>

          {/* Numbers */}
          <button
            type="button"
            onClick={() => onTypingModeChange('numbers')}
            className={`flex items-center gap-2.5 rounded-xl border p-3 text-left transition-all ${
              typingMode === 'numbers'
                ? 'border-[#F4512A] bg-[#FFF8F5] text-[#F4512A] shadow-sm'
                : 'border-[#E8E8EB] bg-[#FAFAFB] text-[#202938] hover:border-[#D1D5DB]'
            }`}
          >
            <span
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                typingMode === 'numbers' ? 'border-[#F4512A]' : 'border-[#9CA3AF]'
              }`}
            >
              {typingMode === 'numbers' && (
                <span className="h-2 w-2 rounded-full bg-[#F4512A]" />
              )}
            </span>
            <span className="font-mono font-bold text-xs">123</span>
            <span className="text-xs font-medium text-[#202938]">Numbers</span>
          </button>
        </div>
      </div>
    </section>
  );
};
