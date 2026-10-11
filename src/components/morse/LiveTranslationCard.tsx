import React from 'react';
import { Languages, Copy, Check, Volume2, VolumeX } from 'lucide-react';

interface LiveTranslationCardProps {
  translatedText: string;
  isSpeaking: boolean;
  copied: boolean;
  onChangeText: (text: string) => void;
  onCopy: () => void;
  onSpeak: () => void;
  onAddSpace: () => void;
  onDeleteLastLetter: () => void;
  onClearAll: () => void;
}

export const LiveTranslationCard: React.FC<LiveTranslationCardProps> = ({
  translatedText,
  isSpeaking,
  copied,
  onChangeText,
  onCopy,
  onSpeak,
  onAddSpace,
  onDeleteLastLetter,
  onClearAll,
}) => {
  const wordCount = translatedText.trim()
    ? translatedText.trim().split(/\s+/).filter(Boolean).length
    : 0;
  const charCount = translatedText.length;

  return (
    <div className="w-full rounded-2xl border border-[#E8E8EB] bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between transition-all">
      {/* Header */}
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <Languages size={18} className="text-[#17213A]" />
          <h3 className="text-sm sm:text-base font-bold text-[#17213A]">
            Live Translation
          </h3>
        </div>

        {/* Action Icons: Copy & TTS */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onCopy}
            title={copied ? 'Copied to clipboard!' : 'Copy to clipboard'}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E8E8EB] bg-white text-[#718096] transition hover:bg-[#F3F4F6] hover:text-[#17213A] active:scale-95 shadow-2xs"
          >
            {copied ? <Check size={14} className="text-[#159B68]" /> : <Copy size={14} />}
          </button>
          <button
            type="button"
            onClick={onSpeak}
            title={isSpeaking ? 'Stop speaking' : 'Speak translated text'}
            className={`flex h-8 w-8 items-center justify-center rounded-lg border border-[#E8E8EB] transition active:scale-95 shadow-2xs ${
              isSpeaking
                ? 'bg-[#FFF1EC] text-[#F4512A] border-[#F4512A]/30'
                : 'bg-white text-[#718096] hover:bg-[#F3F4F6] hover:text-[#17213A]'
            }`}
          >
            {isSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
        </div>
      </div>

      {/* Main Text Box with Cream Background matching screenshot (#F5EFE3) */}
      <div className="relative my-2 min-h-[130px] sm:min-h-[140px] rounded-2xl border border-[#E8E8EB] bg-[#F5EFE3] p-4 sm:p-5 flex flex-col justify-between">
        <textarea
          value={translatedText}
          onChange={(e) => onChangeText(e.target.value)}
          placeholder="Translated text will appear here... _"
          className="w-full resize-none bg-transparent font-mono text-sm sm:text-base text-[#17213A] placeholder-[#718096]/70 focus:outline-none min-h-[85px]"
          rows={3}
        />
        {/* Subtle typing cursor indicator */}
        <div className="flex items-center justify-end text-[11px] font-mono text-[#718096]/60">
          <span className="inline-block h-3.5 w-1.5 bg-[#17213A]/40 animate-pulse mr-1" />
          <span>LIVE</span>
        </div>
      </div>

      {/* Footer: Word & Char Counts + Actions (+ Space, Delete Letter, Clear All) */}
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-1">
        {/* Counters */}
        <div className="flex items-center gap-4 text-xs font-medium text-[#718096]">
          <div className="flex flex-col">
            <span className="text-[11px] text-[#718096]">Words</span>
            <span className="text-sm font-bold text-[#7251E8] font-mono">{wordCount}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] text-[#718096]">Chars</span>
            <span className="text-sm font-bold text-[#7251E8] font-mono">{charCount}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onAddSpace}
            className="rounded-xl border border-[#E8E8EB] bg-[#FAF8F5] px-3.5 py-1.5 text-xs font-semibold text-[#17213A] shadow-2xs transition hover:bg-[#F3F0EA] active:scale-95"
          >
            + Space
          </button>
          <button
            type="button"
            onClick={onDeleteLastLetter}
            className="rounded-xl border border-[#E8E8EB] bg-[#FAF8F5] px-3.5 py-1.5 text-xs font-semibold text-[#17213A] shadow-2xs transition hover:bg-[#F3F0EA] active:scale-95"
          >
            Delete Letter
          </button>
          <button
            type="button"
            onClick={onClearAll}
            className="rounded-xl border border-[#E8E8EB] bg-[#FAF8F5] px-3.5 py-1.5 text-xs font-semibold text-[#17213A] shadow-2xs transition hover:bg-[#F3F0EA] active:scale-95"
          >
            Clear All
          </button>
        </div>
      </div>
    </div>
  );
};
