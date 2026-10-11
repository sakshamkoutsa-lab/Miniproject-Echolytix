import React, { useEffect } from 'react';
import { TriangleAlert } from 'lucide-react';

interface SosConfirmDialogProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * Deliberate confirmation step before handing off to the app's existing SOS
 * flow (SosModal), so a stray click on the dashboard can't dispatch an alert.
 */
export const SosConfirmDialog: React.FC<SosConfirmDialogProps> = ({ open, onCancel, onConfirm }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCancel();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#17213A]/40 p-4 backdrop-blur-[2px]" onClick={onCancel}>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="sos-confirm-title"
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#FDECEC]">
          <TriangleAlert size={28} className="text-[#E23A3A]" />
        </div>
        <h2 id="sos-confirm-title" className="mt-4 text-center text-lg font-semibold text-[#17213A]">
          Trigger Emergency SOS?
        </h2>
        <p className="mt-1.5 text-center text-sm text-[#6B7280]">
          This will open the emergency flow and alert your caregiver with your location.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onCancel}
            autoFocus
            className="rounded-lg border border-[#E8E8EB] px-4 py-2.5 text-sm font-medium text-[#17213A] transition hover:bg-[#F7F7F8]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-[#E23A3A] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#C92E2E]"
          >
            Send SOS
          </button>
        </div>
      </div>
    </div>
  );
};
