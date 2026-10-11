import React, { useState } from 'react';
import { GraduationCap, BookOpen, Volume2, Sparkles } from 'lucide-react';
import { MORSE_CODE_MAP } from '../../utils/morse';
import { playMorseTone, speakText } from '../../utils/sound';

interface TappingGuideCardProps {
  onInsertPhrase: (phrase: string, morse: string) => void;
}

const ALPHABET = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H',
  'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P',
  'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X',
  'Y', 'Z'
];

const NUMBERS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

const DEFAULT_QUICK_PHRASES = [
  { label: 'HELP', morse: '···· · ·-·· ·--·', category: 'Urgent' },
  { label: 'I NEED WATER', morse: '·· / -· · · -·· / ·-- ·- - · ·-·', category: 'Urgent' },
  { label: 'YES', morse: '-·-- · ···', category: 'General' },
  { label: 'NO', morse: '-· ---', category: 'General' },
  { label: 'PLEASE', morse: '·--· ·-·· · ·- ··· ·', category: 'Social' },
  { label: 'THANK YOU', morse: '- ···· ·- -· -·- / -·-- --- ··-', category: 'Social' },
  { label: 'I NEED ASSISTANCE', morse: '·· / -· · · -·· / ·- ··· ··· ·· ··· - ·- -· -·-· ·', category: 'Urgent' },
  { label: 'CALL MY CAREGIVER', morse: '-·-· ·- ·-·· ·-·· / -- -·-- / -·-· ·- ·-· · --· ·· ···- · ·-·', category: 'Care' },
  { label: 'I AM IN PAIN', morse: '·· / ·- -- / ·· -· / ·--· ·- ·· -·', category: 'Medical' },
  { label: 'PLEASE REPEAT', morse: '·--· ·-·· · ·- ··· · / ·-· · ·--· · ·- -', category: 'General' },
  { label: 'I AM OKAY', morse: '·· / ·- -- / --- -·- ·- -·--', category: 'General' },
  { label: 'EMERGENCY', morse: '· -- · ·-· --· · -· -·-· -·--', category: 'Urgent' },
];

