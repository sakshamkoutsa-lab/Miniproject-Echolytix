import React, { useState } from 'react';
import { Bookmark, Plus, ChevronDown, ChevronRight, Volume2 } from 'lucide-react';

export interface CategoryData {
  id?: number;
  category: string;
  phrases: string[];
}

interface PhraseBoardCardProps {
  categories: CategoryData[];
  onSpeakPhrase: (phrase: string) => void;
  onOpenAddCategory: () => void;
  onOpenAddPhrase: (categoryId: number) => void;
  currentlySpeakingPhrase?: string | null;
}

export const PhraseBoardCard: React.FC<PhraseBoardCardProps> = ({
  categories,
  onSpeakPhrase,
  onOpenAddCategory,
  onOpenAddPhrase,
  currentlySpeakingPhrase,
}) => {
  // State tracking expanded categories (all open by default)
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const toggleCategory = (catName: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [catName]: !prev[catName],
    }));
  };

  return (
    <div className="w-full rounded-2xl border border-[#E8E8EB] bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between transition-all min-h-[500px]">
      {/* Header matching screenshot */}
      <div className="flex items-center justify-between pb-4 border-b border-[#F5F5F7]">
        <div className="flex items-center gap-2">
          <Bookmark size={18} className="text-[#079F72]" />
          <h2 className="text-sm sm:text-base font-bold text-[#17213A]">
            Phrase Board
          </h2>
        </div>

        {/* Purple Outlined Button: + Add Category */}
        <button
          type="button"
          onClick={onOpenAddCategory}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5DBFD] bg-[#F1EDFC] px-3.5 py-1.5 text-xs font-semibold text-[#7451E8] shadow-2xs transition hover:bg-[#E8DEFD] active:scale-95"
        >
          <Plus size={14} className="text-[#7451E8]" />
          <span>Add Category</span>
        </button>
      </div>

      {/* Category Accordion List */}
      <div className="pt-4 space-y-6 flex-1 overflow-y-auto pr-0.5">
        {categories.map((cat, catIdx) => {
          const isCollapsed = Boolean(collapsedCategories[cat.category]);
          const catId = cat.id || catIdx + 1;

          return (
            <div key={`${cat.category}-${catIdx}`} className="space-y-3">
              {/* Category Header Row matching screenshot */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => toggleCategory(cat.category)}
                  className="flex items-center gap-2 text-left group"
                >
                  <span className="text-[#718096] transition group-hover:text-[#17213A]">
                    {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                  </span>
                  <span className="text-xs sm:text-sm font-extrabold tracking-wider text-[#718096] uppercase font-mono group-hover:text-[#17213A] transition">
                    {cat.category}
                  </span>
                </button>

                {/* + Add Phrase Button for this Category */}
                <button
                  type="button"
                  onClick={() => onOpenAddPhrase(catId)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#718096] hover:text-[#17213A] transition active:scale-95"
                >
                  <Plus size={14} />
                  <span>Add Phrase</span>
                </button>
              </div>

              {/* Phrase Cards Grid in Cream Tint (#F7F2E8) */}
              {!isCollapsed && (
                <div className="space-y-2">
                  {cat.phrases.length === 0 ? (
                    <div className="py-4 text-center text-xs text-[#9CA3AF] rounded-xl border border-dashed border-[#E8E8EB]">
                      No phrases in this category yet.
                    </div>
                  ) : (
                    cat.phrases.map((phrase, pIdx) => {
                      const isSpeakingThis = currentlySpeakingPhrase === phrase;

                      return (
                        <div
                          key={`${phrase}-${pIdx}`}
                          onClick={() => onSpeakPhrase(phrase)}
                          className={`group flex items-center justify-between rounded-xl border p-3 sm:p-3.5 transition-all cursor-pointer ${
                            isSpeakingThis
                              ? 'border-[#079F72] bg-[#E6F4EA] shadow-xs scale-[1.01]'
                              : 'border-[#E8E8EB] bg-[#F7F2E8] hover:border-[#DCD7CE] hover:bg-[#F3EDE0] active:scale-[0.99]'
                          }`}
                        >
                          <p className="text-xs sm:text-sm font-medium text-[#17213A] leading-snug pr-3">
                            {phrase}
                          </p>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSpeakPhrase(phrase);
                            }}
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition ${
                              isSpeakingThis
                                ? 'bg-[#079F72] text-white'
                                : 'text-[#718096] group-hover:text-[#079F72] group-hover:bg-white/80'
                            }`}
                            title={`Speak: "${phrase}"`}
                          >
                            <Volume2 size={16} />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
