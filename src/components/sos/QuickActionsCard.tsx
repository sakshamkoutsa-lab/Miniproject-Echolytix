import React from 'react';
import { Zap, Send, Users, Settings, ChevronRight, Lightbulb } from 'lucide-react';

interface QuickActionsCardProps {
  onOpenTestBroadcast: () => void;
  onOpenManageCaretakers: () => void;
  onOpenSosSettings: () => void;
}

export const QuickActionsCard: React.FC<QuickActionsCardProps> = ({
  onOpenTestBroadcast,
  onOpenManageCaretakers,
  onOpenSosSettings,
}) => {
  return (
    <div className="space-y-4">
      {/* Quick Actions Card */}
      <div className="rounded-2xl border border-[#E8E8EB] bg-white p-5 sm:p-6 shadow-sm">
        {/* Header */}
        <div className="flex items-center gap-2.5 pb-4 border-b border-[#F0F0F2]">
          <Zap size={18} strokeWidth={2.2} className="text-[#F4512A]" />
          <h3 className="text-sm sm:text-base font-bold text-[#17213A]">
            Quick Actions
          </h3>
        </div>

        {/* List of actions */}
        <div className="mt-2 divide-y divide-[#F5F5F7]">
          {/* Action 1: Test Broadcast */}
          <button
            type="button"
            onClick={onOpenTestBroadcast}
            className="group flex w-full items-center justify-between gap-3 py-3.5 text-left transition-colors hover:bg-[#FBFBFC] -mx-2 px-2 rounded-xl"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FFF1EC] text-[#F4512A] transition-transform group-hover:scale-105">
                <Send size={16} strokeWidth={2.2} />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#17213A] group-hover:text-[#F4512A] transition-colors">
                  Test Broadcast
                </p>
                <p className="text-xs text-[#6B7280]">
                  Send a test message to caretaker
                </p>
              </div>
            </div>
            <ChevronRight size={16} className="text-[#9CA3AF] group-hover:text-[#17213A] transition-transform group-hover:translate-x-0.5" />
          </button>

          {/* Action 2: Manage Caretakers */}
          <button
            type="button"
            onClick={onOpenManageCaretakers}
            className="group flex w-full items-center justify-between gap-3 py-3.5 text-left transition-colors hover:bg-[#FBFBFC] -mx-2 px-2 rounded-xl"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FFF1EC] text-[#F4512A] transition-transform group-hover:scale-105">
                <Users size={16} strokeWidth={2.2} />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#17213A] group-hover:text-[#F4512A] transition-colors">
                  Manage Caretakers
                </p>
                <p className="text-xs text-[#6B7280]">
                  Add or update emergency contacts
                </p>
              </div>
            </div>
            <ChevronRight size={16} className="text-[#9CA3AF] group-hover:text-[#17213A] transition-transform group-hover:translate-x-0.5" />
          </button>

          {/* Action 3: SOS Settings */}
          <button
            type="button"
            onClick={onOpenSosSettings}
            className="group flex w-full items-center justify-between gap-3 py-3.5 text-left transition-colors hover:bg-[#FBFBFC] -mx-2 px-2 rounded-xl"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FFF1EC] text-[#F4512A] transition-transform group-hover:scale-105">
                <Settings size={16} strokeWidth={2.2} />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#17213A] group-hover:text-[#F4512A] transition-colors">
                  SOS Settings
                </p>
                <p className="text-xs text-[#6B7280]">
                  Customize message and preferences
                </p>
              </div>
            </div>
            <ChevronRight size={16} className="text-[#9CA3AF] group-hover:text-[#17213A] transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>

      {/* Tip Card matching reference */}
      <div className="flex items-start gap-3 rounded-2xl border border-[#FED7D7] bg-[#FFF0F2] p-4 text-xs shadow-sm">
        <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center text-[#E8173F]">
          <Lightbulb size={20} strokeWidth={2.2} />
        </div>
        <div>
          <h4 className="font-bold uppercase tracking-wider text-[#E8173F]">
            Tip
          </h4>
          <p className="mt-0.5 leading-relaxed text-[#4B5563]">
            Keep your caretaker's number updated to ensure quick assistance during emergencies.
          </p>
        </div>
      </div>
    </div>
  );
};
