import React from 'react';
import { X, Play, Hand, Eye, Target, Volume2, ShieldCheck, PhoneCall } from 'lucide-react';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowItWorksModal: React.FC<HowItWorksModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-[#E8E8EB] bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#F0EFEA] pb-3.5">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FFF1EC] text-[#F4512A]">
              <Play size={16} fill="currentColor" />
            </div>
            <h2 className="text-base font-bold text-[#202938]">
              How Accessible Video Call Works
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6B7280] transition hover:bg-[#F3F4F6] hover:text-[#202938]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content list */}
        <div className="mt-4 space-y-3.5 text-xs text-[#4B5563]">
          <div className="flex items-start gap-3 rounded-xl bg-[#F7F7F8] p-3">
            <PhoneCall size={18} className="mt-0.5 text-[#F4512A] shrink-0" />
            <div>
              <h4 className="font-bold text-[#202938]">1. Start or Receive a Call</h4>
              <p className="mt-0.5 text-[#6B7280]">
                Select a contact from Caregivers, Family, or Healthcare to initiate an encrypted WebRTC audio and video stream.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl bg-[#F7F7F8] p-3">
            <Hand size={18} className="mt-0.5 text-[#F4512A] shrink-0" />
            <div>
              <h4 className="font-bold text-[#202938]">2. Choose Your Communication Method</h4>
              <p className="mt-0.5 text-[#6B7280]">
                Select between <strong>Hand Sign</strong>, <strong>Blink to Text</strong>, <strong>Tap Input</strong>, <strong>Morse Code</strong>, or <strong>Voice</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl bg-[#F7F7F8] p-3">
            <Volume2 size={18} className="mt-0.5 text-[#F4512A] shrink-0" />
            <div>
              <h4 className="font-bold text-[#202938]">3. Real-Time AI Translation & TTS</h4>
              <p className="mt-0.5 text-[#6B7280]">
                EchoLytix translates physical gestures and blinks into natural language sentences and automatically speaks them aloud for the other participant.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl bg-[#F7F7F8] p-3">
            <ShieldCheck size={18} className="mt-0.5 text-[#16A36A] shrink-0" />
            <div>
              <h4 className="font-bold text-[#202938]">4. Transcript & Emergency Support</h4>
              <p className="mt-0.5 text-[#6B7280]">
                Follow the live conversation transcript in real-time, dispatch quick assistive phrases, or trigger SOS emergency dispatch at any moment.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 flex justify-end border-t border-[#F0EFEA] pt-3.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#F4512A] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#E0441F]"
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  );
};
