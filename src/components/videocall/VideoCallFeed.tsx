import React, { useRef, useState, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Maximize2,
  PhoneOff,
  Settings,
  Signal,
  User,
  Activity,
} from 'lucide-react';

interface VideoCallFeedProps {
  remoteStream: MediaStream | null;
  localStream: MediaStream | null;
  remoteParticipantName: string;
  remoteParticipantRole?: string;
  callDurationSeconds: number;
  connectionState: 'idle' | 'initiating' | 'ringing' | 'connecting' | 'connected' | 'ended';
  isMuted: boolean;
  isCameraOff: boolean;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onEndCall: () => void;
  onOpenSettings?: () => void;
}

export const VideoCallFeed: React.FC<VideoCallFeedProps> = ({
  remoteStream,
  localStream,
  remoteParticipantName,
  remoteParticipantRole = 'Caretaker',
  callDurationSeconds,
  connectionState,
  isMuted,
  isCameraOff,
  onToggleMute,
  onToggleCamera,
  onEndCall,
  onOpenSettings,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Attach Remote Stream to remote video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.play().catch(() => {});
    }
  }, [remoteStream]);

  // Attach Local Stream to local video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.play().catch(() => {});
    }
  }, [localStream]);

  // Format Duration seconds as HH:MM:SS or MM:SS
  const formatDuration = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleToggleFullscreen = async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (e) {
      console.warn('Fullscreen toggle failed:', e);
    }
  };

  const hasActiveRemoteVideo =
    remoteStream && remoteStream.getVideoTracks().some((t) => t.enabled && t.readyState === 'live');

  return (
    <section
      ref={containerRef}
      className="relative flex h-full min-h-[380px] w-full flex-col overflow-hidden rounded-2xl bg-[#1E232A] shadow-md"
    >
      {/* 1. Main Remote Video Area */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        {hasActiveRemoteVideo ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="h-full w-full object-cover"
          />
        ) : (
          /* Realistic Simulated Remote Video Background / Room Preview matching reference */
          <div className="relative flex h-full w-full items-center justify-center bg-[#252B35] overflow-hidden">
            {/* Ambient warm room background lighting */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/60 z-10" />
            <img
              src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80"
              alt="Remote participant placeholder"
              className="h-full w-full object-cover filter brightness-95"
            />
          </div>
        )}

        {/* 2. Ringing & Initiating Overlay */}
        {(connectionState === 'initiating' || connectionState === 'ringing' || connectionState === 'connecting') && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/75 p-6 backdrop-blur-md animate-fade-in text-center">
            <div className="relative mb-4 flex h-20 w-20 items-center justify-center">
              <div className="absolute inset-0 animate-ping rounded-full bg-[#F4512A]/30 duration-1000" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-[#F4512A] text-xl font-bold text-white shadow-lg">
                {remoteParticipantName.slice(0, 2).toUpperCase()}
              </div>
            </div>
            <h3 className="text-base font-bold text-white">{remoteParticipantName}</h3>
            <p className="mt-1 text-xs text-white/70 font-medium">
              {connectionState === 'connecting' ? 'Connecting WebRTC stream...' : 'Ringing...'}
            </p>
            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={onEndCall}
                className="flex items-center gap-2 rounded-xl bg-[#E23A3A] px-4 py-2 text-xs font-bold text-white shadow-lg transition hover:bg-[#C92A2A] active:scale-95"
              >
                <PhoneOff size={14} />
                <span>Cancel</span>
              </button>
            </div>
          </div>
        )}

        {/* 3. Top-Left Overlay: Remote Participant Pill */}
        <div className="absolute left-3.5 top-3.5 z-20 flex items-center gap-2 rounded-xl bg-black/60 px-2.5 py-1.5 backdrop-blur-md border border-white/10 text-white">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E5B2A1] text-xs font-bold text-white shadow-sm overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80"
              alt="Participant avatar"
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold leading-tight text-white/95">
              {remoteParticipantName} ({remoteParticipantRole})
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              {/* Green signal strength */}
              <div className="flex items-end gap-0.5 h-2.5">
                <span className="w-0.5 h-1 rounded-full bg-[#16A36A]" />
                <span className="w-0.5 h-1.5 rounded-full bg-[#16A36A]" />
                <span className="w-0.5 h-2 rounded-full bg-[#16A36A]" />
                <span className="w-0.5 h-2.5 rounded-full bg-[#16A36A]" />
              </div>
              <span className="font-mono text-[10px] text-white/80">
                {connectionState === 'connected' ? formatDuration(callDurationSeconds) : connectionState}
              </span>
            </div>
          </div>
        </div>

        {/* 3. Top-Right Overlay: HD Badge + Settings */}
        <div className="absolute right-3.5 top-3.5 z-20 flex items-center gap-2">
          {/* HD Badge */}
          <div className="rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-bold tracking-wider text-white backdrop-blur-md border border-white/15">
            HD
          </div>
          {/* Settings gear button */}
          <button
            type="button"
            onClick={onOpenSettings}
            title="Call settings"
            className="flex h-7 w-7 items-center justify-center rounded-md bg-black/60 text-white/90 backdrop-blur-md border border-white/10 transition hover:bg-black/80"
          >
            <Settings size={14} />
          </button>
        </div>

        {/* 4. Picture-in-Picture (PiP) Local Webcam Preview */}
        <div className="absolute bottom-16 right-3.5 z-20 h-28 w-24 sm:h-32 sm:w-28 overflow-hidden rounded-xl border border-white/20 bg-black/70 shadow-lg backdrop-blur-sm">
          {localStream && !isCameraOff ? (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover scale-x-[-1]"
            />
          ) : (
            <div className="relative h-full w-full">
              <img
                src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80"
                alt="Local user preview"
                className="h-full w-full object-cover scale-x-[-1] filter brightness-90"
              />
            </div>
          )}
          {/* Local user label */}
          <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-medium text-white/90">
            <User size={10} />
            <span>You</span>
          </div>
        </div>

        {/* 5. Bottom Floating Call Controls */}
        <div className="absolute bottom-3 inset-x-0 z-20 flex items-center justify-center gap-3">
          {/* Mic Toggle Button */}
          <button
            type="button"
            onClick={onToggleMute}
            title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            className={`flex h-11 w-11 items-center justify-center rounded-full text-white shadow-md transition active:scale-95 ${
              isMuted
                ? 'bg-[#E23A3A] hover:bg-[#C92A2A]'
                : 'bg-black/70 hover:bg-black/90 backdrop-blur-md border border-white/15'
            }`}
          >
            {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
          </button>

          {/* Camera Toggle Button */}
          <button
            type="button"
            onClick={onToggleCamera}
            title={isCameraOff ? 'Turn on camera' : 'Turn off camera'}
            className={`flex h-11 w-11 items-center justify-center rounded-full text-white shadow-md transition active:scale-95 ${
              isCameraOff
                ? 'bg-[#E23A3A] hover:bg-[#C92A2A]'
                : 'bg-black/70 hover:bg-black/90 backdrop-blur-md border border-white/15'
            }`}
          >
            {isCameraOff ? <VideoOff size={18} /> : <Video size={18} />}
          </button>

          {/* Fullscreen Toggle Button */}
          <button
            type="button"
            onClick={handleToggleFullscreen}
            title="Toggle fullscreen"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-black/70 text-white shadow-md backdrop-blur-md border border-white/15 transition hover:bg-black/90 active:scale-95"
          >
            <Maximize2 size={18} />
          </button>

          {/* End Call Button */}
          <button
            type="button"
            onClick={onEndCall}
            title="End video call"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-[#E23A3A] text-white shadow-lg transition hover:bg-[#C92A2A] active:scale-95"
          >
            <PhoneOff size={18} />
          </button>
        </div>
      </div>
    </section>
  );
};
