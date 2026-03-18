'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, SlidersHorizontal, Trophy, Book } from 'lucide-react';
import Link from 'next/link';
import { useReaderStore } from '@/lib/store';
import type { Book as BookType, ReadingTheme } from '@/types';
import { cn } from '@/lib/utils';

interface Props {
  book: BookType;
  chapterTitle: string;
  progressPercent: number;
  onQuiz: () => void;
}

const THEMES: { id: ReadingTheme; label: string; bg: string }[] = [
  { id: 'light', label: 'Light', bg: '#FAF8F4' },
  { id: 'sepia', label: 'Sepia', bg: '#F5EDD6' },
  { id: 'dark',  label: 'Dark',  bg: '#1A1A1A' },
];

export default function ReaderTopBar({ book, chapterTitle, progressPercent, onQuiz }: Props) {
  const [showFontControls, setShowFontControls] = useState(false);
  const fontControlsRef = useRef<HTMLDivElement>(null);
  const { theme, fontSize, lineHeight, setTheme, setFontSize, setLineHeight, toggleChapterSidebar } = useReaderStore();

  useEffect(() => {
    if (!showFontControls) return;
    function handleClick(e: MouseEvent) {
      if (fontControlsRef.current && !fontControlsRef.current.contains(e.target as Node))
        setShowFontControls(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showFontControls]);

  const textColor   = theme === 'dark' ? '#E8E6E0' : '#1C1C1E';
  const borderColor = theme === 'dark' ? '#333' : theme === 'sepia' ? '#DDD0A8' : '#E5E0D8';
  const bgColor     = theme === 'dark' ? '#242424' : theme === 'sepia' ? '#EEE4C4' : '#F2EFE9';
  const mutedColor  = theme === 'dark' ? '#A0998C' : '#6B6860';

  return (
    <div className="flex-none border-b z-20" style={{ backgroundColor: bgColor, borderColor }}>
      <div className="h-12 flex items-center px-2 md:px-4 gap-1 md:gap-3">

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

        {/* Progress — hidden on very small screens */}
        <div className="hidden sm:flex flex-none items-center gap-2">
          <div className="w-16 md:w-20 h-1 rounded-full overflow-hidden" style={{ backgroundColor: borderColor }}>
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

              {/* Theme */}
              <div className="mb-4">
                <p className="text-xs font-medium mb-2" style={{ color: mutedColor }}>Theme</p>
                <div className="flex gap-2">
                  {THEMES.map(t => (
                    <button key={t.id} onClick={() => setTheme(t.id)}
                      className={cn('flex-1 py-2 rounded text-xs font-medium border transition-all',
                        theme === t.id ? 'border-[#8B6914]' : '')}
                      style={{
                        backgroundColor: t.bg,
                        color: t.id === 'dark' ? '#E8E6E0' : '#1C1C1E',
                        borderColor: theme === t.id ? '#8B6914' : borderColor,
                      }}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font size */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-medium" style={{ color: mutedColor }}>Font Size</p>
                  <span className="text-xs" style={{ color: textColor }}>{fontSize}px</span>
                </div>
                <input type="range" min={14} max={24} step={1} value={fontSize}
                  onChange={e => setFontSize(Number(e.target.value))}
                  className="w-full accent-[#8B6914]" />
              </div>

              {/* Line height */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-medium" style={{ color: mutedColor }}>Line Height</p>
                  <span className="text-xs" style={{ color: textColor }}>{lineHeight}</span>
                </div>
                <input type="range" min={1.4} max={2.2} step={0.1} value={lineHeight}
                  onChange={e => setLineHeight(Number(e.target.value))}
                  className="w-full accent-[#8B6914]" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile progress bar — full width strip at bottom of topbar */}
      <div className="sm:hidden h-0.5 w-full" style={{ backgroundColor: borderColor }}>
        <div className="h-full transition-all" style={{ width: `${progressPercent}%`, backgroundColor: '#8B6914' }} />
      </div>
    </div>
  );
}
