'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, ChevronRight, BookOpen } from 'lucide-react';
import type { BookSchedule, Book } from '@/types';

type UpcomingSchedule = BookSchedule & { book: Book };

interface Props {
  schedule: UpcomingSchedule | null;
}

export default function UpcomingBookBanner({ schedule }: Props) {
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null);

  useEffect(() => {
    if (!schedule) return;

    // We assume the scheduled date is for the start of the day in local time.
    // So we just parse it as a local date at 00:00.
    const targetDate = new Date(schedule.scheduled_for); 
    // Usually "YYYY-MM-DD" parses as UTC. To make it strictly "start of the day local",
    // we can parse the components. But simple parsing is usually enough if it's meant to be just the "day".
    // Let's ensure it targets midnight of that day in user's timezone:
    const [y, m, d] = schedule.scheduled_for.split('-');
    const localTarget = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));

    const updateTimer = () => {
      const now = new Date();
      const diff = localTarget.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft({ d: 0, h: 0, m: 0, s: 0 });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      
      setTimeLeft({ d: days, h: hours, m: minutes, s: seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [schedule]);

  if (!schedule || !schedule.book) return null;

  const isTime = timeLeft && timeLeft.d === 0 && timeLeft.h === 0 && timeLeft.m === 0 && timeLeft.s === 0;

  return (
    <div className="w-full relative overflow-hidden rounded-2xl border shadow-sm mb-6 md:mb-8 transition-all group"
         style={{ backgroundColor: 'var(--bg-card,#fff)', borderColor: 'var(--border)' }}>
      
      {/* Background visual flair */}
      <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-10 pointer-events-none translate-x-1/2 -translate-y-1/2"
           style={{ backgroundColor: '#8B6914' }} />

      <div className="flex flex-col md:flex-row items-center p-5 md:p-6 gap-6 relative z-10">
        
        {/* Left: Book Cover */}
        <div className="w-24 md:w-28 flex-shrink-0 aspect-[2/3] bg-[#E5E0D8] rounded-lg shadow-sm flex items-center justify-center overflow-hidden">
          {schedule.book.cover_url ? (
            <img src={schedule.book.cover_url} alt={schedule.book.title} className="w-full h-full object-cover" />
          ) : (
            <BookOpen className="w-8 h-8 opacity-25" style={{ color: 'var(--text-secondary)' }} />
          )}
        </div>

        {/* Center: Info & Countdown */}
        <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left">
          <div className="flex items-center gap-1.5 mb-2 px-2.5 py-1 rounded-full border text-xs font-medium"
               style={{ backgroundColor: '#8B691410', color: '#8B6914', borderColor: '#8B691430' }}>
             <Calendar className="w-3.5 h-3.5" />
             Upcoming Read
          </div>
          <h3 className="font-semibold text-lg md:text-xl leading-snug mb-1" style={{ color: 'var(--text-primary)', fontFamily: 'Lora, Georgia, serif' }}>
            {schedule.book.title}
          </h3>
          <p className="text-sm mb-4 md:mb-5" style={{ color: 'var(--text-secondary)' }}>
            {schedule.book.author}
          </p>

          {/* Countdown Clock */}
          {timeLeft && (
            <div className="flex items-center gap-2 md:gap-3">
              {isTime ? (
                <div className="px-4 py-2 rounded-lg font-semibold text-white tracking-wide uppercase animate-pulse"
                     style={{ backgroundColor: '#8B6914' }}>
                  It's Time To Read!
                </div>
              ) : (
                <>
                  <TimeBlock value={timeLeft.d} label="Days" />
                  <span className="font-bold opacity-30 text-lg" style={{ color: 'var(--text-primary)' }}>:</span>
                  <TimeBlock value={timeLeft.h} label="Hrs" />
                  <span className="font-bold opacity-30 text-lg" style={{ color: 'var(--text-primary)' }}>:</span>
                  <TimeBlock value={timeLeft.m} label="Mins" />
                  <span className="font-bold opacity-30 text-lg" style={{ color: 'var(--text-primary)' }}>:</span>
                  <TimeBlock value={timeLeft.s} label="Secs" />
                </>
              )}
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div className="w-full md:w-auto flex flex-col gap-2 mt-4 md:mt-0">
          <Link href={`/read/${schedule.book.id}`}
                className="flex items-center justify-center gap-1.5 px-6 py-3 md:py-2.5 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90 shadow-soft"
                style={{ backgroundColor: '#8B6914' }}>
            {isTime ? 'Start Reading' : 'Start Early'}
            <ChevronRight className="w-4 h-4" />
          </Link>
          <Link href={`/library`}
                className="flex items-center justify-center px-6 py-2.5 rounded-xl text-xs font-medium transition-colors hover:bg-[var(--border)] border"
                style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
            Manage in Library
          </Link>
        </div>
        
      </div>
    </div>
  );
}

function TimeBlock({ value, label }: { value: number; label: string }) {
  const padded = value.toString().padStart(2, '0');
  return (
    <div className="flex flex-col items-center justify-center w-12 md:w-14">
      <div className="w-full aspect-square flex items-center justify-center rounded-lg border bg-white/50 backdrop-blur"
           style={{ backgroundColor: 'var(--bg-card,#fff)', borderColor: 'var(--border)' }}>
        <span className="text-xl md:text-2xl font-semibold tabular-nums" style={{ color: '#8B6914' }}>
          {padded}
        </span>
      </div>
      <span className="text-[10px] uppercase tracking-wider mt-1.5 font-medium" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </span>
    </div>
  );
}