export const TappingGuideCard: React.FC<TappingGuideCardProps> = ({ onInsertPhrase }) => {
  const [activeTab, setActiveTab] = useState<'guide' | 'phrases'>('guide');
  const [playingChar, setPlayingChar] = useState<string | null>(null);
  const [showNumbers, setShowNumbers] = useState<boolean>(false);

  // Play audio demonstration of a letter's Morse code
  const playCharDemo = async (char: string) => {
    const morsePattern = MORSE_CODE_MAP[char];
    if (!morsePattern) return;

    setPlayingChar(char);
    for (const symbol of morsePattern) {
      if (symbol === '.') {
        playMorseTone(false);
        await new Promise((r) => setTimeout(r, 160));
      } else if (symbol === '-') {
        playMorseTone(true);
        await new Promise((r) => setTimeout(r, 360));
      }
      await new Promise((r) => setTimeout(r, 80));
    }
    setPlayingChar(null);
  };

  return (
    <div className="w-full rounded-2xl border border-[#E8E8EB] bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between transition-all min-h-[380px]">
      {/* Tab Navigation Header matching screenshot */}
      <div className="flex items-center border-b border-[#F0EFEA] pb-3 mb-4">
        {/* Tab 1: Tapping Guide */}
        <button
          type="button"
          onClick={() => setActiveTab('guide')}
          className={`flex items-center gap-2 pb-2 text-xs sm:text-sm font-bold transition relative ${
            activeTab === 'guide'
              ? 'text-[#7251E8] border-b-2 border-[#7251E8]'
              : 'text-[#718096] hover:text-[#17213A]'
          }`}
        >
          <GraduationCap size={16} strokeWidth={2.2} />
          <span>Tapping Guide</span>
        </button>

        {/* Tab 2: Quick Phrases */}
        <button
          type="button"
          onClick={() => setActiveTab('phrases')}
          className={`ml-6 flex items-center gap-2 pb-2 text-xs sm:text-sm font-bold transition relative ${
            activeTab === 'phrases'
              ? 'text-[#7251E8] border-b-2 border-[#7251E8]'
              : 'text-[#718096] hover:text-[#17213A]'
          }`}
        >
          <BookOpen size={15} strokeWidth={2.2} />
          <span>Quick Phrases</span>
        </button>
      </div>

      {/* Tab 1 Content: Alphabet Tapping Guide */}
      {activeTab === 'guide' && (
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-[#718096]">
              {showNumbers ? 'Numbers (0-9)' : 'Alphabet (A-Z)'}
            </span>
            <button
              type="button"
              onClick={() => setShowNumbers((prev) => !prev)}
              className="text-[11px] font-semibold text-[#7251E8] hover:underline"
            >
              {showNumbers ? 'Show Letters (A-Z)' : 'Show Numbers (0-9)'}
            </button>
          </div>

          {/* Letter Grid matching screenshot */}
          <div className="grid grid-cols-4 sm:grid-cols-6 xl:grid-cols-8 gap-2">
            {(showNumbers ? NUMBERS : ALPHABET).map((char) => {
              const morseStr = (MORSE_CODE_MAP[char] || '')
                .replace(/\./g, '· ')
                .replace(/-/g, '— ')
                .trim();
              const isCurrentlyPlaying = playingChar === char;

              return (
                <button
                  key={char}
                  type="button"
                  onClick={() => playCharDemo(char)}
                  title={`Click to listen to Morse code for ${char}`}
                  className={`flex flex-col items-center justify-center rounded-xl p-2 border transition-all text-center cursor-pointer ${
                    isCurrentlyPlaying
                      ? 'border-[#7251E8] bg-[#F1EDFC] scale-105 shadow-xs'
                      : 'border-[#E8E8EB] bg-[#F5EFE3] hover:border-[#D5CEBF] hover:bg-[#EFE7D8] active:scale-95'
                  }`}
                >
                  <span className="text-xs sm:text-sm font-extrabold text-[#17213A]">
                    {char}
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-bold text-[#159B68] font-mono mt-0.5 tracking-tighter">
                    {morseStr}
                  </span>
                </button>
              );
            })}
          </div>

          <p className="mt-4 text-[11px] text-[#718096] text-center">
            Click any letter tile to hear its acoustic Morse audio pattern.
          </p>
        </div>
      )}

      {/* Tab 2 Content: Quick Phrases */}
      {activeTab === 'phrases' && (
        <div className="flex-1 flex flex-col">
          <div className="mb-3">
            <span className="text-xs font-semibold text-[#718096]">
              Select a phrase to insert and speak instantly:
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 overflow-y-auto max-h-[260px] pr-1">
            {DEFAULT_QUICK_PHRASES.map((phrase) => (
              <button
                key={phrase.label}
                type="button"
                onClick={() => {
                  onInsertPhrase(phrase.label, phrase.morse);
                  speakText(phrase.label);
                }}
                className="group flex items-center justify-between rounded-xl border border-[#E8E8EB] bg-[#F5EFE3] p-2.5 text-left transition hover:border-[#7251E8] hover:bg-[#F1EDFC]/50 active:scale-98"
              >
                <div>
                  <h4 className="text-xs font-bold text-[#17213A] group-hover:text-[#7251E8] transition">
                    {phrase.label}
                  </h4>
                  <p className="text-[10px] font-mono text-[#159B68] mt-0.5">
                    {phrase.morse}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
                      phrase.category === 'Urgent'
                        ? 'bg-[#FEE2E2] text-[#DC2626]'
                        : phrase.category === 'Medical'
                        ? 'bg-[#EDE9FE] text-[#7C3AED]'
                        : 'bg-[#E5E7EB] text-[#4B5563]'
                    }`}
                  >
                    {phrase.category}
                  </span>
                  <Volume2
                    size={14}
                    className="text-[#718096] group-hover:text-[#7251E8] transition"
                  />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
