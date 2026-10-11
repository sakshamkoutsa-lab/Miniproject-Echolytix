import React, { useState, useEffect } from 'react';
import { X, Keyboard, Check, RotateCcw, AlertCircle } from 'lucide-react';

interface KeyMappingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentKey: string;
  currentCode: string;
  onSave: (key: string, code: string) => void;
  onReset: () => void;
}

export const KeyMappingModal: React.FC<KeyMappingModalProps> = ({
  isOpen,
  onClose,
  currentKey,
  currentCode,
  onSave,
  onReset,
}) => {
  const [capturedKey, setCapturedKey] = useState<string>(currentKey);
  const [capturedCode, setCapturedCode] = useState<string>(currentCode);
  const [isListening, setIsListening] = useState<boolean>(true);

  useEffect(() => {
    if (isOpen) {
      setCapturedKey(currentKey);
      setCapturedCode(currentCode);
      setIsListening(true);
    }
  }, [isOpen, currentKey, currentCode]);

  useEffect(() => {
    if (!isOpen || !isListening) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture Escape if pressed to exit
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      e.preventDefault();
      e.stopPropagation();

      setCapturedKey(e.key);
      setCapturedCode(e.code);
      setIsListening(false);
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isOpen, isListening, onClose]);

  if (!isOpen) return null;

  const displayKeyName =
    capturedCode === 'Space' || capturedKey === ' '
      ? 'Spacebar'
      : capturedKey.length === 1
      ? capturedKey.toUpperCase()
      : capturedCode || capturedKey;

  const quickPresets = [
    { label: 'Spacebar', key: ' ', code: 'Space' },
    { label: 'Enter', key: 'Enter', code: 'Enter' },
    { label: 'Down Arrow', key: 'ArrowDown', code: 'ArrowDown' },
    { label: 'Right Shift', key: 'Shift', code: 'ShiftRight' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-[#E8E8EB] bg-white p-6 shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#F0EFEA] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F1EDFC] text-[#7251E8]">
              <Keyboard size={18} strokeWidth={2.4} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#17213A]">Map Switch Key</h3>
              <p className="text-xs text-[#718096]">
                Configure the trigger key for Morse input
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

        {/* Listening / Key Detection Box */}
        <div className="my-5">
          <div
            onClick={() => setIsListening(true)}
            className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition ${
              isListening
                ? 'border-[#7251E8] bg-[#F1EDFC]/30'
                : 'border-[#E8E8EB] bg-[#FAF8F5] hover:border-[#7251E8]'
            }`}
          >
            {isListening ? (
              <>
                <div className="relative mb-3 flex h-14 w-14 items-center justify-center">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#7251E8]/30" />
                  <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[#7251E8] text-white shadow-md">
                    <Keyboard size={20} />
                  </div>
                </div>
                <p className="text-sm font-bold text-[#7251E8]">Listening for key press...</p>
                <p className="mt-1 text-xs text-[#718096]">
                  Press any key on your keyboard or Bluetooth switch device
                </p>
              </>
            ) : (
              <>
                <div className="mb-2 flex items-center justify-center rounded-xl bg-white px-5 py-3 border border-[#E8E8EB] shadow-xs">
                  <span className="text-xl font-extrabold text-[#17213A] font-mono">
                    {displayKeyName}
                  </span>
                </div>
                <p className="text-xs font-semibold text-[#159B68] flex items-center gap-1">
                  <Check size={14} /> Key detected! (Code: {capturedCode})
                </p>
                <button
                  type="button"
                  onClick={() => setIsListening(true)}
                  className="mt-3 text-xs font-semibold text-[#7251E8] underline hover:text-[#5B3BC4]"
                >
                  Click to re-record key
                </button>
              </>
            )}
          </div>

          {/* Quick Presets */}
          <div className="mt-4">
            <span className="text-xs font-semibold text-[#718096]">Quick Presets:</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {quickPresets.map((preset) => (
                <button
                  key={preset.code}
                  type="button"
                  onClick={() => {
                    setCapturedKey(preset.key);
                    setCapturedCode(preset.code);
                    setIsListening(false);
                  }}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                    capturedCode === preset.code
                      ? 'border-[#7251E8] bg-[#F1EDFC] text-[#7251E8] font-bold'
                      : 'border-[#E8E8EB] bg-white text-[#4A5568] hover:bg-[#F3F4F6]'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 flex items-start gap-2 rounded-xl bg-[#FFF8F5] p-3 text-xs text-[#C05621] border border-[#FEEBC8]">
            <AlertCircle size={15} className="shrink-0 mt-0.5 text-[#F4512A]" />
            <span>
              Bluetooth switches configured as standard keyboard inputs (e.g. Space, Enter) are fully supported without extra drivers.
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-[#F0EFEA] pt-4">
          <button
            type="button"
            onClick={() => {
              onReset();
              setCapturedKey(' ');
              setCapturedCode('Space');
              setIsListening(false);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-[#718096] hover:bg-[#F3F4F6] transition active:scale-95"
          >
            <RotateCcw size={14} />
            <span>Reset Default</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#E8E8EB] bg-white px-4 py-2 text-xs font-semibold text-[#4A5568] hover:bg-[#F3F4F6] transition active:scale-95"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onSave(capturedKey, capturedCode);
                onClose();
              }}
              className="rounded-xl bg-[#F4512A] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#E0401B] transition active:scale-95"
            >
              Save Mapping
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
