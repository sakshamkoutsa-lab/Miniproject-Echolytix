import React from 'react';
import { X, MessageSquare, Send } from 'lucide-react';

interface QuickPhraseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendPhrase: (phrase: string) => void;
}

const QUICK_PHRASES = [
  'I NEED WATER',
  'PLEASE HELP',
  'YES',
  'NO',
  'THANK YOU',
  'PLEASE REPEAT',
  'I DO NOT UNDERSTAND',
  'FEELING BETTER NOW',
  'NEED MEDICINE',
  'PLEASE WAIT A MOMENT',
  'CALL DOCTOR',
  'ALL IS GOOD',
];

export const QuickPhraseModal: React.FC<QuickPhraseModalProps> = ({
  isOpen,
  onClose,
  onSendPhrase,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[#E8E8EB] bg-white p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#F0EFEA] pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FFF1EC] text-[#F4512A]">
              <MessageSquare size={16} />
            </div>
            <h3 className="text-sm font-bold text-[#202938]">Send Quick Phrase</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6B7280] transition hover:bg-[#F3F4F6] hover:text-[#202938]"
          >
            <X size={16} />
          </button>
        </div>

        <p className="mt-2 text-xs text-[#6B7280]">
          Click any phrase to immediately speak it and append to the conversation transcript.
        </p>

        {/* Phrases Grid */}
        <div className="mt-3.5 grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1">
          {QUICK_PHRASES.map((phrase) => (
            <button
              key={phrase}
              type="button"
              onClick={() => {
                onSendPhrase(phrase);
                onClose();
              }}
              className="flex items-center justify-between rounded-xl border border-[#E8E8EB] bg-[#FAF8F5] p-2.5 text-left text-xs font-semibold text-[#202938] transition hover:border-[#F4512A] hover:bg-[#FFF8F5] hover:text-[#F4512A] active:scale-95"
            >
              <span>{phrase}</span>
              <Send size={12} className="shrink-0 opacity-70" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
