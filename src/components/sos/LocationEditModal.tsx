import React, { useState } from 'react';
import { X, MapPin, Navigation, Check } from 'lucide-react';

interface LocationEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAddress: string;
  currentLat: number;
  currentLng: number;
  onSave: (address: string, lat: number, lng: number) => void;
}

export const LocationEditModal: React.FC<LocationEditModalProps> = ({
  isOpen,
  onClose,
  currentAddress,
  currentLat,
  currentLng,
  onSave,
}) => {
  const [address, setAddress] = useState(currentAddress);
  const [lat, setLat] = useState(String(currentLat));
  const [lng, setLng] = useState(String(currentLng));

  if (!isOpen) return null;

  const handleSave = () => {
    const parsedLat = parseFloat(lat) || currentLat;
    const parsedLng = parseFloat(lng) || currentLng;
    onSave(address.trim(), parsedLat, parsedLng);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#F0F0F2] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-[#6745E8]">
              <MapPin size={18} strokeWidth={2.2} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#17213A]">Edit Location</h3>
              <p className="text-xs text-[#6B7280]">Update distress beacon coordinates</p>
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

        {/* Inputs */}
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700">
              Address / Landmark
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Delhi, Delhi, India"
              className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-[#6745E8] focus:outline-none focus:ring-1 focus:ring-[#6745E8]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700">
                Latitude (°N)
              </label>
              <input
                type="number"
                step="0.0001"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 font-mono text-sm text-gray-900 focus:border-[#6745E8] focus:outline-none focus:ring-1 focus:ring-[#6745E8]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700">
                Longitude (°E)
              </label>
              <input
                type="number"
                step="0.0001"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 font-mono text-sm text-gray-900 focus:border-[#6745E8] focus:outline-none focus:ring-1 focus:ring-[#6745E8]"
              />
            </div>
          </div>
        </div>

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
            className="flex items-center gap-1.5 rounded-xl bg-[#6745E8] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#5232CC]"
          >
            <Check size={14} />
            <span>Apply Location</span>
          </button>
        </div>
      </div>
    </div>
  );
};
