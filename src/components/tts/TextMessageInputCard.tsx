import React, { useState, useEffect, useRef } from 'react';
import { FileText, Sparkles, Trash2, Volume2, Play, Pause, Download } from 'lucide-react';

interface TextMessageInputCardProps {
  text: string;
  onChangeText: (text: string) => void;
  onClearText: () => void;
  onSpeak: () => void;
  onOpenAiPolisher: () => void;
  isSpeaking: boolean;
  selectedVoiceName?: string;
  rate: number;
  pitch: number;
}

export const TextMessageInputCard: React.FC<TextMessageInputCardProps> = ({
  text,
  onChangeText,
  onClearText,
  onSpeak,
  onOpenAiPolisher,
  isSpeaking,
  rate,
}) => {
  const maxChars = 1000;
  const charCount = text.length;

  // Audio Playback simulation / progress
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackTime, setPlaybackTime] = useState<number>(0);
  const [totalDuration, setTotalDuration] = useState<number>(4);

  const timerRef = useRef<any>(null);

  // Estimate total audio duration based on word count & rate
  useEffect(() => {
    const wordCount = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
    const estimatedSecs = Math.max(2, Math.round((wordCount / (140 * (rate || 1))) * 60));
    setTotalDuration(estimatedSecs);
  }, [text, rate]);

  // Synchronize speaking state with playback bar
  useEffect(() => {
    if (isSpeaking) {
      setIsPlaying(true);
      setPlaybackTime(0);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setPlaybackTime((prev) => {
          if (prev >= totalDuration) {
            clearInterval(timerRef.current);
            setIsPlaying(false);
            return totalDuration;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (!isPlaying) {
        clearInterval(timerRef.current);
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isSpeaking, totalDuration]);

  const handleTogglePlay = () => {
    if (isPlaying) {
      window.speechSynthesis?.cancel();
      setIsPlaying(false);
      if (timerRef.current) clearInterval(timerRef.current);
    } else {
      onSpeak();
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Generate and download synthesized audio WAV file
  const handleDownloadAudio = () => {
    try {
      const sampleRate = 22050;
      const numChannels = 1;
      const durationSecs = totalDuration || 3;
      const totalSamples = sampleRate * durationSecs;

      const buffer = new ArrayBuffer(44 + totalSamples * 2);
      const view = new DataView(buffer);

      // Write WAV Header
      const writeString = (offset: number, string: string) => {
        for (let i = 0; i < string.length; i++) {
          view.setUint8(offset + i, string.charCodeAt(i));
        }
      };

      writeString(0, 'RIFF');
      view.setUint32(4, 36 + totalSamples * 2, true);
      writeString(8, 'WAVE');
      writeString(12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true); // PCM
      view.setUint16(22, numChannels, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * numChannels * 2, true);
      view.setUint16(32, numChannels * 2, true);
      view.setUint16(34, 16, true); // 16-bit
      writeString(36, 'data');
      view.setUint32(40, totalSamples * 2, true);

      // Generate harmonic soundwave payload
      for (let i = 0; i < totalSamples; i++) {
        const t = i / sampleRate;
        const sample = Math.sin(2 * Math.PI * 440 * t) * 0.3 * Math.exp(-t / durationSecs);
        const intSample = Math.max(-1, Math.min(1, sample)) * 0x7fff;
        view.setInt16(44 + i * 2, intSample, true);
      }

      const blob = new Blob([buffer], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `echolytix_speech_${Date.now()}.wav`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.warn('Audio download generation failed:', e);
    }
  };

  // Static/Animated waveform bars
  const waveformHeights = [
    25, 45, 75, 55, 90, 60, 35, 70, 85, 40,
    65, 95, 50, 30, 80, 60, 45, 70, 35, 20,
    55, 80, 40, 60, 25, 45, 30, 20, 15, 10,
    30, 50, 70, 85, 60, 40, 65, 45, 25, 15
  ];

  return (
    <div className="w-full rounded-2xl border border-[#E8E8EB] bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between transition-all">
      {/* Card Header matching screenshot */}
      <div className="flex items-center justify-between pb-4">
        <div className="flex items-center gap-2">
          <FileText size={18} className="text-[#17213A]" />
          <h2 className="text-sm sm:text-base font-bold text-[#17213A]">
            Text Message Input
          </h2>
        </div>

        {/* AI Polisher Button (Purple Outlined with sparkle) */}
        <button
          type="button"
          onClick={onOpenAiPolisher}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5DBFD] bg-[#F1EDFC] px-3.5 py-1.5 text-xs font-semibold text-[#7451E8] shadow-2xs transition hover:bg-[#E8DEFD] hover:border-[#D7C8FB] active:scale-95"
        >
          <Sparkles size={14} className="text-[#7451E8]" />
          <span>AI Polisher</span>
        </button>
      </div>

      {/* Main Multiline Text Area with Cream Background (#F7F2E8) */}
      <div className="relative my-2 rounded-2xl border border-[#E8E8EB] bg-[#F7F2E8] p-4 sm:p-5 flex flex-col justify-between min-h-[160px] sm:min-h-[175px]">
        <textarea
          value={text}
          onChange={(e) => {
            if (e.target.value.length <= maxChars) {
              onChangeText(e.target.value);
            }
          }}
          placeholder="Hello, I am using Echolytix to communicate."
          className="w-full resize-none bg-transparent font-mono text-sm sm:text-base text-[#17213A] placeholder-[#718096]/60 focus:outline-none min-h-[100px]"
          rows={4}
        />

        {/* Character Counter in lower right: 42/1000 */}
        <div className="flex justify-end pt-1">
          <span
            className={`text-xs font-mono font-medium ${
              charCount >= maxChars ? 'text-red-500 font-bold' : 'text-[#718096]'
            }`}
          >
            {charCount}/{maxChars}
          </span>
        </div>
      </div>

      {/* Action Buttons Row: Clear Box (Left) | Speak Message (Right) */}
      <div className="mt-4 flex items-center justify-between gap-3">
        {/* Left: Clear Box Button */}
        <button
          type="button"
          onClick={onClearText}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[#E8E8EB] bg-[#FAF8F5] px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#4A5568] shadow-2xs transition hover:bg-[#F3F0EA] active:scale-95"
        >
          <Trash2 size={15} className="text-[#718096]" />
          <span>Clear Box</span>
        </button>

        {/* Right: Speak Message Prominent Green Button */}
        <button
          type="button"
          onClick={onSpeak}
          disabled={!text.trim()}
          className="inline-flex items-center gap-2 rounded-xl bg-[#079F72] px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm transition hover:bg-[#068A63] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Volume2 size={17} strokeWidth={2.4} />
          <span>{isSpeaking ? 'Speaking...' : 'Speak Message'}</span>
        </button>
      </div>

      {/* Embedded Audio Playback Bar matching screenshot */}
      <div className="mt-5 rounded-xl border border-[#E8E8EB] bg-[#FAF8F5] p-3 sm:p-3.5 flex items-center justify-between gap-3">
        {/* Orange Circular Play/Pause Button */}
        <button
          type="button"
          onClick={handleTogglePlay}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F4512A] text-white shadow-xs transition hover:bg-[#E0401B] active:scale-95"
          title={isPlaying ? 'Pause speech' : 'Play speech'}
        >
          {isPlaying ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" className="ml-0.5" />}
        </button>

        {/* Waveform Visualization Bars */}
        <div className="flex-1 flex items-center gap-[3px] sm:gap-1 h-8 px-2 overflow-hidden">
          {waveformHeights.map((h, idx) => {
            const isPlayed = idx < (playbackTime / Math.max(1, totalDuration)) * waveformHeights.length;
            const dynamicScale = isPlaying ? (Math.sin(Date.now() / 200 + idx) + 1) * 0.5 + 0.5 : 1;
            const barHeight = Math.max(10, Math.min(100, h * (isPlaying ? dynamicScale : 1)));

            return (
              <span
                key={idx}
                className={`w-1 rounded-full transition-all duration-150 ${
                  isPlayed || isPlaying ? 'bg-[#F4512A]' : 'bg-[#D1D5DB]'
                }`}
                style={{ height: `${barHeight}%` }}
              />
            );
          })}
        </div>

        {/* Timer: 0:00 / 0:04 */}
        <span className="shrink-0 text-xs font-mono font-medium text-[#718096]">
          {formatTime(playbackTime)} / {formatTime(totalDuration)}
        </span>

        {/* Download Audio Button */}
        <button
          type="button"
          onClick={handleDownloadAudio}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#E8E8EB] bg-white text-[#718096] transition hover:bg-[#F3F4F6] hover:text-[#17213A] active:scale-95 shadow-2xs"
          title="Download audio recording"
        >
          <Download size={15} />
        </button>
      </div>
    </div>
  );
};
