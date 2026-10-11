import React from 'react';
import { Megaphone, RefreshCw, VolumeX, Volume2 } from 'lucide-react';

interface AudibleSirenCardProps {
  isSirenActive: boolean;
  onDismiss: () => void;
  onRebroadcast: () => void;
  onToggleSirenSound: () => void;
  isBroadcasting?: boolean;
}

export const AudibleSirenCard: React.FC<AudibleSirenCardProps> = ({
  isSirenActive,
  onDismiss,
  onRebroadcast,
  onToggleSirenSound,
  isBroadcasting = false,
}) => {
  return (
    <div className="rounded-2xl border border-[#E8E8EB] bg-white p-5 sm:p-6 shadow-sm">
      {/* Header Row */}
      <div className="flex items-center justify-between pb-4">
        <div className="flex items-center gap-2.5">
          <Megaphone size={19} strokeWidth={2.2} className="text-[#E8173F]" />
          <h3 className="text-xs sm:text-sm font-bold tracking-wide text-[#17213A]">
            Audible Distress Siren Alarm
          </h3>
        </div>

        <button
          type="button"
          onClick={onToggleSirenSound}
          className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
            isSirenActive
              ? 'border border-[#FECDD3] bg-[#FFE5E8] text-[#E8173F] animate-pulse'
              : 'border border-[#E8E8EB] bg-[#F7F7F8] text-[#6B7280] hover:bg-[#EFEFF1]'
          }`}
        >
          {isSirenActive ? (
            <>
              <Volume2 size={13} strokeWidth={2.2} />
              <span>SIREN ACTIVE</span>
            </>
          ) : (
            <>
              <VolumeX size={13} strokeWidth={2} />
              <span>SIREN MUTED</span>
            </>
          )}
        </button>
      </div>

      {/* Action Buttons Row */}
      <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={onDismiss}
          className="flex items-center justify-center gap-2 rounded-xl border border-[#D1D5DB] bg-white px-4 py-3 text-sm font-semibold text-[#374151] shadow-sm transition-colors hover:bg-[#F9FAFB] active:scale-[0.99]"
        >
          <span>Dismiss SOS Signal</span>
        </button>

        <button
          type="button"
          onClick={onRebroadcast}
          disabled={isBroadcasting}
          className="flex items-center justify-center gap-2 rounded-xl bg-[#E8173F] px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#D01438] active:scale-[0.99] disabled:opacity-60"
        >
          <RefreshCw size={16} strokeWidth={2.2} className={isBroadcasting ? 'animate-spin' : ''} />
          <span>Re-broadcast Signal</span>
        </button>
      </div>
    </div>
  );
};
