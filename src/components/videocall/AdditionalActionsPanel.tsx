import React from 'react';
import {
  Sparkles,
  Monitor,
  MessageSquare,
  Camera,
  RefreshCw,
} from 'lucide-react';

interface AdditionalActionsPanelProps {
  isSharingScreen: boolean;
  onToggleScreenShare: () => void;
  onOpenQuickPhrases: () => void;
  onCaptureScreenshot: () => void;
  onSwitchCamera: () => void;
}

export const AdditionalActionsPanel: React.FC<AdditionalActionsPanelProps> = ({
  isSharingScreen,
  onToggleScreenShare,
  onOpenQuickPhrases,
  onCaptureScreenshot,
  onSwitchCamera,
}) => {
  return (
    <section className="flex flex-col justify-between rounded-2xl border border-[#E8E8EB] bg-white p-4 shadow-[0_1px_3px_rgba(16,24,40,0.05)] sm:p-5">
      {/* Header */}
      <header className="flex items-center gap-2 pb-2.5">
        <Sparkles size={16} className="text-[#F4512A]" strokeWidth={2.4} />
        <h3 className="text-sm font-bold text-[#202938]">Additional Actions</h3>
      </header>

      {/* 2x2 Grid of Action Buttons */}
      <div className="grid grid-cols-2 gap-2 pt-0.5">
        {/* Share Screen */}
        <button
          type="button"
          onClick={onToggleScreenShare}
          className={`flex items-center justify-center gap-1.5 rounded-xl border p-2.5 text-xs font-semibold transition active:scale-95 ${
            isSharingScreen
              ? 'border-[#F4512A] bg-[#FFF8F5] text-[#F4512A]'
              : 'border-[#E8E8EB] bg-[#F7F7F8] text-[#202938] hover:bg-[#F3F4F6]'
          }`}
        >
          <Monitor size={15} strokeWidth={2.2} />
          <span>{isSharingScreen ? 'Stop Sharing' : 'Share Screen'}</span>
        </button>

        {/* Send Quick Phrase */}
        <button
          type="button"
          onClick={onOpenQuickPhrases}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-[#E8E8EB] bg-[#F7F7F8] p-2.5 text-xs font-semibold text-[#202938] transition hover:bg-[#F3F4F6] active:scale-95"
        >
          <MessageSquare size={15} strokeWidth={2.2} />
          <span>Send Quick Phrase</span>
        </button>

        {/* Capture Screenshot */}
        <button
          type="button"
          onClick={onCaptureScreenshot}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-[#E8E8EB] bg-[#F7F7F8] p-2.5 text-xs font-semibold text-[#202938] transition hover:bg-[#F3F4F6] active:scale-95"
        >
          <Camera size={15} strokeWidth={2.2} />
          <span>Capture Screenshot</span>
        </button>

        {/* Switch Camera */}
        <button
          type="button"
          onClick={onSwitchCamera}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-[#E8E8EB] bg-[#F7F7F8] p-2.5 text-xs font-semibold text-[#202938] transition hover:bg-[#F3F4F6] active:scale-95"
        >
          <RefreshCw size={15} strokeWidth={2.2} />
          <span>Switch Camera</span>
        </button>
      </div>
    </section>
  );
};
