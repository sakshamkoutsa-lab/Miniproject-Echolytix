import React from 'react';
import { Video, Settings as SettingsIcon, AlertCircle, Eye } from 'lucide-react';

interface LiveCameraFeedProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  isCameraActive: boolean;
  fps?: number;
  faceDetected: boolean;
  leftEyeOpen: boolean;
  rightEyeOpen: boolean;
  onToggleCamera: () => void;
  onOpenSettings?: () => void;
  onLeftEyeClick?: () => void;
  onRightEyeClick?: () => void;
  errorDetails?: string;
  modelStatus?: 'loading' | 'ready' | 'failed';
}

export const LiveCameraFeed: React.FC<LiveCameraFeedProps> = ({
  videoRef,
  canvasRef,
  isCameraActive,
  fps = 30,
  faceDetected,
  leftEyeOpen,
  rightEyeOpen,
  onToggleCamera,
  onOpenSettings,
  onLeftEyeClick,
  onRightEyeClick,
  errorDetails,
  modelStatus = 'ready',
}) => {
  return (
    <section className="flex flex-col rounded-2xl border border-[#E8E8EB] bg-white p-5 shadow-[0_1px_3px_rgba(16,24,40,0.05)] sm:p-6">
      {/* Header */}
      <header className="flex items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FFF1EC] text-[#F4512A]">
            <Video size={18} strokeWidth={2.2} />
          </div>
          <h2 className="text-[17px] font-semibold text-[#17213A]">Live Camera Feed</h2>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2">
          <span
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
              isCameraActive && modelStatus === 'ready'
                ? 'bg-[#E9F7F0] text-[#10B981]'
                : isCameraActive && modelStatus === 'loading'
                ? 'bg-[#FEF3C7] text-[#D97706]'
                : 'bg-[#F3F4F6] text-[#6B7280]'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isCameraActive && modelStatus === 'ready'
                  ? 'bg-[#10B981] animate-pulse'
                  : isCameraActive && modelStatus === 'loading'
                  ? 'bg-[#D97706] animate-ping'
                  : 'bg-[#9CA3AF]'
              }`}
            />
            {isCameraActive
              ? modelStatus === 'loading'
                ? 'AI Loading...'
                : 'Camera Active'
              : 'Camera Inactive'}
          </span>
        </div>
      </header>

      {/* Viewport Area */}
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-[#1E232A] shadow-inner">
        {/* Real Video Element */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`h-full w-full object-cover scale-x-[-1] ${
            isCameraActive ? 'block' : 'hidden'
          }`}
        />

        {/* Canvas for landmark drawing & eye contours */}
        <canvas
          ref={canvasRef}
          className={`pointer-events-none absolute inset-0 h-full w-full object-cover scale-x-[-1] z-10 ${
            isCameraActive ? 'block' : 'hidden'
          }`}
        />

        {/* Fallback placeholder when camera is not running */}
        {!isCameraActive && (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-center text-slate-400 p-4">
            <Video size={36} className="text-slate-500" />
            <span className="text-sm font-medium">Camera is currently paused</span>
            <button
              type="button"
              onClick={onToggleCamera}
              className="mt-1 rounded-lg bg-[#F4512A] px-3.5 py-1.5 text-xs font-semibold text-white shadow transition hover:bg-[#E0441F]"
            >
              Start Camera
            </button>
          </div>
        )}

        {/* Camera overlay indicators: FPS top-left, Settings top-right */}
        {isCameraActive && (
          <>
            {/* FPS Badge */}
            <div className="absolute left-3 top-3 z-20 flex items-center gap-1.5 rounded-md bg-black/60 px-2 py-1 text-[11px] font-mono font-medium text-white/90 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>FPS: {fps}</span>
            </div>

            {/* Settings Button */}
            {onOpenSettings && (
              <button
                type="button"
                onClick={onOpenSettings}
                title="Camera & Eye Tracking Settings"
                className="absolute right-3 top-3 z-20 flex h-7 w-7 items-center justify-center rounded-md bg-black/60 text-white/90 backdrop-blur-sm transition hover:bg-black/80"
              >
                <SettingsIcon size={14} />
              </button>
            )}

            {/* Central Eye-Detection Target Region */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-20">
              <div className="relative flex h-[110px] w-[240px] sm:h-[130px] sm:w-[280px] items-center justify-around rounded-xl border-2 border-dashed border-[#F4512A] bg-[#F4512A]/10 p-2 backdrop-blur-[1px]">
                {/* Left eye target with corner markers */}
                <div className="relative flex flex-col items-center justify-center">
                  <div className="absolute -inset-2.5 rounded-lg border-2 border-white/60" style={{ borderStyle: 'solid', clipPath: 'polygon(0% 0%, 25% 0%, 25% 100%, 0% 100%, 0% 0%, 75% 0%, 100% 0%, 100% 25%, 100% 75%, 100% 100%, 75% 100%, 75% 0%)' }} />
                  {/* Open Eye Icon SVG with eyelashes / pupil */}
                  <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-md">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3.5" fill="white" />
                  </svg>
                </div>

                {/* Right eye (Winking / closed eye with eyelashes) */}
                <div className="relative flex flex-col items-center justify-center">
                  {/* Closed eye with eyelashes curved downward */}
                  <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-md">
                    <path d="M4 11c2.5 3.5 7.5 5 16 0" />
                    <line x1="6" y1="13.5" x2="4.5" y2="16.5" />
                    <line x1="10" y1="14.8" x2="9.5" y2="18" />
                    <line x1="14" y1="14.8" x2="14.5" y2="18" />
                    <line x1="18" y1="13.5" x2="19.5" y2="16.5" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Helper message at the bottom-left */}
            <div className="absolute bottom-3 left-3 z-20 rounded-md bg-black/70 px-2.5 py-1 text-xs text-white/90 backdrop-blur-sm">
              Position your eyes within the frame
            </div>
          </>
        )}

        {/* Error overlay */}
        {modelStatus === 'failed' && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/85 p-4 text-center text-white">
            <AlertCircle size={32} className="mb-2 text-[#E23A3A]" />
            <span className="text-sm font-semibold text-[#E23A3A]">Camera / Vision Error</span>
            <p className="mt-1 max-w-xs text-xs text-slate-300">
              {errorDetails || 'Unable to access webcam or initialize vision model.'}
            </p>
            <button
              type="button"
              onClick={onToggleCamera}
              className="mt-3 rounded-lg bg-[#F4512A] px-3 py-1.5 text-xs font-semibold text-white"
            >
              Retry
            </button>
          </div>
        )}
      </div>

      {/* Two Action Buttons below preview */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        {/* Left Eye: Select (Solid Orange) */}
        <button
          type="button"
          onClick={onLeftEyeClick}
          className="group flex items-center justify-center gap-2 rounded-xl bg-[#F4512A] py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#E0441F] active:scale-95"
        >
          <Eye size={18} strokeWidth={2.2} />
          <span>Left Eye: Select</span>
        </button>

        {/* Right Eye: Type (Outlined Orange) */}
        <button
          type="button"
          onClick={onRightEyeClick}
          className="group flex items-center justify-center gap-2 rounded-xl border border-[#F4512A] bg-white py-3 text-sm font-semibold text-[#F4512A] shadow-sm transition hover:bg-[#FFF8F5] active:scale-95"
        >
          <Eye size={18} strokeWidth={2.2} />
          <span>Right Eye: Type</span>
        </button>
      </div>
    </section>
  );
};
