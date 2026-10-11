import React from 'react';
import { Contact, Pencil, Phone, MessageSquare, MessageCircle } from 'lucide-react';

interface CaretakerTargetCardProps {
  caretakerName: string;
  caretakerPhone: string;
  broadcastStatusText: string;
  onChangeNumber: () => void;
  onSendWhatsApp: () => void;
  onSendSms: () => void;
  onCallNow: () => void;
  isSending?: boolean;
}

export const CaretakerTargetCard: React.FC<CaretakerTargetCardProps> = ({
  caretakerName,
  caretakerPhone,
  broadcastStatusText,
  onChangeNumber,
  onSendWhatsApp,
  onSendSms,
  onCallNow,
  isSending = false,
}) => {
  return (
    <div className="rounded-2xl border border-[#E8E8EB] bg-white p-5 sm:p-6 shadow-sm">
      {/* Header Row */}
      <div className="flex items-center justify-between border-b border-[#F0F0F2] pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FFF1EC] text-[#F4512A]">
            <Contact size={18} strokeWidth={2.2} />
          </div>
          <h3 className="text-xs sm:text-sm font-bold tracking-wider text-[#F4512A] uppercase">
            CARETAKER BROADCAST TARGET
          </h3>
        </div>

        <button
          type="button"
          onClick={onChangeNumber}
          className="flex items-center gap-1.5 rounded-lg border border-[#E8E8EB] bg-white px-3 py-1.5 text-xs font-semibold text-[#3A4256] transition-colors hover:bg-[#F7F7F8] hover:text-[#17213A]"
        >
          <Pencil size={13} strokeWidth={2} />
          <span>Change No.</span>
        </button>
      </div>

      {/* Caretaker Info Row */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm">
          <span className="font-medium text-[#6B7280]">Caretaker: </span>
          <span className="font-bold text-[#17213A]">{caretakerName || 'Saksham'}</span>
        </div>

        <div className="inline-flex items-center gap-1.5 rounded-full border border-[#D1F2E2] bg-[#E6F7F0] px-3.5 py-1 text-xs sm:text-sm font-semibold text-[#12A66A]">
          <Phone size={14} strokeWidth={2.2} />
          <span>{caretakerPhone || '+91 8130896226'}</span>
        </div>
      </div>

      {/* Action Buttons Row */}
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={onSendWhatsApp}
          disabled={isSending}
          className="flex items-center justify-center gap-2 rounded-xl bg-[#12A66A] px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#0E8B57] active:scale-[0.99] disabled:opacity-60"
        >
          <MessageCircle size={18} strokeWidth={2.2} />
          <span>WhatsApp Caretaker</span>
        </button>

        <button
          type="button"
          onClick={onSendSms}
          disabled={isSending}
          className="flex items-center justify-center gap-2 rounded-xl bg-[#6745E8] px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#5333CC] active:scale-[0.99] disabled:opacity-60"
        >
          <MessageSquare size={18} strokeWidth={2.2} />
          <span>Direct SMS Message</span>
        </button>
      </div>

      {/* Subrow: Status & Call Now */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#F0F0F2] pt-3 text-xs sm:text-sm">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#F4512A]"></span>
          <span className="text-[#6B7280]">Status:</span>
          <span className="font-bold uppercase tracking-wide text-[#F4512A]">
            {broadcastStatusText}
          </span>
        </div>

        <button
          type="button"
          onClick={onCallNow}
          className="inline-flex items-center gap-1.5 font-semibold text-[#12A66A] transition-colors hover:text-[#0E8B57] hover:underline"
        >
          <Phone size={14} strokeWidth={2.2} />
          <span>Call Now</span>
        </button>
      </div>
    </div>
  );
};
