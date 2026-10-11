import React from 'react';
import { Bluetooth, Keyboard } from 'lucide-react';

interface BluetoothSwitchCardProps {
  mappedKeyName: string;
  onOpenMapKeyModal: () => void;
}

export const BluetoothSwitchCard: React.FC<BluetoothSwitchCardProps> = ({
  mappedKeyName,
  onOpenMapKeyModal,
}) => {
  return (
    <div className="w-full rounded-2xl border border-[#E8E8EB] bg-white p-4 sm:p-5 shadow-xs transition-all hover:border-[#D8D8DC] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      {/* Left: Bluetooth Icon + Labels */}
      <div className="flex items-center gap-3.5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F1EDFC] text-[#7251E8] shadow-xs">
          <Bluetooth size={22} strokeWidth={2.4} />
        </div>
        <div>
          <h2 className="text-xs sm:text-sm font-extrabold tracking-wider text-[#17213A] uppercase font-mono">
            BLUETOOTH SWITCH KEY
          </h2>
          <p className="mt-0.5 text-xs text-[#718096]">
            Mapped Trigger Key:{' '}
            <span className="font-semibold text-[#7251E8]">{mappedKeyName}</span>
          </p>
        </div>
      </div>

      {/* Right: Map Switch Key Button */}
      <button
        type="button"
        onClick={onOpenMapKeyModal}
        className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#E8E8EB] bg-[#FAF8F5] px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#17213A] shadow-xs transition hover:bg-[#F3F0EA] hover:border-[#DCD7CE] active:scale-95"
      >
        <Keyboard size={16} strokeWidth={2} className="text-[#718096]" />
        <span>Map Switch Key</span>
      </button>
    </div>
  );
};
