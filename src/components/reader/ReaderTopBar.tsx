'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, Sun, Moon, Book, SlidersHorizontal, Keyboard, Trophy } from 'lucide-react';
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

  const { theme, fontSize, lineHeight, setTheme, setFontSize, setLineHeight, toggleChapterSidebar } = useReaderStore();

  const textColor = theme === 'dark' ? '#E8E6E0' : '#1C1C1E';
  const borderColor = theme === 'dark' ? '#333' : theme === 'sepia' ? '#DDD0A8' : '#E5E0D8';
  const bgColor = theme === 'dark' ? '#242424' : theme === 'sepia' ? '#EEE4C4' : '#F2EFE9';

  return (
    <div
      className="flex-none border-b transition-all duration-200 z-20 h-12"
      style={{ backgroundColor: bgColor, borderColor }}
    >
      <div className="h-12 flex items-center px-4 gap-3">
        {/* Back to library */}
        <Link
          href="/library"
          className="flex-none p-1.5 rounded hover:bg-black/5 transition-colors"
          title="Back to Library"
        >
          <ChevronLeft className="w-4 h-4" style={{ color: textColor }} />
        </Link>

        {/* Toggle chapter sidebar */}
        <button
          onClick={toggleChapterSidebar}
          className="flex-none p-1.5 rounded hover:bg-black/5 transition-colors"
          title="Toggle Chapters (Ctrl+B)"
        >
          <Book className="w-4 h-4" style={{ color: textColor }} />
        </button>

        {/* Book + chapter title */}
        <div className="flex-1 min-w-0 text-center">
          <p className="text-sm font-medium truncate" style={{ color: textColor, fontFamily: 'Lora, Georgia, serif' }}>
            {book.title}
          </p>
          {chapterTitle && (
            <p className="text-xs truncate" style={{ color: theme === 'dark' ? '#A0998C' : '#6B6860' }}>
              {chapterTitle}
            </p>
          )}
        </div>

        {/* Progress */}
        <div className="flex-none flex items-center gap-2">
          <div
            className="w-20 h-1 rounded-full overflow-hidden"
            style={{ backgroundColor: borderColor }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${progressPercent}%`, backgroundColor: '#8B6914' }}
            />
          </div>
          <span className="text-xs" style={{ color: theme === 'dark' ? '#A0998C' : '#6B6860' }}>
            {progressPercent}%
          </span>
        </div>

        {/* Quiz */}
        <button
          onClick={onQuiz}
          className="flex-none p-1.5 rounded hover:bg-black/5 transition-colors"
          title="Chapter Quiz"
        >
          <Trophy className="w-4 h-4" style={{ color: textColor }} />
        </button>

        {/* Font controls */}
        <div className="relative">
          <button
            onClick={() => setShowFontControls((p) => !p)}
            className="flex-none p-1.5 rounded hover:bg-black/5 transition-colors"
            title="Font & Display"
          >
            <SlidersHorizontal className="w-4 h-4" style={{ color: textColor }} />
          </button>

          {showFontControls && (
            <div
              className="absolute right-0 top-full mt-2 w-64 rounded-xl border p-4 shadow-popover z-50"
              style={{ backgroundColor: bgColor, borderColor }}
            >
              {/* Theme picker */}
              <div className="mb-4">
                <p className="text-xs font-medium mb-2" style={{ color: theme === 'dark' ? '#A0998C' : '#6B6860' }}>
                  Theme
                </p>
                <div className="flex gap-2">
                  {THEMES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      className={cn(
                        'flex-1 py-2 rounded text-xs font-medium border transition-all',
                        theme === t.id ? 'border-[#8B6914]' : ''
                      )}
                      style={{
                        backgroundColor: t.bg,
                        color: t.id === 'dark' ? '#E8E6E0' : '#1C1C1E',
                        borderColor: theme === t.id ? '#8B6914' : borderColor,
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font size */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-medium" style={{ color: theme === 'dark' ? '#A0998C' : '#6B6860' }}>
                    Font Size
                  </p>
                  <span className="text-xs" style={{ color: textColor }}>{fontSize}px</span>
                </div>
                <input
                  type="range" min={14} max={22} step={1}
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full accent-[#8B6914]"
                />
              </div>

              {/* Line height */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-medium" style={{ color: theme === 'dark' ? '#A0998C' : '#6B6860' }}>
                    Line Height
                  </p>
                  <span className="text-xs" style={{ color: textColor }}>{lineHeight}</span>
                </div>
                <input
                  type="range" min={1.4} max={2.2} step={0.1}
                  value={lineHeight}
                  onChange={(e) => setLineHeight(Number(e.target.value))}
                  className="w-full accent-[#8B6914]"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
