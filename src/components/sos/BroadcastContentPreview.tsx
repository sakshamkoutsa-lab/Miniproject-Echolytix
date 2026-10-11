import React, { useState } from 'react';
import { FileText, Copy, Check, Edit2 } from 'lucide-react';

interface BroadcastContentPreviewProps {
  message: string;
  onUpdateMessage?: (newMsg: string) => void;
}

export const BroadcastContentPreview: React.FC<BroadcastContentPreviewProps> = ({
  message,
  onUpdateMessage,
}) => {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draftMessage, setDraftMessage] = useState(message);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.warn('Could not copy to clipboard:', e);
    }
  };

  const handleSave = () => {
    if (onUpdateMessage) {
      onUpdateMessage(draftMessage);
    }
    setIsEditing(false);
  };

  return (
    <div className="rounded-2xl border border-[#E8E8EB] bg-white p-5 sm:p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center gap-2.5">
          <FileText size={18} strokeWidth={2} className="text-[#5B6375]" />
          <h3 className="text-xs sm:text-sm font-bold tracking-wider text-[#202938] uppercase">
            BROADCAST CONTENT PREVIEW
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {onUpdateMessage && (
            <button
              type="button"
              onClick={() => {
                if (isEditing) {
                  handleSave();
                } else {
                  setDraftMessage(message);
                  setIsEditing(true);
                }
              }}
              className="flex items-center gap-1.5 rounded-lg border border-[#E8E8EB] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#5B6375] transition-colors hover:bg-[#F7F7F8] hover:text-[#17213A]"
            >
              <Edit2 size={13} strokeWidth={2} />
              <span>{isEditing ? 'Save' : 'Edit'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-lg border border-[#E8E8EB] bg-white px-3 py-1.5 text-xs font-semibold text-[#3A4256] transition-colors hover:bg-[#F7F7F8] hover:text-[#17213A]"
          >
            {copied ? (
              <>
                <Check size={13} strokeWidth={2.2} className="text-green-600" />
                <span className="text-green-600 font-bold">Copied!</span>
              </>
            ) : (
              <>
                <Copy size={13} strokeWidth={2} />
                <span>Copy Text</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="mt-3 rounded-xl border border-[#FCDADF] bg-[#FFF8F8] p-4 text-xs sm:text-sm">
        {isEditing ? (
          <textarea
            value={draftMessage}
            onChange={(e) => setDraftMessage(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-red-300 bg-white p-2.5 font-mono text-xs sm:text-sm leading-relaxed text-[#E8173F] focus:border-[#E8173F] focus:outline-none focus:ring-1 focus:ring-[#E8173F]"
          />
        ) : (
          <p className="font-mono leading-relaxed text-[#E8173F] tracking-wide select-all">
            "{message}"
          </p>
        )}
      </div>
    </div>
  );
};
