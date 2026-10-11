import React, { useEffect, useState } from 'react';
import { CalendarDays } from 'lucide-react';

/** Live date/time card. Pass `date` to pin a fixed value (e.g. for screenshots). */
export const DateCard: React.FC<{ date?: Date }> = ({ date }) => {
  const [now, setNow] = useState<Date>(() => date ?? new Date());

  useEffect(() => {
    if (date) return;
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, [date]);

  const dayLabel = now.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).replace(/^(\w+)\s/, '$1, ');
  const timeLabel = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex items-center gap-3.5 rounded-xl border border-[#E8E8EB] bg-white px-4 py-3 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <CalendarDays size={20} strokeWidth={1.8} className="text-[#3A4256]" />
      <div className="leading-tight">
        <div className="text-sm font-medium text-[#17213A]">{dayLabel}</div>
        <time className="text-xs text-[#6B7280]" dateTime={now.toISOString()}>{timeLabel}</time>
      </div>
    </div>
  );
};

interface WelcomeSectionProps {
  firstName: string;
  date?: Date;
}

export const WelcomeSection: React.FC<WelcomeSectionProps> = ({ firstName, date }) => (
  <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <h1 className="text-[26px] font-bold tracking-tight text-[#17213A] sm:text-[30px]">
        Welcome back, {firstName}! <span aria-hidden="true">👋</span>
      </h1>
      <p className="mt-1 text-[15px] text-[#6B7280]">Here's what's happening with your EchoLytix today.</p>
    </div>
    <DateCard date={date} />
  </section>
);
