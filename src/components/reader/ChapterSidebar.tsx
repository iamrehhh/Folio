'use client';

import { useState } from 'react';
import { Trophy, Bookmark, X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useReaderStore } from '@/lib/store';
import type { ChapterInfo, Bookmark as BookmarkType } from '@/types';

type SidebarTab = 'contents' | 'bookmarks';

interface Props {
  chapters: ChapterInfo[];
  currentIndex: number;
  onSelect: (chapter: ChapterInfo) => void;
  onQuiz: () => void;
  bookmarks: BookmarkType[];
  onJumpToBookmark: (cfi: string) => void;
  onDeleteBookmark: (bookmarkId: string) => void;
  onSaveBookmark: () => void;
}

function formatBookmarkTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function ChapterSidebar({ chapters, currentIndex, onSelect, onQuiz, bookmarks, onJumpToBookmark, onDeleteBookmark, onSaveBookmark }: Props) {
  const [activeTab, setActiveTab] = useState<SidebarTab>('contents');
  const theme = useReaderStore((s) => s.theme);
  const borderColor   = theme === 'dark' ? '#333' : theme === 'dark-sepia' ? '#5C5243' : theme === 'sepia' ? '#DDD0A8' : '#E5E0D8';
  const bgColor       = theme === 'dark' ? '#242424' : theme === 'dark-sepia' ? '#433B30' : theme === 'sepia' ? '#EEE4C4' : '#F2EFE9';
  const textPrimary   = theme === 'dark' ? '#E8E6E0' : theme === 'dark-sepia' ? '#FAECDC' : '#1C1C1E';
  const textSecondary = theme === 'dark' ? '#A0998C' : theme === 'dark-sepia' ? '#CEC3B6' : '#6B6860';

  return (
    <aside
      className="w-56 flex-none border-r flex flex-col"
      style={{ backgroundColor: bgColor, borderColor, height: '100%', minHeight: 0, marginTop: 0, transition: 'background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease' }}
    >
      {/* Tab Header */}
      <div className="flex-none border-b" style={{ borderColor }}>
        <div className="flex">
          <button
            onClick={() => setActiveTab('contents')}
            className="flex-1 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-center transition-colors relative"
            style={{
              color: activeTab === 'contents' ? '#8B6914' : textSecondary,
            }}
          >
            Contents
            {activeTab === 'contents' && (
              <div
                className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full"
                style={{ backgroundColor: '#8B6914' }}
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab('bookmarks')}
            className="flex-1 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-center transition-colors relative"
            style={{
              color: activeTab === 'bookmarks' ? '#8B6914' : textSecondary,
            }}
          >
            Bookmarks
            {bookmarks.length > 0 && (
              <span
                className="inline-flex items-center justify-center ml-1 w-4 h-4 rounded-full text-[9px] font-bold"
                style={{
                  backgroundColor: activeTab === 'bookmarks' ? 'rgba(139,105,20,0.15)' : 'rgba(139,105,20,0.08)',
                  color: '#8B6914',
                }}
              >
                {bookmarks.length}
              </span>
            )}
            {activeTab === 'bookmarks' && (
              <div
                className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full"
                style={{ backgroundColor: '#8B6914' }}
              />
            )}
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'contents' ? (
        <>
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
                // Check if any bookmark is in this chapter
                const hasBookmark = bookmarks.some(b => b.chapter_index === chapter.index);

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
                    <span className="flex items-center gap-1.5">
                      <span className="block truncate leading-snug flex-1">{chapter.title}</span>
                      {hasBookmark && (
                        <Bookmark
                          className="w-3 h-3 flex-none"
                          style={{ color: '#8B6914', fill: '#8B6914', fillOpacity: 0.2 }}
                        />
                      )}
                    </span>
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
        </>
      ) : (
        <>
          {/* Bookmarks list */}
          <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
            {bookmarks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full px-4 py-8">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center mb-3"
                  style={{ backgroundColor: 'rgba(139,105,20,0.08)' }}
                >
                  <Bookmark className="w-5 h-5" style={{ color: '#8B6914', opacity: 0.5 }} />
                </div>
                <p className="text-xs font-medium text-center mb-1" style={{ color: textPrimary }}>
                  No bookmarks yet
                </p>
                <p className="text-[10px] text-center leading-relaxed mb-4" style={{ color: textSecondary }}>
                  Drop a bookmark to save your reading position and jump back anytime.
                </p>
                <button
                  onClick={onSaveBookmark}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    backgroundColor: 'rgba(139,105,20,0.08)',
                    color: '#8B6914',
                    border: '1px solid rgba(139,105,20,0.15)',
                  }}
                >
                  <Plus className="w-3 h-3" />
                  Add Bookmark
                </button>
              </div>
            ) : (
              <div className="py-1">
                {bookmarks.map((bm, idx) => (
                  <div
                    key={bm.id}
                    className="group relative"
                    style={{
                      ...(idx > 0 ? { borderTop: `1px solid ${borderColor}` } : {}),
                    }}
                  >
                    <button
                      onClick={() => onJumpToBookmark(bm.cfi)}
                      className="w-full text-left px-4 py-3 transition-colors hover:bg-black/5"
                    >
                      <div className="flex items-start gap-2">
                        <Bookmark
                          className="w-3.5 h-3.5 flex-none mt-0.5"
                          style={{ color: '#8B6914', fill: '#8B6914', fillOpacity: 0.2 }}
                        />
                        <div className="min-w-0 flex-1">
                          <p
                            className="text-xs font-medium truncate leading-snug"
                            style={{ color: textPrimary }}
                          >
                            {bm.chapter_title || `Chapter ${bm.chapter_index + 1}`}
                          </p>
                          <p
                            className="text-[10px] mt-0.5"
                            style={{ color: textSecondary }}
                          >
                            {bm.progress_percent}% · {formatBookmarkTime(bm.created_at)}
                          </p>
                        </div>
                      </div>
                    </button>

                    {/* Delete button — visible on hover */}
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeleteBookmark(bm.id); }}
                      className="absolute top-2 right-2 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/10"
                      title="Remove bookmark"
                    >
                      <X className="w-3 h-3" style={{ color: textSecondary }} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add bookmark button at bottom */}
          {bookmarks.length > 0 && (
            <div className="p-3 border-t flex-none" style={{ borderColor }}>
              <button
                onClick={onSaveBookmark}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all hover:scale-[1.01] active:scale-[0.99]"
                style={{
                  backgroundColor: 'rgba(139,105,20,0.08)',
                  color: '#8B6914',
                  border: '1px solid rgba(139,105,20,0.15)',
                }}
              >
                <Plus className="w-3.5 h-3.5" />
                Add Bookmark Here
              </button>
            </div>
          )}
        </>
      )}
    </aside>
  );
}
