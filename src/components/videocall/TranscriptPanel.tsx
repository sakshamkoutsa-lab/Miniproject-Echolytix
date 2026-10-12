import React, { useRef, useEffect } from 'react';
import { User, MessageSquare } from 'lucide-react';

export interface TranscriptMessage {
  id: string;
  sender_name: string;
  sender_role: 'local' | 'remote' | string;
  method: string;
  text: string;
  timestamp: string;
}

interface TranscriptPanelProps {
  messages: TranscriptMessage[];
}

export const TranscriptPanel: React.FC<TranscriptPanelProps> = ({ messages }) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <section className="flex flex-1 flex-col rounded-2xl border border-[#E8E8EB] bg-white p-4 shadow-[0_1px_3px_rgba(16,24,40,0.05)] sm:p-5">
      <header className="pb-2.5">
        <h3 className="text-sm font-bold text-[#202938]">Conversation Transcript</h3>
      </header>

      {/* Messages Scrollable Area */}
      <div
        ref={scrollRef}
        className="flex-1 space-y-3 overflow-y-auto pr-1 max-h-[190px] min-h-[140px]"
      >
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center py-6 text-center text-xs text-[#9CA3AF]">
            <MessageSquare size={20} className="mb-1 text-[#D1D5DB]" />
            <span>No conversation messages yet.</span>
          </div>
        ) : (
          messages.map((msg) => {
            const isLocal =
              msg.sender_role === 'local' ||
              msg.sender_name.toLowerCase().includes('you');

            return (
              <div key={msg.id} className="flex items-start gap-2.5 text-xs">
                {/* Avatar Icon */}
                <div
                  className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                    isLocal
                      ? 'bg-[#E9F7F0] text-[#16A36A]'
                      : 'bg-[#FFF1EC] text-[#F4512A]'
                  }`}
                >
                  <User size={14} strokeWidth={2.4} />
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#202938]">
                      {msg.sender_name} ({msg.method})
                    </span>
                    <span className="text-[10px] text-[#9CA3AF] font-medium">
                      {msg.timestamp}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[#4B5563] text-xs leading-relaxed">
                    {msg.text}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};
