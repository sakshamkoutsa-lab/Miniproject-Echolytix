import React, { useEffect, useRef } from 'react';
import { Video, PhoneOff, PhoneCall } from 'lucide-react';
import { IncomingCallEvent } from '../../utils/webrtcClient';

interface IncomingCallModalProps {
  incomingCall: IncomingCallEvent | null;
  onAccept: () => void;
  onDecline: () => void;
}

export const IncomingCallModal: React.FC<IncomingCallModalProps> = ({
  incomingCall,
  onAccept,
  onDecline,
}) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const ringtoneIntervalRef = useRef<any>(null);

  useEffect(() => {
    if (!incomingCall) {
      if (ringtoneIntervalRef.current) clearInterval(ringtoneIntervalRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
      return;
    }

    // Play synthesized incoming ringtone
    const playChime = () => {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
          audioContextRef.current = new AudioCtx();
        }
        const ctx = audioContextRef.current;
        if (ctx.state === 'suspended') {
          ctx.resume();
        }

        const now = ctx.currentTime;
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(440, now); // A4
        osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15);

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(523.25, now); // C5
        osc2.frequency.exponentialRampToValueAtTime(1046.5, now + 0.15);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.5);
        osc2.stop(now + 0.5);
      } catch (e) {
        // AudioContext may require user gesture on some browsers
      }
    };

    playChime();
    ringtoneIntervalRef.current = setInterval(playChime, 2000);

    return () => {
      if (ringtoneIntervalRef.current) clearInterval(ringtoneIntervalRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
    };
  }, [incomingCall]);

  if (!incomingCall) return null;

  const caller = incomingCall.caller;
  const initials =
    caller.avatar_initials ||
    caller.name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join('') ||
    'EC';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-[#E8E8EB]/80 bg-white p-7 shadow-2xl text-center">
        {/* Animated Pulse Ring behind Avatar */}
        <div className="relative mx-auto mb-5 flex h-24 w-24 items-center justify-center">
          <div className="absolute inset-0 animate-ping rounded-full bg-[#16A36A]/20 duration-1000" />
          <div className="absolute -inset-2 animate-pulse rounded-full bg-[#F4512A]/15" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#F4512A] to-[#E26955] text-2xl font-bold text-white shadow-lg">
            {initials}
          </div>
        </div>

        {/* Status Badge */}
        <div className="inline-flex items-center gap-1.5 rounded-full bg-[#ECFDF5] px-3 py-1 text-xs font-semibold text-[#16A36A] border border-[#16A36A]/20 mb-2">
          <span className="h-2 w-2 rounded-full bg-[#16A36A] animate-pulse" />
          <span>Incoming Video Call</span>
        </div>

        {/* Caller Info */}
        <h3 className="text-xl font-bold text-[#17213A] tracking-tight">{caller.name}</h3>
        {caller.phone && (
          <p className="mt-1 text-xs font-medium text-[#6B7280]">{caller.phone}</p>
        )}
        <p className="mt-2 text-xs text-[#9CA3AF]">
          Would you like to connect with real-time video, audio, and sign language assistance?
        </p>

        {/* Action Buttons */}
        <div className="mt-7 flex items-center justify-center gap-4">
          {/* Decline Button */}
          <button
            type="button"
            onClick={onDecline}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#FEE2E2] px-4 py-3 text-xs font-bold text-[#DC2626] transition hover:bg-[#FCA5A5] hover:text-[#991B1B] active:scale-95 shadow-sm"
          >
            <PhoneOff size={16} strokeWidth={2.4} />
            <span>Decline</span>
          </button>

          {/* Accept Button */}
          <button
            type="button"
            onClick={onAccept}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#16A36A] px-4 py-3 text-xs font-bold text-white transition hover:bg-[#15803D] active:scale-95 shadow-md shadow-[#16A36A]/25"
          >
            <Video size={16} strokeWidth={2.4} />
            <span>Accept</span>
          </button>
        </div>
      </div>
    </div>
  );
};
