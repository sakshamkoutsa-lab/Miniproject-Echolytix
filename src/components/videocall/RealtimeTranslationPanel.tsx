import React from 'react';
import {
  FileText,
  Hand,
  Eye,
  Target,
  Grid,
  Mic,
  Volume2,
  Trash2,
} from 'lucide-react';
import { HandGlyph, GESTURE_GLYPHS } from '../HandGlyph';

export type TranslationMode = 'Sign' | 'Blink' | 'Tap' | 'Morse' | 'Speech';

interface RealtimeTranslationPanelProps {
  activeMode: TranslationMode;
  onSelectMode: (mode: TranslationMode) => void;
  detectedSign: string;
  confidence: number;
  translatedText: string;
  isLive: boolean;
  audioLevel: number; // 0.0 to 1.0 for visual audio wave
  onSpeakText: () => void;
  onClearText: () => void;
}

const MODE_TABS: { id: TranslationMode; label: string; icon: any }[] = [
  { id: 'Sign', label: 'Sign', icon: Hand },
  { id: 'Blink', label: 'Blink', icon: Eye },
  { id: 'Tap', label: 'Tap', icon: Target },
  { id: 'Morse', label: 'Morse', icon: Grid },
  { id: 'Speech', label: 'Speech', icon: Mic },
];

export const RealtimeTranslationPanel: React.FC<RealtimeTranslationPanelProps> = ({
  activeMode,
  onSelectMode,
  detectedSign = 'GOOD',
  confidence = 98.7,
  translatedText = 'GOOD',
  isLive = true,
  audioLevel = 0.4,
  onSpeakText,
  onClearText,
}) => {
  const glyph = GESTURE_GLYPHS[detectedSign] || GESTURE_GLYPHS['GOOD'];

  return (
    <section className="flex flex-col rounded-2xl border border-[#E8E8EB] bg-white p-4 shadow-[0_1px_3px_rgba(16,24,40,0.05)] sm:p-5">
      {/* Header */}
      <header className="flex items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#FFF1EC] text-[#F4512A]">
            <FileText size={15} strokeWidth={2.4} />
          </div>
          <h2 className="text-base font-bold text-[#202938]">Real-time Translation</h2>
        </div>

        {/* Right Status Badges: Live Pill + Audio Waveform */}
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 rounded-full bg-[#E9F7F0] px-2.5 py-0.5 text-[11px] font-semibold text-[#16A36A]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#16A36A] animate-pulse" />
            Live
          </span>

          {/* Audio Equalizer wave bars */}
          <div className="flex items-end gap-0.5 h-4 px-1" title="Audio Activity">
            <span
              className="w-0.5 rounded-full bg-[#16A36A] transition-all duration-75"
              style={{ height: `${Math.max(4, Math.min(16, audioLevel * 18 + 4))}px` }}
            />
            <span
              className="w-0.5 rounded-full bg-[#16A36A] transition-all duration-75"
              style={{ height: `${Math.max(3, Math.min(16, audioLevel * 24 + 3))}px` }}
            />
            <span
              className="w-0.5 rounded-full bg-[#16A36A] transition-all duration-75"
              style={{ height: `${Math.max(6, Math.min(16, audioLevel * 16 + 6))}px` }}
            />
            <span
              className="w-0.5 rounded-full bg-[#16A36A] transition-all duration-75"
              style={{ height: `${Math.max(3, Math.min(16, audioLevel * 20 + 3))}px` }}
            />
          </div>
        </div>
      </header>

      {/* Mode Selection Tabs */}
      <div className="mb-3.5 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {MODE_TABS.map((tab) => {
          const isActive = activeMode === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectMode(tab.id)}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap ${
                isActive
                  ? 'border border-[#F4512A] bg-[#FFF1EC] text-[#F4512A] shadow-xs'
                  : 'border border-[#E8E8EB] bg-[#F7F7F8] text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#202938]'
              }`}
            >
              <Icon size={14} strokeWidth={2.2} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Two Sub-Cards Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Left: Detected Sign */}
        <div className="flex flex-col justify-between rounded-xl border border-[#E8E8EB] bg-[#FAF8F5] p-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-[#6B7280]">Detected Sign</span>
            <span className="rounded-md bg-[#E9F7F0] px-1.5 py-0.5 text-[10px] font-bold text-[#16A36A]">
              {confidence > 0 ? `${confidence.toFixed(1)}%` : '98.7%'}
            </span>
          </div>

          {/* Visual Sign Gesture Illustration */}
          <div className="my-2 flex flex-col items-center justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#F8F1E5] p-1 shadow-xs">
              {glyph ? (
                <HandGlyph
                  fingers={glyph.fingers}
                  thumb={glyph.thumb}
                  variant={glyph.variant}
                  spread={glyph.spread}
                  className="h-11 w-11"
                />
              ) : (
                <span className="text-3xl">👍</span>
              )}
            </div>
            <span className="mt-1.5 text-xs font-bold tracking-wide text-[#202938]">
              {detectedSign}
            </span>
          </div>
        </div>

        {/* Right: Translated Text */}
        <div className="flex flex-col justify-between rounded-xl border border-[#E8E8EB] bg-white p-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-[#6B7280]">Translated Text</span>
            <button
              type="button"
              onClick={onSpeakText}
              title="Speak translated text (TTS)"
              className="flex h-6 w-6 items-center justify-center rounded text-[#6B7280] transition hover:bg-[#F3F4F6] hover:text-[#F4512A]"
            >
              <Volume2 size={15} strokeWidth={2.2} />
            </button>
          </div>

          {/* Translated text message */}
          <div className="my-auto py-2">
            <span className="font-mono text-base font-bold text-[#202938] leading-tight block">
              {translatedText || 'GOOD'}
            </span>
          </div>

          {/* Clear Text Button */}
          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={onClearText}
              className="flex items-center gap-1 rounded-lg border border-[#E8E8EB] bg-white px-2 py-1 text-[11px] font-semibold text-[#6B7280] transition hover:bg-[#F3F4F6] hover:text-[#202938]"
            >
              <Trash2 size={12} />
              <span>Clear Text</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
