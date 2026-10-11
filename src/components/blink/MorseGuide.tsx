import React from 'react';
import { HelpCircle } from 'lucide-react';
import { MORSE_CODE_MAP } from '../../utils/morse';

interface MorseGuideProps {
  typingMode?: 'alphabet' | 'numbers';
  activeMorse?: string;
  onSelectCharacter?: (char: string) => void;
}

export const MorseGuide: React.FC<MorseGuideProps> = ({
  typingMode = 'alphabet',
  activeMorse,
  onSelectCharacter,
}) => {
  // Letters A-Z followed by numbers 0-9 as shown in the reference screenshot
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const numbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

  const displayedChars = [...letters, ...numbers];

  return (
    <section className="flex flex-col rounded-2xl border border-[#E8E8EB] bg-white p-5 shadow-[0_1px_3px_rgba(16,24,40,0.05)] sm:p-6">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-3 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F2EDFC] text-[#7C4DDB]">
            <HelpCircle size={18} strokeWidth={2.2} />
          </div>
          <h2 className="text-[17px] font-semibold text-[#17213A]">Morse Guide</h2>
        </div>

        {/* Legend Badges */}
        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className="flex items-center gap-1 rounded-full bg-[#E9F7F0] px-2.5 py-1 text-[#159B68]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#159B68]" />
            Dot (.)
          </span>
          <span className="flex items-center gap-1 rounded-full bg-[#FFF1EC] px-2.5 py-1 text-[#F4512A]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#F4512A]" />
            Dash (-)
          </span>
        </div>
      </header>

      {/* Morse Grid: 9 columns on wide screens, matching reference screenshot layout (A-I, J-R, S-0, 1-9) */}
      <div className="grid grid-cols-5 gap-2 sm:grid-cols-7 md:grid-cols-9 lg:grid-cols-9 xl:grid-cols-9">
        {displayedChars.map((char) => {
          const code = MORSE_CODE_MAP[char] || '';
          const isSelected = activeMorse === code;
          const isNumber = !isNaN(Number(char));
          const isHighlightedMode =
            (typingMode === 'alphabet' && !isNumber) ||
            (typingMode === 'numbers' && isNumber);

          return (
            <button
              key={char}
              type="button"
              onClick={() => onSelectCharacter?.(char)}
              title={`${char}: ${code}`}
              className={`group flex min-h-[58px] flex-col items-center justify-center rounded-xl border p-1.5 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-sm ${
                isSelected
                  ? 'border-[#F4512A] bg-[#FFF1EC] text-[#F4512A] shadow-[0_0_0_2px_rgba(244,81,42,0.2)]'
                  : isHighlightedMode
                  ? 'border-[#EAE6DF] bg-[#F9F7F2] text-[#202938] hover:border-[#F4512A]/40 hover:bg-[#FFF8F5]'
                  : 'border-[#F0EFEA] bg-[#FAF9F6] text-[#6B7280] opacity-80 hover:opacity-100'
              }`}
            >
              <span className="text-[17px] font-bold leading-none tracking-tight text-[#202938] group-hover:text-[#F4512A]">
                {char}
              </span>
              <span className="mt-1 font-mono text-[11px] font-bold tracking-widest text-[#6B7280]">
                {code}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
