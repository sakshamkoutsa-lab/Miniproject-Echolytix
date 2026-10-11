import React, { useState } from 'react';
import { X, Sparkles, Check, ArrowRight, Loader2, RefreshCw } from 'lucide-react';

interface AIPolisherModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalText: string;
  onApplyPolishedText: (newText: string) => void;
}

const POLISH_OPTIONS = [
  { id: 'grammar', label: 'Correct Grammar', desc: 'Fix spelling, punctuation, and capitalization errors' },
  { id: 'clearer', label: 'Make It Clearer', desc: 'Crisper delivery optimized for text-to-speech audio' },
  { id: 'shorter', label: 'Make It Shorter', desc: 'Concise phrasing with redundant words removed' },
  { id: 'polite', label: 'Make It More Polite', desc: 'Courteous and warm tone with please & thank you' },
  { id: 'simplify', label: 'Simplify Language', desc: 'Easy-to-understand words for universal clarity' },
];

export const AIPolisherModal: React.FC<AIPolisherModalProps> = ({
  isOpen,
  onClose,
  originalText,
  onApplyPolishedText,
}) => {
  const [selectedOption, setSelectedOption] = useState<string>('clearer');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [polishedResult, setPolishedResult] = useState<string>('');
  const [providerUsed, setProviderUsed] = useState<string>('');

  if (!isOpen) return null;

  const handlePolish = async () => {
    if (!originalText.trim()) return;
    setIsLoading(true);
    setPolishedResult('');

    try {
      const res = await fetch('/api/tts/polish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: originalText,
          option: selectedOption,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setPolishedResult(data.polished || originalText);
        setProviderUsed(data.provider || 'AI');
      } else {
        // Fallback
        setPolishedResult(originalText);
      }
    } catch (e) {
      console.warn('AI Polish request error:', e);
      setPolishedResult(originalText);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (polishedResult) {
      onApplyPolishedText(polishedResult);
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-[#E8E8EB] bg-white p-6 shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#F0EFEA] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F1EDFC] text-[#7451E8]">
              <Sparkles size={18} strokeWidth={2.4} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#17213A]">AI Message Polisher</h3>
              <p className="text-xs text-[#718096]">
                Enhance your speech message with AI clarity assistance
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#9CA3AF] transition hover:bg-[#F3F4F6] hover:text-[#17213A]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Polishing Options Radio List */}
        <div className="my-4 space-y-2">
          <label className="text-xs font-semibold text-[#718096]">
            Select Polishing Objective:
          </label>
          <div className="grid grid-cols-1 gap-2">
            {POLISH_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSelectedOption(opt.id)}
                className={`flex items-start justify-between rounded-xl border p-2.5 text-left transition ${
                  selectedOption === opt.id
                    ? 'border-[#7451E8] bg-[#F1EDFC]/40 shadow-xs'
                    : 'border-[#E8E8EB] bg-white hover:bg-[#F9F9FA]'
                }`}
              >
                <div>
                  <h4 className="text-xs font-bold text-[#17213A]">{opt.label}</h4>
                  <p className="text-[11px] text-[#718096]">{opt.desc}</p>
                </div>
                {selectedOption === opt.id && (
                  <Check size={16} className="text-[#7451E8] mt-0.5 shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Original Message Preview */}
        <div className="rounded-xl border border-[#E8E8EB] bg-[#FAF8F5] p-3 text-xs text-[#4A5568]">
          <span className="text-[10px] font-bold text-[#718096] uppercase font-mono block mb-1">
            Original Text:
          </span>
          <p className="font-mono text-xs text-[#17213A]">{originalText || '(empty)'}</p>
        </div>

        {/* Action Button to Generate Polish */}
        <div className="mt-3">
          <button
            type="button"
            onClick={handlePolish}
            disabled={isLoading || !originalText.trim()}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#7451E8] py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#5E3BC9] active:scale-95 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>Generating Improvement...</span>
              </>
            ) : (
              <>
                <Sparkles size={15} />
                <span>Generate Improved Phrasing</span>
              </>
            )}
          </button>
        </div>

        {/* Polished Result Preview */}
        {polishedResult && (
          <div className="mt-4 rounded-xl border border-[#7451E8]/30 bg-[#F1EDFC]/30 p-3.5 animate-fade-in">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-[#7451E8] uppercase font-mono">
                Improved Suggestion ({providerUsed}):
              </span>
            </div>
            <p className="font-mono text-xs sm:text-sm text-[#17213A] font-medium leading-relaxed">
              {polishedResult}
            </p>
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-5 flex items-center justify-end gap-2 border-t border-[#F0EFEA] pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#E8E8EB] bg-white px-4 py-2 text-xs font-semibold text-[#4A5568] hover:bg-[#F3F4F6] transition active:scale-95"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={!polishedResult}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#079F72] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#068A63] transition active:scale-95 disabled:opacity-50"
          >
            <Check size={14} />
            <span>Apply Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
};
