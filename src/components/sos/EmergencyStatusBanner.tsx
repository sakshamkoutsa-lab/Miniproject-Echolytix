import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface EmergencyStatusBannerProps {
  isActive: boolean;
  statusText?: string;
}

export const EmergencyStatusBanner: React.FC<EmergencyStatusBannerProps> = ({
  isActive,
  statusText = 'DISTRESS BEACON DISPATCHED TO CARETAKER',
}) => {
  return (
    <div
      role="region"
      aria-label="Emergency SOS Alert Status"
      className="relative overflow-hidden rounded-2xl border border-[#FCDADF] bg-[#FFF0F2] p-5 shadow-sm transition-all duration-300"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Left icon + text */}
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm border border-[#FCDADF]">
            <AlertTriangle className="h-8 w-8 text-[#E8173F]" strokeWidth={2.2} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold tracking-wide text-[#E8173F]">
                EMERGENCY SOS SIGNAL
              </h2>
            </div>
            <p className="mt-0.5 font-mono text-xs sm:text-sm font-semibold tracking-wider text-[#E8173F]/90">
              {isActive ? statusText : 'READY TO BROADCAST TO CARETAKER'}
            </p>
          </div>
        </div>

        {/* Right Status Badge */}
        <div className="flex items-center sm:self-center">
          {isActive ? (
            <div className="inline-flex items-center gap-2 rounded-full border border-[#FECDD3] bg-[#FFE5E8] px-3.5 py-1.5 text-xs font-bold text-[#E8173F] shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#E8173F] opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#E8173F]"></span>
              </span>
              <span>ACTIVE</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3.5 py-1.5 text-xs font-bold text-amber-700 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-amber-500"></span>
              <span>READY</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
