import React from 'react';
import { Video, Settings as SettingsIcon, AlertCircle, Play, VideoOff } from 'lucide-react';

interface LiveCameraFeedProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  isCameraActive: boolean;
  isRecognitionActive: boolean;
  fps?: number;
  handDetected: boolean;
  onStartRecognition: () => void;
  onTurnOffCamera: () => void;
  onOpenSettings?: () => void;
  errorDetails?: string;
  modelStatus?: 'loading' | 'ready' | 'failed';
}

export const LiveCameraFeed: React.FC<LiveCameraFeedProps> = ({
  videoRef,
  canvasRef,
  isCameraActive,
  isRecognitionActive,
  fps = 30,
  handDetected,
  onStartRecognition,
  onTurnOffCamera,
  onOpenSettings,
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
                ? 'bg-[#E9F7F0] text-[#16A36A]'
                : isCameraActive && modelStatus === 'loading'
                ? 'bg-[#FEF3C7] text-[#D97706]'
                : 'bg-[#F3F4F6] text-[#6B7280]'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isCameraActive && modelStatus === 'ready'
                  ? 'bg-[#16A36A] animate-pulse'
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

        {/* Canvas for landmark drawing & hand skeleton */}
        <canvas
          ref={canvasRef}
          className={`pointer-events-none absolute inset-0 h-full w-full object-cover scale-x-[-1] z-10 ${
            isCameraActive ? 'block' : 'hidden'
          }`}
        />

        {/* Fallback placeholder when camera is paused */}
        {!isCameraActive && (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-center text-slate-400 p-4">
            <Video size={36} className="text-slate-500" />
            <span className="text-sm font-medium">Camera is currently turned off</span>
            <button
              type="button"
              onClick={onStartRecognition}
              className="mt-1 rounded-lg bg-[#F4512A] px-3.5 py-1.5 text-xs font-semibold text-white shadow transition hover:bg-[#E0441F]"
            >
              Start Camera & Recognition
            </button>
          </div>
        )}

        {/* Overlay indicators when active: FPS top-left, Settings top-right */}
        {isCameraActive && (
          <>
            {/* FPS Badge */}
            <div className="absolute left-3 top-3 z-20 flex items-center gap-1.5 rounded-md bg-black/60 px-2.5 py-1 text-[11px] font-mono font-medium text-white/90 backdrop-blur-sm">
              <svg width="13" height="11" viewBox="0 0 14 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-white/85">
                <polyline points="1 9 4 5 7 8 11 2 13 4" />
              </svg>
              <span>FPS: {fps}</span>
            </div>

            {/* Settings Button */}
            {onOpenSettings && (
              <button
                type="button"
                onClick={onOpenSettings}
                title="Camera & Recognition Settings"
                className="absolute right-3 top-3 z-20 flex h-7 w-7 items-center justify-center rounded-md bg-black/60 text-white/90 backdrop-blur-sm transition hover:bg-black/80"
              >
                <SettingsIcon size={14} />
              </button>
            )}

            {/* Central Orange Rectangular Hand-Detection Boundary */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-20">
              <div className="relative flex h-[160px] w-[180px] sm:h-[185px] sm:w-[210px] items-center justify-center rounded-lg border border-dashed border-[#F4512A]/50 bg-[#F4512A]/5 p-2 backdrop-blur-[1px]">
                {/* 4 Corner viewfinder brackets matching reference screenshot */}
                <div className="absolute -top-1 -left-1 h-3.5 w-3.5 border-t-2 border-l-2 border-[#F4512A]" />
                <div className="absolute -top-1 -right-1 h-3.5 w-3.5 border-t-2 border-r-2 border-[#F4512A]" />
                <div className="absolute -bottom-1 -left-1 h-3.5 w-3.5 border-b-2 border-l-2 border-[#F4512A]" />
                <div className="absolute -bottom-1 -right-1 h-3.5 w-3.5 border-b-2 border-r-2 border-[#F4512A]" />

                {/* Visual schematic Hand skeleton guide inside boundary (when no real hand is detected) */}
                {!handDetected && (
                  <div className="flex flex-col items-center justify-center opacity-85">
                    <svg
                      width="100"
                      height="120"
                      viewBox="0 0 100 120"
                      fill="none"
                      stroke="white"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="drop-shadow-md"
                    >
                      {/* Palm lines */}
                      <path d="M35 110 L35 75 L65 75 L65 110 Z" stroke="rgba(255,255,255,0.7)" />
                      {/* Thumb */}
                      <path d="M35 85 L18 70 L22 55" stroke="rgba(255,255,255,0.7)" />
                      {/* Index */}
                      <path d="M38 75 L38 45 L38 25" stroke="rgba(255,255,255,0.7)" />
                      {/* Middle */}
                      <path d="M48 75 L48 40 L48 18" stroke="rgba(255,255,255,0.7)" />
                      {/* Ring */}
                      <path d="M58 75 L58 45 L58 25" stroke="rgba(255,255,255,0.7)" />
                      {/* Pinky */}
                      <path d="M65 80 L75 58 L78 38" stroke="rgba(255,255,255,0.7)" />
                      {/* Joint nodes */}
                      <circle cx="35" cy="110" r="3.5" fill="white" />
                      <circle cx="65" cy="110" r="3.5" fill="white" />
                      <circle cx="18" cy="70" r="3" fill="white" />
                      <circle cx="22" cy="55" r="3.5" fill="white" />
                      <circle cx="38" cy="45" r="3" fill="white" />
                      <circle cx="38" cy="25" r="3.5" fill="white" />
                      <circle cx="48" cy="40" r="3" fill="white" />
                      <circle cx="48" cy="18" r="3.5" fill="white" />
                      <circle cx="58" cy="45" r="3" fill="white" />
                      <circle cx="58" cy="25" r="3.5" fill="white" />
                      <circle cx="75" cy="58" r="3" fill="white" />
                      <circle cx="78" cy="38" r="3.5" fill="white" />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {/* Helper message at the bottom-left */}
            <div className="absolute bottom-3 left-3 z-20 rounded-md bg-black/70 px-2.5 py-1 text-xs text-white/90 backdrop-blur-sm">
              Show your hand inside the frame
            </div>
          </>
        )}

        {/* Error overlay */}
        {modelStatus === 'failed' && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/85 p-4 text-center text-white">
            <AlertCircle size={32} className="mb-2 text-[#E23A3A]" />
            <span className="text-sm font-semibold text-[#E23A3A]">Camera / Vision Error</span>
            <p className="mt-1 max-w-xs text-xs text-slate-300">
              {errorDetails || 'Unable to access webcam or initialize HandLandmarker model.'}
            </p>
            <button
              type="button"
              onClick={onStartRecognition}
              className="mt-3 rounded-lg bg-[#F4512A] px-3 py-1.5 text-xs font-semibold text-white"
            >
              Retry
            </button>
          </div>
        )}
      </div>

      {/* Two Action Buttons below preview matching screenshot */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        {/* Button 1: Start Recognition (Solid Orange with Play icon) */}
        <button
          type="button"
          onClick={onStartRecognition}
          className="group flex items-center justify-center gap-2 rounded-xl bg-[#F4512A] py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#E0441F] active:scale-95"
        >
          <Play size={18} strokeWidth={2.4} fill="currentColor" />
          <span>Start Recognition</span>
        </button>

        {/* Button 2: Turn off Camera (White with Orange border and Camera-off icon) */}
        <button
          type="button"
          onClick={onTurnOffCamera}
          className="group flex items-center justify-center gap-2 rounded-xl border border-[#F4512A] bg-white py-3 text-sm font-semibold text-[#F4512A] shadow-sm transition hover:bg-[#FFF8F5] active:scale-95"
        >
          <VideoOff size={18} strokeWidth={2.2} />
          <span>Turn off Camera</span>
        </button>
      </div>
    </section>
  );
};
