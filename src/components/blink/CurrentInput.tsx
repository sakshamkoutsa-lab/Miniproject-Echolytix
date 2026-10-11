import React from 'react';
import { FileText, Trash2, Volume2, Sparkles, Loader2 } from 'lucide-react';

interface CurrentInputProps {
  text: string;
  morseBuffer: string;
  onClear: () => void;
  onSpeak?: () => void;
  onAiExpand?: () => void;
  isAiLoading?: boolean;
}

export const CurrentInput: React.FC<CurrentInputProps> = ({
  text,
  morseBuffer,
  onClear,
  onSpeak,
  onAiExpand,
  isAiLoading = false,
}) => {
  return (
    <section className="flex flex-col rounded-2xl border border-[#E8E8EB] bg-white p-5 shadow-[0_1px_3px_rgba(16,24,40,0.05)] sm:p-6">
      {/* Header */}
      <header className="flex items-center justify-between gap-3 pb-3">
        <div className="flex items-center gap-2.5">
          <FileText size={20} strokeWidth={2} className="text-[#F4512A]" />
          <h2 className="text-[17px] font-semibold text-[#17213A]">Current Input</h2>
        </div>

        <button
          type="button"
          onClick={onClear}
          className="flex items-center gap-1.5 rounded-lg border border-[#F4512A] bg-white px-3 py-1.5 text-xs font-semibold text-[#F4512A] shadow-sm transition hover:bg-[#FFF8F5] active:scale-95"
          aria-label="Clear current input"
        >
          <Trash2 size={13} strokeWidth={2.2} />
          <span>Clear</span>
        </button>
      </header>

      {/* Text display with blinking cursor */}
      <div className="relative min-h-[96px] rounded-xl border border-[#E8E8EB] bg-[#FAFAFB] p-4 font-mono text-xl tracking-wider text-[#202938] sm:min-h-[108px] sm:text-2xl">
        {text ? (
          <div className="flex flex-wrap items-baseline break-all">
            <span>{text}</span>
            {morseBuffer && (
              <span className="ml-2 rounded bg-[#FFF1EC] px-1.5 py-0.5 text-base font-bold text-[#F4512A]">
                [{morseBuffer}]
              </span>
            )}
            <span className="ml-1 inline-block h-6 w-[2px] animate-pulse bg-[#F4512A] align-middle" />
          </div>
        ) : (
          <div className="flex items-center text-[#9CA3AF]">
            {morseBuffer ? (
              <span className="rounded bg-[#FFF1EC] px-1.5 py-0.5 text-base font-bold text-[#F4512A]">
                [{morseBuffer}]
              </span>
            ) : (
              <span className="text-base font-normal tracking-normal">
                Blink or wink to begin typing...
              </span>
            )}
            <span className="ml-1 inline-block h-6 w-[2px] animate-pulse bg-[#F4512A] align-middle" />
          </div>
        )}
      </div>
    </section>
  );
};
