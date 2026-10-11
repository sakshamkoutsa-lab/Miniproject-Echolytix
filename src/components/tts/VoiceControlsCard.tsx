import React from 'react';
import { Settings, Info, ChevronDown } from 'lucide-react';

interface VoiceControlsCardProps {
  voices: SpeechSynthesisVoice[];
  selectedVoiceName: string;
  onSelectVoice: (voiceName: string) => void;
  rate: number;
  onChangeRate: (rate: number) => void;
  pitch: number;
  onChangePitch: (pitch: number) => void;
}

export const VoiceControlsCard: React.FC<VoiceControlsCardProps> = ({
  voices,
  selectedVoiceName,
  onSelectVoice,
  rate,
  onChangeRate,
  pitch,
  onChangePitch,
}) => {
  return (
    <div className="w-full rounded-2xl border border-[#E8E8EB] bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between transition-all">
      {/* Header matching screenshot */}
      <div className="flex items-center gap-2 pb-4 border-b border-[#F5F5F7]">
        <Settings size={18} className="text-[#F4512A]" />
        <h3 className="text-sm sm:text-base font-bold text-[#17213A]">
          Voice Controls & Speech Rate
        </h3>
      </div>

      <div className="pt-4 space-y-5">
        {/* Section A: Voice Selection Dropdown */}
        <div>
          <div className="flex items-center gap-1 mb-1.5">
            <label className="text-xs font-semibold text-[#718096]">
              Voice Selection
            </label>
            <span title="Choose an installed system voice for speech synthesis">
              <Info size={13} className="text-[#9CA3AF] cursor-help" />
            </span>
          </div>

          <div className="relative">
            <select
              value={selectedVoiceName}
              onChange={(e) => onSelectVoice(e.target.value)}
              className="w-full appearance-none rounded-xl border border-[#E8E8EB] bg-white px-3.5 py-2.5 pr-10 text-xs sm:text-sm font-medium text-[#17213A] shadow-2xs focus:border-[#F4512A] focus:outline-none cursor-pointer"
            >
              {voices.length > 0 ? (
                voices.map((v, i) => (
                  <option key={`${v.name}-${i}`} value={v.name}>
                    {v.name} ({v.lang})
                  </option>
                ))
              ) : (
                <option value="">Default System Natural Voice</option>
              )}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#718096]">
              <ChevronDown size={16} />
            </div>
          </div>
        </div>

        {/* Section B & C: Speed Rate & Pitch Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {/* Speed Rate Slider */}
          <div className="rounded-xl border border-[#E8E8EB] bg-[#FAF8F5] p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1">
                <span className="text-xs font-semibold text-[#17213A]">
                  Speed Rate
                </span>
                <span title="Controls how fast the synthesized voice speaks">
                  <Info size={12} className="text-[#9CA3AF] cursor-help" />
                </span>
              </div>
              <span className="rounded-md bg-[#E6F4EA] px-2 py-0.5 text-xs font-bold font-mono text-[#079F72]">
                {rate}x
              </span>
            </div>

            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={rate}
              onChange={(e) => onChangeRate(parseFloat(e.target.value))}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-[#E5E7EB] accent-[#079F72] focus:outline-none"
            />

            <div className="mt-2 flex justify-between text-[10px] font-mono font-medium text-[#718096]">
              <span>0.5x</span>
              <span>1x</span>
              <span>1.5x</span>
              <span>2x</span>
            </div>
          </div>

          {/* Pitch Slider */}
          <div className="rounded-xl border border-[#E8E8EB] bg-[#FAF8F5] p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1">
                <span className="text-xs font-semibold text-[#17213A]">
                  Pitch
                </span>
                <span title="Controls the tonal pitch of the synthesized speech">
                  <Info size={12} className="text-[#9CA3AF] cursor-help" />
                </span>
              </div>
              <span className="rounded-md bg-[#F1EDFC] px-2 py-0.5 text-xs font-bold font-mono text-[#7451E8]">
                {pitch}x
              </span>
            </div>

            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={pitch}
              onChange={(e) => onChangePitch(parseFloat(e.target.value))}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-[#E5E7EB] accent-[#7451E8] focus:outline-none"
            />

            <div className="mt-2 flex justify-between text-[10px] font-mono font-medium text-[#718096]">
              <span>0.5x</span>
              <span>1x</span>
              <span>1.5x</span>
              <span>2x</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
