'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, SlidersHorizontal, Trophy, Book, Timer, EyeOff, ChevronDown, Check } from 'lucide-react';
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
  { id: 'georgia', label: 'Georgia', style: { fontFamily: "Georgia, serif" } },
  { id: 'times-new-roman', label: 'Times New Roman', style: { fontFamily: "'Times New Roman', Times, serif" } },
  { id: 'verdana', label: 'Verdana', style: { fontFamily: "Verdana, sans-serif" } },
  { id: 'tahoma', label: 'Tahoma', style: { fontFamily: "Tahoma, sans-serif" } },
  { id: 'trebuchet-ms', label: 'Trebuchet MS', style: { fontFamily: "'Trebuchet MS', sans-serif" } },
  { id: 'courier-new', label: 'Courier New', style: { fontFamily: "'Courier New', Courier, monospace" } },
  { id: 'roboto', label: 'Roboto', style: { fontFamily: "'Roboto', sans-serif" } },
  { id: 'open-sans', label: 'Open Sans', style: { fontFamily: "'Open Sans', sans-serif" } },
  { id: 'playfair-display', label: 'Playfair', style: { fontFamily: "'Playfair Display', serif" } },
  { id: 'baskerville', label: 'Baskerville', style: { fontFamily: "Baskerville, 'Baskerville Old Face', serif" } },
  { id: 'garamond', label: 'Garamond', style: { fontFamily: "Garamond, serif" } },
  { id: 'ubuntu', label: 'Ubuntu', style: { fontFamily: "'Ubuntu', sans-serif" } },
  { id: 'raleway', label: 'Raleway', style: { fontFamily: "'Raleway', sans-serif" } },
  { id: 'pt-serif', label: 'PT Serif', style: { fontFamily: "'PT Serif', serif" } },
  { id: 'nunito', label: 'Nunito', style: { fontFamily: "'Nunito', sans-serif" } },
];

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function ReaderTopBar({ book, chapterTitle, progressPercent, sessionSeconds, onQuiz }: Props) {
  const [showFontControls, setShowFontControls] = useState(false);
  const [timerVisible, setTimerVisible] = useState(true);
  const [isFontDropdownOpen, setIsFontDropdownOpen] = useState(false);
  const fontControlsRef = useRef<HTMLDivElement>(null);
  const fontDropdownRef = useRef<HTMLDivElement>(null);

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
    function handleClick(e: MouseEvent) {
      if (showFontControls && fontControlsRef.current && !fontControlsRef.current.contains(e.target as Node)) {
        setShowFontControls(false);
      }
      if (isFontDropdownOpen && fontDropdownRef.current && !fontDropdownRef.current.contains(e.target as Node)) {
        setIsFontDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showFontControls, isFontDropdownOpen]);

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
              <div className="mb-4" ref={fontDropdownRef}>
                <p className="text-xs font-medium mb-2" style={{ color: mutedColor }}>Font</p>
                <div className="relative">
                  <button onClick={() => setIsFontDropdownOpen(!isFontDropdownOpen)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded text-sm border transition-all"
                    style={{
                      backgroundColor: 'transparent',
                      borderColor: borderColor,
                      color: textColor,
                      ...(FONTS.find(f => f.id === fontFamily)?.style || {})
                    }}>
                    <span>{FONTS.find(f => f.id === fontFamily)?.label || 'Default'}</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  {isFontDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 rounded-xl border shadow-popover overflow-y-auto max-h-48 z-[60]"
                      style={{ backgroundColor: bgColor, borderColor }}>
                      {FONTS.map(f => (
                        <button key={f.id} onClick={() => { setFontFamily(f.id); setIsFontDropdownOpen(false); }}
                          className="w-full flex items-center justify-between px-3 py-2 text-left text-sm transition-colors hover:bg-black/5"
                          style={{
                            ...f.style,
                            color: fontFamily === f.id ? '#8B6914' : textColor,
                            backgroundColor: fontFamily === f.id ? 'rgba(139,105,20,0.05)' : 'transparent',
                          }}>
                          <span>{f.label}</span>
                          {fontFamily === f.id && <Check className="w-4 h-4" style={{ color: '#8B6914' }} />}
                        </button>
                      ))}
                    </div>
                  )}
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
