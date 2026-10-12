import React from 'react';
import { RotateCw, Hand, Eye, Target, Grid, Mic } from 'lucide-react';
import { TranslationMode } from './RealtimeTranslationPanel';

interface CommunicationModeSelectorProps {
  currentMode: TranslationMode;
  onSelectMode: (mode: TranslationMode) => void;
}

const MODES: { id: TranslationMode; label: string; icon: any }[] = [
  { id: 'Sign', label: 'Hand Sign', icon: Hand },
  { id: 'Blink', label: 'Blink to Text', icon: Eye },
  { id: 'Tap', label: 'Tap Input', icon: Target },
  { id: 'Morse', label: 'Morse Code', icon: Grid },
  { id: 'Speech', label: 'Voice (TTS)', icon: Mic },
];

export const CommunicationModeSelector: React.FC<CommunicationModeSelectorProps> = ({
  currentMode,
  onSelectMode,
}) => {
  return (
    <section className="flex flex-col justify-between rounded-2xl border border-[#E8E8EB] bg-white p-4 shadow-[0_1px_3px_rgba(16,24,40,0.05)] sm:p-5">
      {/* Title & Subtitle */}
      <header className="pb-3">
        <div className="flex items-center gap-2">
          <RotateCw size={16} className="text-[#F4512A]" strokeWidth={2.4} />
          <h3 className="text-sm font-bold text-[#202938]">
            Communication Mode (during call)
          </h3>
        </div>
        <p className="mt-0.5 text-xs text-[#6B7280]">
          Choose your input method. Detected input will be shown in real-time.
        </p>
      </header>

      {/* 5 Selectable Mode Cards */}
      <div className="grid grid-cols-5 gap-2 pt-1">
        {MODES.map((mode) => {
          const isActive = currentMode === mode.id;
          const Icon = mode.icon;

          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => onSelectMode(mode.id)}
              className={`relative flex flex-col items-center justify-center rounded-xl border p-2.5 transition-all text-center ${
                isActive
                  ? 'border-[#F4512A] bg-[#FFF8F5] text-[#F4512A] shadow-xs ring-1 ring-[#F4512A]/30'
                  : 'border-[#E8E8EB] bg-[#F7F7F8] text-[#6B7280] hover:border-[#D1D5DB] hover:bg-white hover:text-[#202938]'
              }`}
            >
              {/* Active corner dot matching screenshot */}
              {isActive && (
                <span className="absolute left-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#F4512A]" />
              )}

              <Icon size={18} strokeWidth={2.2} className="mb-1.5" />
              <span className="text-[11px] font-bold leading-tight tracking-tight">
                {mode.label}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
