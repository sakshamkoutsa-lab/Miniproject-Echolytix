import React, { useState } from 'react';
import { HelpCircle, ArrowRight } from 'lucide-react';
import { HandGlyph, GESTURE_GLYPHS } from '../HandGlyph';

interface GestureCheatSheetProps {
  onSelectGesture?: (gesture: string) => void;
}

const PRIMARY_GESTURES = [
  'HELLO', 'YES', 'NO', 'HELP',
  'NEED WATER', 'THANK YOU', 'PLEASE', 'HOW ARE YOU',
  'GOOD', 'BAD', 'OK', 'STOP',
  'SLEEP', 'BATHROOM', 'PAIN', 'FOOD'
];

export const GestureCheatSheet: React.FC<GestureCheatSheetProps> = ({ onSelectGesture }) => {
  const [showAll, setShowAll] = useState<boolean>(false);

  return (
    <section className="flex flex-col rounded-2xl border border-[#E8E8EB] bg-white p-5 shadow-[0_1px_3px_rgba(16,24,40,0.05)] sm:p-6">
      {/* Header */}
      <header className="flex items-center gap-2 pb-4">
        <HelpCircle size={18} className="text-[#6D54DF]" strokeWidth={2.5} />
        <h2 className="text-sm font-bold text-[#6D54DF] uppercase tracking-wide">
          GESTURE CHEAT SHEET
        </h2>
      </header>

      {/* Grid of 16 Gesture Tiles: 4 columns on desktop matching screenshot */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {PRIMARY_GESTURES.map((gesture) => {
          const glyph = GESTURE_GLYPHS[gesture];

          return (
            <button
              key={gesture}
              type="button"
              onClick={() => onSelectGesture?.(gesture)}
              className="group flex flex-col items-center justify-center rounded-xl border border-[#EAE8E2] bg-[#F8F1E5] p-2.5 transition-all duration-150 hover:-translate-y-0.5 hover:border-[#F4512A]/40 hover:bg-[#FFF8F2] hover:shadow-sm"
            >
              {/* Glyph Icon */}
              <div className="flex h-11 w-11 items-center justify-center">
                {glyph ? (
                  <HandGlyph
                    fingers={glyph.fingers}
                    thumb={glyph.thumb}
                    variant={glyph.variant}
                    spread={glyph.spread}
                    className="h-10 w-10 transition-transform group-hover:scale-105"
                  />
                ) : (
                  <span className="text-xl">✋</span>
                )}
              </div>

              {/* Label */}
              <span className="mt-1.5 text-center text-[10.5px] font-bold tracking-tight text-[#202938] group-hover:text-[#F4512A]">
                {gesture}
              </span>
            </button>
          );
        })}
      </div>

      {/* See More Button at bottom right */}
      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={() => setShowAll(!showAll)}
          className="group flex items-center gap-1 text-xs font-semibold text-[#F4512A] transition hover:text-[#E0441F]"
        >
          <span>{showAll ? 'Show Less' : 'See More'}</span>
          <ArrowRight size={13} strokeWidth={2.2} className="transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>

      {showAll && (
        <div className="mt-3 rounded-xl border border-[#E8E8EB] bg-[#FAFAFB] p-3 text-xs text-[#6B7280]">
          <p className="font-medium text-[#202938]">Tip for best recognition accuracy:</p>
          <ul className="mt-1 list-inside list-disc space-y-0.5">
            <li>Ensure proper lighting and keep your hand within the orange bounding box.</li>
            <li>Hold your hand gesture steady for at least 1.2 seconds to auto-type the word.</li>
            <li>Use the "Delete Word" button above if an unintended gesture is recognized.</li>
          </ul>
        </div>
      )}
    </section>
  );
};
