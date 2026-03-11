'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Highlighter, Trash2, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { highlightColorClass, formatReadingDate, truncate } from '@/lib/utils';
import type { Highlight, Book, HighlightColor } from '@/types';

interface Props {
  highlights: Highlight[];
  books: Pick<Book, 'id' | 'title'>[];
}

type ColorFilter = 'all' | HighlightColor;

export default function HighlightsClient({ highlights: initialHighlights, books }: Props) {
  const [highlights, setHighlights] = useState(initialHighlights);
  const [filterBook, setFilterBook] = useState('all');
  const [filterColor, setFilterColor] = useState<ColorFilter>('all');

  const filtered = useMemo(() => {
    return highlights.filter((h) => {
      if (filterBook !== 'all' && h.book_id !== filterBook) return false;
      if (filterColor !== 'all' && h.color !== filterColor) return false;
      return true;
    });
  }, [highlights, filterBook, filterColor]);

  // Group by book → chapter
  const grouped = useMemo(() => {
    const map = new Map<string, Map<string, Highlight[]>>();
    for (const h of filtered) {
      const bookTitle = (h.book as any)?.title ?? 'Unknown book';
      const chapter = h.chapter_title ?? 'Unknown Chapter';
      if (!map.has(bookTitle)) map.set(bookTitle, new Map());
      const chMap = map.get(bookTitle)!;
      if (!chMap.has(chapter)) chMap.set(chapter, []);
      chMap.get(chapter)!.push(h);
    }
    return map;
  }, [filtered]);

  async function handleDelete(id: string) {
    try {
      const res = await fetch('/api/highlights', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error();
      setHighlights((prev) => prev.filter((h) => h.id !== id));
      toast.success('Highlight deleted');
    } catch {
      toast.error('Failed to delete highlight');
    }
  }

  const COLORS: { id: ColorFilter; label: string; hex?: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'yellow', label: 'Yellow', hex: '#FFE066' },
    { id: 'blue',   label: 'Blue',   hex: '#93C5FD' },
    { id: 'green',  label: 'Green',  hex: '#86EFAC' },
    { id: 'pink',   label: 'Pink',   hex: '#F9A8D4' },
  ];

  return (
    <div className="max-w-3xl mx-auto px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-2xl font-semibold"
          style={{ fontFamily: 'Lora, Georgia, serif', color: 'var(--text-primary)' }}
        >
          Highlights
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          {highlights.length} highlight{highlights.length !== 1 ? 's' : ''} across {books.length} book{books.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <select
          value={filterBook}
          onChange={(e) => setFilterBook(e.target.value)}
          className="px-3 py-2 text-sm rounded-lg border outline-none"
          style={{ backgroundColor: 'var(--bg-card, #fff)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
        >
          <option value="all">All Books</option>
          {books.map((b) => (
            <option key={b.id} value={b.id}>{b.title}</option>
          ))}
        </select>

        <div className="flex items-center gap-1">
          {COLORS.map((c) => (
            <button
              key={c.id}
              onClick={() => setFilterColor(c.id)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium border transition-all"
              style={
                filterColor === c.id
                  ? { backgroundColor: c.hex ?? '#8B6914', borderColor: c.hex ?? '#8B6914', color: c.id === 'all' ? '#fff' : '#1C1C1E' }
                  : { backgroundColor: 'var(--bg-card, #fff)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }
              }
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grouped content */}
      {grouped.size === 0 ? (
        <div className="text-center py-20">
          <Highlighter className="w-10 h-10 mx-auto mb-3 opacity-20" style={{ color: 'var(--text-secondary)' }} />
          <p className="font-medium" style={{ color: 'var(--text-primary)' }}>No highlights yet</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Select text while reading to highlight and save passages.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {[...grouped.entries()].map(([bookTitle, chapters]) => {
            const book = books.find((b) => b.title === bookTitle);
            return (
              <div key={bookTitle}>
                {/* Book header */}
                <div className="flex items-center justify-between mb-4">
                  <h2
                    className="text-lg font-semibold"
                    style={{ fontFamily: 'Lora, Georgia, serif', color: 'var(--text-primary)' }}
                  >
                    {bookTitle}
                  </h2>
                  {book && (
                    <Link
                      href={`/read/${book.id}`}
                      className="flex items-center gap-1 text-xs hover:underline"
                      style={{ color: '#8B6914' }}
                    >
                      Continue reading <ExternalLink className="w-3 h-3" />
                    </Link>
                  )}
                </div>

                {/* Chapters */}
                {[...chapters.entries()].map(([chapterTitle, chHighlights]) => (
                  <div key={chapterTitle} className="mb-6">
                    <p className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: 'var(--text-secondary)' }}>
                      {chapterTitle}
                    </p>
                    <div className="space-y-3">
                      {chHighlights.map((h) => (
                        <div
                          key={h.id}
                          className="group flex gap-3 rounded-xl p-4 border"
                          style={{ backgroundColor: 'var(--bg-card, #fff)', borderColor: 'var(--border)' }}
                        >
                          {/* Color indicator */}
                          <div
                            className="flex-none w-1 rounded-full self-stretch"
                            style={{ backgroundColor: { yellow: '#FFE066', blue: '#93C5FD', green: '#86EFAC', pink: '#F9A8D4' }[h.color] }}
                          />

                          <div className="flex-1 min-w-0">
                            <p
                              className="text-sm leading-relaxed"
                              style={{ fontFamily: 'Lora, Georgia, serif', color: 'var(--text-primary)' }}
                            >
                              &ldquo;{h.text}&rdquo;
                            </p>

                            {h.note && (
                              <p className="text-sm mt-2 italic" style={{ color: 'var(--text-secondary)' }}>
                                Note: {h.note}
                              </p>
                            )}

                            <div className="flex items-center justify-between mt-3">
                              <span className="text-xs" style={{ color: 'var(--text-muted, #9B9890)' }}>
                                {formatReadingDate(h.created_at)}
                              </span>
                              {book && (
                                <Link
                                  href={`/read/${book.id}?cfi=${encodeURIComponent(h.cfi_range)}`}
                                  className="text-xs hover:underline"
                                  style={{ color: '#8B6914' }}
                                >
                                  Jump to passage →
                                </Link>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={() => handleDelete(h.id)}
                            className="opacity-0 group-hover:opacity-100 self-start p-1.5 rounded hover:bg-red-50 transition-all"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
