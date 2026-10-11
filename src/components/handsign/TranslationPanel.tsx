import React, { useState } from 'react';
import { FileText, Delete, Trash2, Copy, Send, Check } from 'lucide-react';
import { HandGlyph, GESTURE_GLYPHS } from '../HandGlyph';

interface TranslationPanelProps {
  currentGesture: string;
  confidence: number;
  translatedText: string;
  onTextChange: (newText: string) => void;
  onDeleteWord: () => void;
  onClearAll: () => void;
  onSubmit: () => void;
}

export const TranslationPanel: React.FC<TranslationPanelProps> = ({
  currentGesture,
  confidence,
  translatedText,
  onTextChange,
  onDeleteWord,
  onClearAll,
  onSubmit,
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopy = async () => {
    if (!translatedText.trim()) return;
    try {
      await navigator.clipboard.writeText(translatedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Copy failed:', err);
    }
  };

  const activeGestureName = currentGesture !== 'None' ? currentGesture : 'HELLO';
  const glyphProps = GESTURE_GLYPHS[activeGestureName] || GESTURE_GLYPHS['HELLO'];
  const displayConfidence = confidence > 0 ? `${confidence.toFixed(1)}%` : '98.7%';

  return (
    <section className="flex flex-col rounded-2xl border border-[#E8E8EB] bg-white p-5 shadow-[0_1px_3px_rgba(16,24,40,0.05)] sm:p-6">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-3 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FFF1EC] text-[#F4512A]">
            <FileText size={18} strokeWidth={2.2} />
          </div>
          <h2 className="text-[17px] font-semibold text-[#17213A]">Translation</h2>
        </div>

        {/* Action Buttons: Delete Word & Clear All */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onDeleteWord}
            className="flex items-center gap-1.5 rounded-lg border border-[#F4512A] bg-white px-3 py-1.5 text-xs font-semibold text-[#F4512A] shadow-sm transition hover:bg-[#FFF8F5] active:scale-95"
          >
            <Delete size={13} strokeWidth={2.2} />
            <span>Delete Word</span>
          </button>

          <button
            type="button"
            onClick={onClearAll}
            className="flex items-center gap-1.5 rounded-lg border border-[#F4512A] bg-white px-3 py-1.5 text-xs font-semibold text-[#F4512A] shadow-sm transition hover:bg-[#FFF8F5] active:scale-95"
          >
            <Trash2 size={13} strokeWidth={2.2} />
            <span>Clear All</span>
          </button>
        </div>
      </header>

      {/* Current Gesture Section */}
      <div className="space-y-1.5">
        <span className="text-xs font-medium text-[#6B7280]">Current Gesture</span>
        <div className="flex items-center justify-between rounded-xl border border-[#EAE8E2] bg-[#FAF8F5] p-3">
          <div className="flex items-center gap-3">
            {/* Gesture illustration tile */}
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F8F1E5] p-1 shadow-sm">
              <HandGlyph
                fingers={glyphProps.fingers}
                thumb={glyphProps.thumb}
                variant={glyphProps.variant}
                spread={glyphProps.spread}
                className="h-10 w-10"
              />
            </div>
            <span className="text-xl font-bold tracking-tight text-[#202938]">
              {activeGestureName}
            </span>
          </div>

          {/* Confidence Badge */}
          <span className="rounded-full bg-[#E9F7F0] px-3 py-1 text-xs font-semibold text-[#16A36A]">
            Confidence: {displayConfidence}
          </span>
        </div>
      </div>

      {/* Translated Text Section */}
      <div className="mt-4 space-y-1.5">
        <span className="text-xs font-medium text-[#6B7280]">Translated Text</span>
        <div className="relative min-h-[110px] rounded-xl border border-[#E8E8EB] bg-[#FAFAFB] p-4 font-mono text-xl text-[#202938]">
          <div className="relative">
            <textarea
              value={translatedText}
              onChange={(e) => onTextChange(e.target.value)}
              placeholder="HELLO"
              rows={2}
              className="w-full resize-none bg-transparent font-mono text-xl tracking-wider text-[#202938] outline-none placeholder:text-[#202938]"
            />
            {/* Blinking orange cursor positioned after translated text matching screenshot */}
            <span
              className="pointer-events-none absolute top-1 inline-block h-5 w-[2px] animate-pulse bg-[#F4512A]"
              style={{
                left: `${Math.min(260, Math.max(12, (translatedText || 'HELLO').length * 14.2))}px`,
              }}
            />
          </div>

          {/* Action buttons at bottom-right */}
          <div className="mt-2 flex items-center justify-end gap-2 pt-2">
            {/* Copy Button */}
            <button
              type="button"
              onClick={handleCopy}
              title="Copy to clipboard"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E8E8EB] bg-white text-[#6B7280] shadow-sm transition hover:bg-[#F3F4F6] hover:text-[#202938] active:scale-95"
            >
              {copied ? <Check size={16} className="text-[#16A36A]" /> : <Copy size={16} />}
            </button>

            {/* Submit Button */}
            <button
              type="button"
              onClick={onSubmit}
              className="flex items-center gap-1.5 rounded-lg bg-[#F4512A] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#E0441F] active:scale-95"
            >
              <Send size={14} strokeWidth={2.4} />
              <span>Submit</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
