'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, SlidersHorizontal, Trophy, Book, Timer, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useReaderStore } from '@/lib/store';
import type { Book as BookType, ReadingTheme, ReadingFontFamily } from '@/types';
import { cn } from '@/lib/utils';

interface Props {
  book: BookType;
  chapterTitle: string;
  progressPercent: number;
  sessionSeconds: number;
  onQuiz: () => void;
}

const THEMES: { id: ReadingTheme; label: string; bg: string }[] = [
  { id: 'light', label: 'Light', bg: '#FAF8F4' },
  { id: 'sepia', label: 'Sepia', bg: '#F5EDD6' },
  { id: 'dark', label: 'Dark', bg: '#1A1A1A' },
  { id: 'dark-sepia', label: 'Dark Sepia', bg: '#433B30' },
];

const FONTS: { id: ReadingFontFamily; label: string; style: React.CSSProperties }[] = [
  { id: 'default', label: 'Default', style: { fontFamily: "'Lora', Georgia, serif" } },
  { id: 'inter', label: 'Inter', style: { fontFamily: "'Inter', system-ui, sans-serif" } },
  { id: 'merriweather', label: 'Merri', style: { fontFamily: "'Merriweather', serif" } },
  { id: 'comic-sans', label: 'Comic', style: { fontFamily: "'Comic Sans MS', 'Chalkboard SE', sans-serif" } },
  { id: 'arial', label: 'Arial', style: { fontFamily: "Arial, sans-serif" } },
];

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function ReaderTopBar({ book, chapterTitle, progressPercent, sessionSeconds, onQuiz }: Props) {
  const [showFontControls, setShowFontControls] = useState(false);
  const [timerVisible, setTimerVisible] = useState(true);
  const fontControlsRef = useRef<HTMLDivElement>(null);

  const store = useReaderStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTimerVisible(localStorage.getItem('folio-timer-visible') !== 'false');
  }, []);

  const theme = mounted ? store.theme : 'light';
  const fontFamily = mounted ? store.fontFamily : 'default';
  const fontSize = mounted ? store.fontSize : 17;
  const lineHeight = mounted ? store.lineHeight : 1.8;
  const continuousReading = mounted ? store.continuousReading : false;
  const { setTheme, setFontFamily, setFontSize, setLineHeight, setContinuousReading, toggleChapterSidebar } = store;

  useEffect(() => {
    if (!showFontControls) return;
    function handleClick(e: MouseEvent) {
      if (fontControlsRef.current && !fontControlsRef.current.contains(e.target as Node))
        setShowFontControls(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showFontControls]);

  function toggleTimer() {
    setTimerVisible(v => {
      const next = !v;
      localStorage.setItem('folio-timer-visible', String(next));
      return next;
    });
  }

  const textColor = theme === 'dark' ? '#D4C5A0' : theme === 'dark-sepia' ? '#FAECDC' : '#1C1C1E';
  const borderColor = theme === 'dark' ? '#333' : theme === 'dark-sepia' ? '#5C5243' : theme === 'sepia' ? '#DDD0A8' : '#E5E0D8';
  const bgColor = theme === 'dark' ? '#242424' : theme === 'dark-sepia' ? '#433B30' : theme === 'sepia' ? '#EEE4C4' : '#F2EFE9';
  const mutedColor = theme === 'dark' ? '#A0998C' : theme === 'dark-sepia' ? '#CEC3B6' : '#6B6860';

  return (
    <div className="flex-none border-b z-20" style={{ backgroundColor: bgColor, borderColor, transition: 'background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease' }}>
      <div className="h-12 flex items-center px-2 md:px-4 gap-1 md:gap-2">

        {/* Back */}
        <Link href="/library" className="flex-none p-2 rounded hover:bg-black/5 transition-colors" title="Back to Library">
          <ChevronLeft className="w-4 h-4" style={{ color: textColor }} />
        </Link>

        {/* Chapter sidebar toggle */}
        <button onClick={toggleChapterSidebar}
          className="flex-none p-2 rounded hover:bg-black/5 transition-colors"
          title="Toggle Chapters">
          <Book className="w-4 h-4" style={{ color: textColor }} />
        </button>

        {/* Title — center */}
        <div className="flex-1 min-w-0 text-center px-1">
          <p className="text-sm font-medium truncate" style={{ color: textColor, fontFamily: 'Lora, Georgia, serif' }}>
            {book.title}
          </p>
          {chapterTitle && (
            <p className="text-xs truncate hidden sm:block" style={{ color: mutedColor }}>
              {chapterTitle}
            </p>
          )}
        </div>

        {/* Timer — hidden on mobile, toggleable */}
        <div className="hidden sm:flex flex-none items-center gap-1">
          {timerVisible && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-md"
              style={{ backgroundColor: 'rgba(139,105,20,0.08)' }}>
              <Timer className="w-3 h-3" style={{ color: '#8B6914' }} />
              <span className="text-xs font-mono tabular-nums" style={{ color: '#8B6914' }}>
                {formatTime(sessionSeconds)}
              </span>
            </div>
          )}
          {/* Hide/show timer toggle */}
          <button
            onClick={toggleTimer}
            className="p-1.5 rounded hover:bg-black/5 transition-colors"
            title={timerVisible ? 'Hide timer' : 'Show timer'}
          >
            {timerVisible
              ? <EyeOff className="w-3.5 h-3.5" style={{ color: mutedColor }} />
              : <Timer className="w-3.5 h-3.5" style={{ color: mutedColor }} />
            }
          </button>
        </div>

        {/* Progress */}
        <div className="hidden sm:flex flex-none items-center gap-2">
          <div className="w-14 md:w-20 h-1 rounded-full overflow-hidden" style={{ backgroundColor: borderColor }}>
            <div className="h-full rounded-full transition-all"
              style={{ width: `${progressPercent}%`, backgroundColor: '#8B6914' }} />
          </div>
          <span className="text-xs" style={{ color: mutedColor }}>{progressPercent}%</span>
        </div>

        {/* Quiz */}
        <button onClick={onQuiz} className="flex-none p-2 rounded hover:bg-black/5 transition-colors" title="Quiz">
          <Trophy className="w-4 h-4" style={{ color: textColor }} />
        </button>

        {/* Font / display controls */}
        <div className="relative flex-none" ref={fontControlsRef}>
          <button onClick={() => setShowFontControls(p => !p)}
            className="p-2 rounded hover:bg-black/5 transition-colors" title="Display settings">
            <SlidersHorizontal className="w-4 h-4" style={{ color: textColor }} />
          </button>

          {showFontControls && (
            <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border p-4 shadow-popover z-50"
              style={{ backgroundColor: bgColor, borderColor }}>
              <div className="mb-4">
                <p className="text-xs font-medium mb-2" style={{ color: mutedColor }}>Theme</p>
                <div className="flex gap-2">
                  {THEMES.map(t => (
                    <button key={t.id} onClick={() => setTheme(t.id)}
                      className={cn('flex-1 py-2 rounded text-xs font-medium border transition-all',
                        theme === t.id ? 'border-[#8B6914]' : '')}
                      style={{
                        backgroundColor: t.bg,
                        color: t.id === 'dark' ? '#D4C5A0' : t.id === 'dark-sepia' ? '#FAECDC' : '#1C1C1E',
                        borderColor: theme === t.id ? '#8B6914' : borderColor,
                      }}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-4">
                <p className="text-xs font-medium mb-2" style={{ color: mutedColor }}>Font</p>
                <div className="flex flex-wrap gap-2">
                  {FONTS.map(f => (
                    <button key={f.id} onClick={() => setFontFamily(f.id)}
                      className={cn('flex-1 min-w-[70px] py-1.5 rounded text-xs border transition-all',
                        fontFamily === f.id ? 'border-[#8B6914] bg-[#8B6914]/10 text-[#8B6914] font-medium' : '')}
                      style={{
                        ...f.style,
                        borderColor: fontFamily === f.id ? '#8B6914' : borderColor,
                        color: fontFamily === f.id ? '#8B6914' : textColor,
                      }}>
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-medium" style={{ color: mutedColor }}>Font Size</p>
                  <span className="text-xs" style={{ color: textColor }}>{fontSize}px</span>
                </div>
                <input type="range" min={14} max={24} step={1} value={fontSize}
                  onChange={e => setFontSize(Number(e.target.value))}
                  className="w-full accent-[#8B6914]" />
              </div>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-medium" style={{ color: mutedColor }}>Line Height</p>
                  <span className="text-xs" style={{ color: textColor }}>{lineHeight}</span>
                </div>
                <input type="range" min={1.4} max={2.2} step={0.1} value={lineHeight}
                  onChange={e => setLineHeight(Number(e.target.value))}
                  className="w-full accent-[#8B6914]" />
              </div>
              <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: borderColor }}>
                <div>
                  <p className="text-xs font-medium" style={{ color: textColor }}>Continuous Scrolling</p>
                  <p className="text-[10px]" style={{ color: mutedColor }}>Auto-advance chapters</p>
                </div>
                <button
                  onClick={() => setContinuousReading(!continuousReading)}
                  className={cn("w-10 h-6 rounded-full transition-colors relative", continuousReading ? 'bg-[#8B6914]' : 'bg-gray-300 dark:bg-gray-600')}
                >
                  <div className={cn("absolute top-1 w-4 h-4 rounded-full bg-white transition-transform", continuousReading ? 'translate-x-5' : 'translate-x-1')} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile progress strip */}
      <div className="sm:hidden h-0.5 w-full" style={{ backgroundColor: borderColor }}>
        <div className="h-full transition-all" style={{ width: `${progressPercent}%`, backgroundColor: '#8B6914' }} />
      </div>
    </div>
  );
}
