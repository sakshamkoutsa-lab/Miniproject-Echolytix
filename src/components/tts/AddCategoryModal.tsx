import React, { useState } from 'react';
import { X, Bookmark, Plus } from 'lucide-react';

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCategory: (categoryName: string) => void;
}

export const AddCategoryModal: React.FC<AddCategoryModalProps> = ({
  isOpen,
  onClose,
  onAddCategory,
}) => {
  const [name, setName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAddCategory(name.trim());
    setName('');
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
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E6F4EA] text-[#079F72]">
              <Bookmark size={18} strokeWidth={2.4} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#17213A]">Add New Category</h3>
              <p className="text-xs text-[#718096]">Group related phrases on your Phrase Board</p>
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
              Category Name
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. MEDICAL NEEDS, GREETINGS..."
              className="w-full rounded-xl border border-[#E8E8EB] bg-white px-3.5 py-2.5 text-xs sm:text-sm font-medium text-[#17213A] placeholder-[#9CA3AF] shadow-2xs focus:border-[#7451E8] focus:outline-none"
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
              disabled={!name.trim()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#7451E8] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#5E3BC9] transition active:scale-95 disabled:opacity-50"
            >
              <Plus size={14} />
              <span>Save Category</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
