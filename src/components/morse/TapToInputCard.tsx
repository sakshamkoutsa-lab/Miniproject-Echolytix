import React, { useRef } from 'react';

interface TapToInputCardProps {
  isPressing: boolean;
  currentSequence: string;
  onPressStart: (e: React.PointerEvent | React.MouseEvent | React.TouchEvent) => void;
  onPressEnd: (e?: React.PointerEvent | React.MouseEvent | React.TouchEvent) => void;
}

export const TapToInputCard: React.FC<TapToInputCardProps> = ({
  isPressing,
  currentSequence,
  onPressStart,
  onPressEnd,
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="w-full rounded-2xl border border-[#E8E8EB] bg-white p-6 sm:p-8 shadow-xs flex flex-col items-center justify-center text-center transition-all min-h-[300px]">
      {/* Centered Circular Tap Button */}
      <div className="relative flex items-center justify-center my-3">
        {/* Soft Purple Glow matching reference screenshot */}
        <div
          className={`absolute h-40 w-40 rounded-full transition-all duration-300 pointer-events-none ${
            isPressing
              ? 'bg-[#7251E8]/35 blur-xl scale-110'
              : 'bg-[#7251E8]/15 blur-2xl scale-100'
          }`}
        />

        {/* Circular Tap Button */}
        <button
          ref={buttonRef}
          type="button"
          onPointerDown={onPressStart}
          onPointerUp={onPressEnd}
          onPointerCancel={onPressEnd}
          onPointerLeave={(e) => {
            if (isPressing) onPressEnd(e);
          }}
          className={`relative z-10 flex h-28 w-28 sm:h-32 sm:w-32 items-center justify-center rounded-full bg-white transition-all select-none touch-none cursor-pointer outline-none ${
            isPressing
              ? 'scale-95 shadow-inner'
              : 'shadow-md hover:scale-[1.02] active:scale-95'
          }`}
          style={{
            touchAction: 'none',
            userSelect: 'none',
            WebkitUserSelect: 'none',
          }}
          aria-label="Tap to input Morse code"
        >
          {/* Outer Concentric Green Ring */}
          <div
            className={`flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-full border-2 transition-all ${
              isPressing
                ? 'border-[#159B68] bg-[#F0FDF4]'
                : 'border-[#159B68]/80 bg-white'
            }`}
          >
            {/* Center Bullseye / Target Icon matching screenshot */}
            <div className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#159B68]">
              <div
                className={`h-4 w-4 rounded-full transition-all ${
                  isPressing
                    ? 'bg-[#159B68] scale-125'
                    : 'bg-[#159B68]'
                }`}
              />
            </div>
          </div>
        </button>
      </div>

      {/* Button Title */}
      <h3 className="mt-4 text-base sm:text-lg font-bold text-[#17213A] tracking-tight">
        Tap to Input
      </h3>

      {/* Instruction */}
      <p className="mt-1 text-xs sm:text-sm text-[#718096]">
        Short tap for <span className="font-bold text-[#159B68]">dot (•)</span> · Long press for{' '}
        <span className="font-bold text-[#159B68]">dash (—)</span>
      </p>

      {/* Real-time Buffered Sequence Display */}
      {currentSequence ? (
        <div className="mt-4 flex items-center gap-1.5 rounded-full bg-[#FAF8F5] px-4 py-1.5 border border-[#E8E8EB]">
          <span className="text-xs text-[#718096] font-mono">Buffer:</span>
          <span className="text-sm font-extrabold tracking-widest text-[#159B68] font-mono">
            {currentSequence}
          </span>
        </div>
      ) : (
        <div className="mt-4 h-7" />
      )}
    </div>
  );
};
