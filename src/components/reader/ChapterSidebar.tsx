'use client';

import { Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useReaderStore } from '@/lib/store';
import type { ChapterInfo } from '@/types';

interface Props {
  chapters: ChapterInfo[];
  currentIndex: number;
  onSelect: (chapter: ChapterInfo) => void;
  onQuiz: () => void;
}

export default function ChapterSidebar({ chapters, currentIndex, onSelect, onQuiz }: Props) {
  const theme = useReaderStore((s) => s.theme);
  const borderColor   = theme === 'dark' ? '#333'     : theme === 'sepia' ? '#DDD0A8' : '#E5E0D8';
  const bgColor       = theme === 'dark' ? '#242424'  : theme === 'sepia' ? '#EEE4C4' : '#F2EFE9';
  const textPrimary   = theme === 'dark' ? '#E8E6E0'  : '#1C1C1E';
  const textSecondary = theme === 'dark' ? '#A0998C'  : '#6B6860';

  return (
    <aside
      className="w-56 flex-none border-r flex flex-col"
      style={{ backgroundColor: bgColor, borderColor, height: '100%', minHeight: 0 }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b flex-none" style={{ borderColor }}>
        <p className="text-xs font-medium uppercase tracking-wider" style={{ color: textSecondary }}>
          Contents
        </p>
      </div>

      {/* Chapter list */}
      <div className="flex-1 overflow-y-auto py-2" style={{ minHeight: 0 }}>
        {chapters.length === 0 ? (
          <p className="px-4 py-3 text-xs" style={{ color: textSecondary }}>
            Loading chapters…
          </p>
        ) : (
          chapters.map((chapter) => {
            const isActive = chapter.index === currentIndex;
            const depth = (chapter as any).depth ?? 0;
            const isParent = depth === 0;

            return (
              <button
                key={chapter.index}
                onClick={() => onSelect(chapter)}
                className={cn(
                  'w-full text-left transition-colors',
                  isActive ? 'font-medium' : 'hover:bg-black/5'
                )}
                style={{
                  paddingTop: isParent ? '0.5rem' : '0.35rem',
                  paddingBottom: isParent ? '0.5rem' : '0.35rem',
                  paddingLeft: `${1 + depth * 0.75}rem`,
                  paddingRight: '1rem',
                  fontSize: isParent ? '0.8125rem' : '0.75rem',
                  ...(isActive
                    ? { color: '#8B6914', backgroundColor: 'rgba(139,105,20,0.08)' }
                    : { color: depth > 0 ? textSecondary : textPrimary }),
                  // Parent sections get a subtle top separator
                  ...(isParent && chapter.index > 0 ? { borderTop: `1px solid ${borderColor}`, marginTop: '0.25rem', paddingTop: '0.6rem' } : {}),
                }}
              >
                <span className="block truncate leading-snug">{chapter.title}</span>
              </button>
            );
          })
        )}
      </div>

      {/* Quiz button */}
      {chapters.length > 0 && (
        <div className="p-3 border-t flex-none" style={{ borderColor }}>
          <button
            onClick={onQuiz}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium border transition-colors hover:bg-black/5"
            style={{ borderColor, color: textSecondary }}
          >
            <Trophy className="w-3.5 h-3.5" />
            Test this chapter
          </button>
        </div>
      )}
    </aside>
  );
}
