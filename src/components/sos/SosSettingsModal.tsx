import React, { useState } from 'react';
import { X, Settings, Volume2, MessageSquare, Check } from 'lucide-react';

interface SosSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMessage: string;
  autoSiren: boolean;
  onSaveSettings: (settings: { defaultMessage: string; autoSiren: boolean }) => void;
}

export const SosSettingsModal: React.FC<SosSettingsModalProps> = ({
  isOpen,
  onClose,
  defaultMessage,
  autoSiren,
  onSaveSettings,
}) => {
  const [msg, setMsg] = useState(defaultMessage);
  const [siren, setSiren] = useState(autoSiren);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveSettings({ defaultMessage: msg.trim(), autoSiren: siren });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#F0F0F2] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFF1EC] text-[#F4512A]">
              <Settings size={18} strokeWidth={2.2} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#17213A]">SOS Settings</h3>
              <p className="text-xs text-[#6B7280]">Configure distress beacon defaults</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700">
              Default Emergency Distress Text
            </label>
            <textarea
              rows={3}
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-300 p-2.5 text-xs text-gray-900 focus:border-[#F4512A] focus:outline-none focus:ring-1 focus:ring-[#F4512A]"
            />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50/50 p-3">
            <div className="flex items-center gap-2.5">
              <Volume2 size={18} className="text-[#E8173F]" />
              <div>
                <p className="text-xs font-semibold text-gray-900">Audible Siren On Signal</p>
                <p className="text-[11px] text-gray-500">Play distress buzzer sound through device speakers</p>
              </div>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={siren}
                onChange={(e) => setSiren(e.target.checked)}
                className="peer sr-only"
              />
              <div className="peer h-5 w-9 rounded-full bg-gray-300 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-[#E8173F] peer-checked:after:translate-x-full peer-focus:outline-none"></div>
            </label>
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-6 flex justify-end gap-2 border-t border-[#F0F0F2] pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 rounded-xl bg-[#F4512A] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#E0441E]"
          >
            <Check size={14} />
            <span>Save Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};
