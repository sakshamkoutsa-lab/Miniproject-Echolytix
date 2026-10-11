import React, { useState } from 'react';
import { X, Volume2, Plus } from 'lucide-react';

interface AddPhraseModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryId: number | null;
  categoryName?: string;
  onAddPhrase: (categoryId: number, phraseText: string) => void;
}

export const AddPhraseModal: React.FC<AddPhraseModalProps> = ({
  isOpen,
  onClose,
  categoryId,
  categoryName,
  onAddPhrase,
}) => {
  const [phrase, setPhrase] = useState('');

  if (!isOpen || categoryId === null) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phrase.trim()) return;
    onAddPhrase(categoryId, phrase.trim());
    setPhrase('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-[#E8E8EB] bg-white p-6 shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#F0EFEA] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F1EDFC] text-[#7451E8]">
              <Volume2 size={18} strokeWidth={2.4} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#17213A]">Add New Phrase</h3>
              <p className="text-xs text-[#718096]">
                Adding to <span className="font-semibold text-[#7451E8]">{categoryName || 'Category'}</span>
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

        <form onSubmit={handleSubmit} className="my-4 space-y-4">
          <div>
            <label className="text-xs font-semibold text-[#718096] block mb-1.5">
              Phrase Text
            </label>
            <textarea
              required
              autoFocus
              rows={3}
              value={phrase}
              onChange={(e) => setPhrase(e.target.value)}
              placeholder="e.g. Please help me sit upright in bed..."
              className="w-full resize-none rounded-xl border border-[#E8E8EB] bg-white px-3.5 py-2.5 text-xs sm:text-sm font-medium text-[#17213A] placeholder-[#9CA3AF] shadow-2xs focus:border-[#079F72] focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#F0EFEA]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#E8E8EB] bg-white px-4 py-2 text-xs font-semibold text-[#4A5568] hover:bg-[#F3F4F6] transition active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!phrase.trim()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#079F72] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#068A63] transition active:scale-95 disabled:opacity-50"
            >
              <Plus size={14} />
              <span>Save Phrase</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
