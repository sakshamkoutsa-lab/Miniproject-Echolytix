import React from 'react';
import { History, CheckCircle2, Circle } from 'lucide-react';

export interface TimelineEvent {
  id: string;
  title: string;
  detail: string;
  time: string;
  completed: boolean;
}

interface EmergencyActivityTimelineProps {
  events: TimelineEvent[];
  isConnected?: boolean;
}

export const EmergencyActivityTimeline: React.FC<EmergencyActivityTimelineProps> = ({
  events,
  isConnected = true,
}) => {
  return (
    <div className="rounded-2xl border border-[#E8E8EB] bg-white p-5 sm:p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#F0F0F2] pb-4">
        <div className="flex items-center gap-2.5">
          <History size={19} strokeWidth={2.2} className="text-[#F4512A]" />
          <h3 className="text-base font-bold text-[#17213A]">
            Emergency Activity
          </h3>
        </div>

        <div className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-[#ECFDF5] px-2.5 py-1 text-xs font-semibold text-green-700">
          <span className="h-2 w-2 rounded-full bg-green-500"></span>
          <span>{isConnected ? 'Connected' : 'Offline'}</span>
        </div>
      </div>

      {/* Timeline Steps */}
      <div className="relative mt-5">
        {/* Continuous background vertical line */}
        <div className="absolute left-[11px] top-3 bottom-5 w-0.5 bg-[#F0F0F2]" aria-hidden="true" />

        <div className="space-y-6">
          {events.map((event, index) => {
            const isLast = index === events.length - 1;

            return (
              <div key={event.id} className="relative flex items-start gap-3.5">
                {/* Step indicator node */}
                <div className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white">
                  {event.completed ? (
                    <div className="h-4 w-4 rounded-full bg-[#E8173F] ring-4 ring-red-100 flex items-center justify-center">
                      <div className="h-1.5 w-1.5 rounded-full bg-white"></div>
                    </div>
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-[#D1D5DB] bg-white" />
                  )}
                </div>

                {/* Event info & timestamp */}
                <div className="flex flex-1 items-start justify-between gap-2 min-w-0">
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm ${
                        event.completed ? 'font-bold text-[#17213A]' : 'font-medium text-[#6B7280]'
                      }`}
                    >
                      {event.title}
                    </p>
                    <p
                      className={`text-xs mt-0.5 truncate ${
                        event.completed ? 'text-[#6B7280]' : 'text-[#9CA3AF]'
                      }`}
                    >
                      {event.detail}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 font-mono text-xs ${
                      event.completed ? 'text-[#6B7280]' : 'text-[#9CA3AF]'
                    }`}
                  >
                    {event.time}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
