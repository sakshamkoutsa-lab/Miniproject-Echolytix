import React from 'react';
import { Sliders, ArrowLeftRight, Scan, Volume2, Mic } from 'lucide-react';

export interface CallSettingsState {
  auto_translate: boolean;
  show_detected_gestures: boolean;
  speak_translations: boolean;
  noise_reduction: boolean;
}

interface CallSettingsPanelProps {
  settings: CallSettingsState;
  onUpdateSetting: (key: keyof CallSettingsState, value: boolean) => void;
}

export const CallSettingsPanel: React.FC<CallSettingsPanelProps> = ({
  settings,
  onUpdateSetting,
}) => {
  const items = [
    {
      key: 'auto_translate' as const,
      label: 'Auto Translate (Both Ways)',
      icon: ArrowLeftRight,
      value: settings.auto_translate,
    },
    {
      key: 'show_detected_gestures' as const,
      label: 'Show Detected Gestures',
      icon: Scan,
      value: settings.show_detected_gestures,
    },
    {
      key: 'speak_translations' as const,
      label: 'Speak Translations (TTS)',
      icon: Volume2,
      value: settings.speak_translations,
    },
    {
      key: 'noise_reduction' as const,
      label: 'Noise Reduction',
      icon: Mic,
      value: settings.noise_reduction,
    },
  ];

  return (
    <section className="flex flex-col justify-between rounded-2xl border border-[#E8E8EB] bg-white p-4 shadow-[0_1px_3px_rgba(16,24,40,0.05)] sm:p-5">
      {/* Header */}
      <header className="flex items-center gap-2 pb-2.5">
        <Sliders size={16} className="text-[#F4512A]" strokeWidth={2.4} />
        <h3 className="text-sm font-bold text-[#202938]">Call Settings</h3>
      </header>

      {/* 4 Setting Toggle Rows */}
      <div className="space-y-2.5 pt-0.5">
        {items.map(({ key, label, icon: Icon, value }) => (
          <div key={key} className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#202938]">
              <Icon size={14} className="text-[#6B7280]" strokeWidth={2.2} />
              <span>{label}</span>
            </div>

            {/* Orange Toggle Switch */}
            <button
              type="button"
              role="switch"
              aria-checked={value}
              onClick={() => onUpdateSetting(key, !value)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
                value ? 'bg-[#F4512A]' : 'bg-[#D1D5DB]'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out mt-0.5 ${
                  value ? 'translate-x-4.5 ml-0' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};
