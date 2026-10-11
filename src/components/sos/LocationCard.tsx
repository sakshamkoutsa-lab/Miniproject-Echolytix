import React from 'react';
import { Navigation, RefreshCw, Pencil, MapPin, Map } from 'lucide-react';

interface LocationCardProps {
  locationSource: 'GPS' | 'IP' | 'MANUAL';
  address: string;
  latitude: number;
  longitude: number;
  isLocating: boolean;
  onRefreshLocation: () => void;
  onEditLocation: () => void;
}

export const LocationCard: React.FC<LocationCardProps> = ({
  locationSource,
  address,
  latitude,
  longitude,
  isLocating,
  onRefreshLocation,
  onEditLocation,
}) => {
  const latFormatted = `${Math.abs(latitude).toFixed(4)}°${latitude >= 0 ? 'N' : 'S'}`;
  const lngFormatted = `${Math.abs(longitude).toFixed(4)}°${longitude >= 0 ? 'E' : 'W'}`;
  const googleMapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;

  return (
    <div className="rounded-2xl border border-[#E8E8EB] bg-white p-5 sm:p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#F0F0F2]">
        <div className="flex items-center gap-2">
          <Navigation size={18} strokeWidth={2.2} className="text-[#6745E8]" />
          <h3 className="text-xs sm:text-sm font-bold tracking-wider text-[#6745E8] uppercase">
            POSITION: {locationSource}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRefreshLocation}
            disabled={isLocating}
            className="flex items-center gap-1.5 rounded-lg border border-[#E8E8EB] bg-white px-3 py-1.5 text-xs font-semibold text-[#3A4256] transition-colors hover:bg-[#F7F7F8] hover:text-[#17213A] disabled:opacity-60"
          >
            <RefreshCw size={13} strokeWidth={2} className={isLocating ? 'animate-spin' : ''} />
            <span>Locate</span>
          </button>

          <button
            type="button"
            onClick={onEditLocation}
            className="flex items-center gap-1.5 rounded-lg border border-[#E8E8EB] bg-white px-3 py-1.5 text-xs font-semibold text-[#3A4256] transition-colors hover:bg-[#F7F7F8] hover:text-[#17213A]"
          >
            <Pencil size={13} strokeWidth={2} />
            <span>Edit</span>
          </button>
        </div>
      </div>

      {/* Location Details Body */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-[#E8173F]">
            <MapPin size={20} strokeWidth={2.2} />
          </div>

          <div>
            <h4 className="text-sm sm:text-base font-bold text-[#17213A]">
              {address || 'Delhi, Delhi, India'}
            </h4>
            <p className="mt-0.5 font-mono text-xs text-[#6B7280]">
              Coordinates: {latFormatted}, {lngFormatted}
            </p>
          </div>
        </div>

        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#6745E8] transition-colors hover:text-[#5232CC] hover:underline"
        >
          <Map size={16} strokeWidth={2.2} />
          <span>View Map</span>
        </a>
      </div>
    </div>
  );
};
