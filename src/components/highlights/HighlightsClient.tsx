'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Highlighter, Trash2, ExternalLink, Eye, X, BookOpen, CheckSquare, Square, AlertCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { highlightColorClass, formatReadingDate, truncate } from '@/lib/utils';
import type { Highlight, Book, HighlightColor } from '@/types';

interface Props {
  highlights: Highlight[];
  books: Pick<Book, 'id' | 'title'>[];
}

type ColorFilter = 'all' | HighlightColor;

const HIGHLIGHT_HEX: Record<HighlightColor, string> = {
  yellow: '#FFE066',
  blue: '#93C5FD',
  green: '#86EFAC',
  pink: '#F87171',
};

// ── Quick View Modal ──
function QuickViewModal({
  highlight,
  onClose,
}: {
  highlight: Highlight;
  onClose: () => void;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [fetchedParagraph, setFetchedParagraph] = useState<string | null>(null);
  const [isLoadingContext, setIsLoadingContext] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setIsVisible(true));
    });
  }, []);

  // Auto-fetch paragraph context if not stored
  useEffect(() => {
    if (highlight.context_paragraph) return;

    setIsLoadingContext(true);
    fetch('/api/highlights/context', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookId: highlight.book_id,
        highlightText: highlight.text,
        highlightId: highlight.id,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.paragraph) setFetchedParagraph(data.paragraph);
      })
      .catch(() => {})
      .finally(() => setIsLoadingContext(false));
  }, [highlight]);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setIsVisible(false);
    setTimeout(onClose, 300);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleClose]);

  const color = HIGHLIGHT_HEX[highlight.color] ?? '#FFE066';
  const paragraph = highlight.context_paragraph || fetchedParagraph;

  // Build the paragraph with highlighted text
  function renderParagraph() {
    const highlightedText = highlight.text;

    if (isLoadingContext) {
      return (
        <div className="flex items-center gap-3 py-4">
          <div
            className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: color, borderTopColor: 'transparent' }}
          />
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Loading passage context…
          </p>
        </div>
      );
    }

    if (!paragraph) {
      // No context available — just show the highlighted text
      return (
        <p
          className="text-[15px] leading-[1.9] tracking-[0.01em]"
          style={{ fontFamily: 'Lora, Georgia, serif', color: 'var(--text-primary)' }}
        >
          <span
            style={{
              backgroundColor: color + '40',
              borderBottom: `2px solid ${color}`,
              padding: '1px 2px',
              borderRadius: '2px',
            }}
          >
            {highlightedText}
          </span>
        </p>
      );
    }

    // Find the highlighted text within the paragraph and split around it
    const idx = paragraph.indexOf(highlightedText);
    if (idx === -1) {
      // Text not found as substring — show paragraph with highlight separate
      return (
        <div>
          <p
            className="text-[15px] leading-[1.9] tracking-[0.01em]"
            style={{ fontFamily: 'Lora, Georgia, serif', color: 'var(--text-primary)' }}
          >
            {paragraph}
          </p>
          <div className="mt-4 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
            <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted, #9B9890)' }}>
              Highlighted passage
            </p>
            <p
              className="text-[15px] leading-[1.9]"
              style={{ fontFamily: 'Lora, Georgia, serif', color: 'var(--text-primary)' }}
            >
              <span
                style={{
                  backgroundColor: color + '40',
                  borderBottom: `2px solid ${color}`,
                  padding: '1px 2px',
                  borderRadius: '2px',
                }}
              >
                {highlightedText}
              </span>
            </p>
          </div>
        </div>
      );
    }

    const before = paragraph.slice(0, idx);
    const after = paragraph.slice(idx + highlightedText.length);

    return (
      <p
        className="text-[15px] leading-[1.9] tracking-[0.01em]"
        style={{ fontFamily: 'Lora, Georgia, serif', color: 'var(--text-primary)' }}
      >
        {before}
        <span
          style={{
            backgroundColor: color + '40',
            borderBottom: `2px solid ${color}`,
            padding: '1px 2px',
            borderRadius: '2px',
            transition: 'background-color 0.3s',
          }}
        >
          {highlightedText}
        </span>
        {after}
      </p>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          opacity: isVisible ? 1 : 0,
          transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      />

      {/* Modal */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-card, #FFFDF8)',
          borderColor: 'var(--border, #E8E4DA)',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(12px)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid var(--border, #E8E4DA)' }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: color + '25' }}
            >
              <BookOpen className="w-4 h-4" style={{ color }} />
            </div>
            <div>
              <p
                className="text-sm font-semibold"
                style={{ fontFamily: 'Lora, Georgia, serif', color: 'var(--text-primary)' }}
              >
                Quick View
              </p>
              <p className="text-[11px]" style={{ color: 'var(--text-muted, #9B9890)' }}>
                {highlight.chapter_title ?? 'Unknown Chapter'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-black/5 transition-colors"
          >
            <X className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
          {/* Color bar accent */}
          <div
            className="w-1 rounded-full absolute left-6 top-[72px] bottom-5"
            style={{ backgroundColor: color + '50' }}
          />
          <div className="pl-4">
            {renderParagraph()}
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-6 py-3"
          style={{
            borderTop: '1px solid var(--border, #E8E4DA)',
            backgroundColor: 'var(--bg, #FAF8F4)',
          }}
        >
          <span className="text-[11px]" style={{ color: 'var(--text-muted, #9B9890)' }}>
            {formatReadingDate(highlight.created_at)}
          </span>
          {highlight.note && (
            <p
              className="text-[11px] italic truncate max-w-[60%]"
              style={{ color: 'var(--text-secondary)' }}
            >
              📝 {highlight.note}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ──
export default function HighlightsClient({ highlights: initialHighlights, books }: Props) {
  const [highlights, setHighlights] = useState(initialHighlights);
  const [filterBook, setFilterBook] = useState('all');
  const [filterColor, setFilterColor] = useState<ColorFilter>('all');
  const [quickViewHighlight, setQuickViewHighlight] = useState<Highlight | null>(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDeleteIds, setConfirmDeleteIds] = useState<string[] | null>(null);

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

  function handleDelete(idsToDelete: string[]) {
    if (idsToDelete.length === 0) return;
    setConfirmDeleteIds(idsToDelete);
  }

  async function executeDelete() {
    if (!confirmDeleteIds || confirmDeleteIds.length === 0) return;
    
    setIsDeleting(true);
    try {
      const res = await fetch('/api/highlights', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: confirmDeleteIds }),
      });
      if (!res.ok) throw new Error();
      setHighlights((prev) => prev.filter((h) => !confirmDeleteIds.includes(h.id)));
      setSelectedIds(new Set());
      if (isSelectionMode) setIsSelectionMode(false);
      toast.success(`Deleted ${confirmDeleteIds.length} highlight${confirmDeleteIds.length > 1 ? 's' : ''}`);
    } catch {
      toast.error('Failed to delete highlight(s)');
    } finally {
      setIsDeleting(false);
      setConfirmDeleteIds(null);
    }
  }

  function toggleSelection(id: string) {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  }

  const COLORS: { id: ColorFilter; label: string; hex?: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'yellow', label: 'Yellow', hex: '#FFE066' },
    { id: 'blue',   label: 'Blue',   hex: '#93C5FD' },
    { id: 'green',  label: 'Green',  hex: '#86EFAC' },
    { id: 'pink',   label: 'Red',    hex: '#F87171' },
  ];

  return (
    <div className="max-w-3xl mx-auto px-8 py-10">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
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
        <div className="flex items-center gap-2">
          {isSelectionMode ? (
            <>
              <button
                onClick={() => {
                  setIsSelectionMode(false);
                  setSelectedIds(new Set());
                }}
                className="px-3 py-2 rounded-lg text-sm border transition-colors hover:bg-black/5"
                style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
              >
                Cancel
              </button>
              {selectedIds.size > 0 && (
                <button
                  onClick={() => handleDelete(Array.from(selectedIds))}
                  disabled={isDeleting}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete ({selectedIds.size})
                </button>
              )}
            </>
          ) : (
            <button
              onClick={() => setIsSelectionMode(true)}
              className="px-3 py-2 rounded-lg text-sm border transition-colors hover:bg-[var(--border)]"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            >
              Select
            </button>
          )}
        </div>
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
          {Array.from(grouped.entries()).map(([bookTitle, chapters]) => {
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
                {Array.from(chapters.entries()).map(([chapterTitle, chHighlights]) => (
                  <div key={chapterTitle} className="mb-6">
                    <p className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: 'var(--text-secondary)' }}>
                      {chapterTitle}
                    </p>
                    <div className="space-y-3">
                      {chHighlights.map((h) => (
                        <div
                          key={h.id}
                          onClick={() => {
                            if (isSelectionMode) toggleSelection(h.id);
                          }}
                          className={`group flex gap-3 rounded-xl p-4 border transition-all ${isSelectionMode ? 'cursor-pointer' : ''}`}
                          style={{ 
                            backgroundColor: selectedIds.has(h.id) ? '#8B691410' : 'var(--bg-card, #fff)', 
                            borderColor: selectedIds.has(h.id) ? '#8B6914' : 'var(--border)' 
                          }}
                        >
                          {isSelectionMode && (
                            <div className="pt-0.5 flex-none" style={{ color: selectedIds.has(h.id) ? '#8B6914' : 'var(--text-secondary)' }}>
                              {selectedIds.has(h.id) ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                            </div>
                          )}
                          {/* Color indicator */}
                          <div
                            className="flex-none w-1 rounded-full self-stretch"
                            style={{ backgroundColor: HIGHLIGHT_HEX[h.color] }}
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
                              <div className="flex items-center gap-3">
                                {!isSelectionMode && (
                                  <>
                                    {/* Quick View button */}
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setQuickViewHighlight(h); }}
                                      className="flex items-center gap-1 text-xs transition-all hover:gap-1.5"
                                      style={{ color: 'var(--text-secondary)' }}
                                      onMouseEnter={(e) => (e.currentTarget.style.color = '#8B6914')}
                                      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
                                    >
                                      <Eye className="w-3 h-3" />
                                      Quick View
                                    </button>
                                    {/* Jump to passage */}
                                    {book && (
                                      <Link
                                        href={`/read/${book.id}?cfi=${encodeURIComponent(h.cfi_range)}`}
                                        onClick={(e) => e.stopPropagation()}
                                        className="text-xs hover:underline"
                                        style={{ color: '#8B6914' }}
                                      >
                                        Jump to passage →
                                      </Link>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {!isSelectionMode && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDelete([h.id]); }}
                              className="opacity-0 group-hover:opacity-100 self-start p-1.5 rounded hover:bg-red-50 transition-all"
                            >
                              <Trash2 className="w-4 h-4 text-red-400" />
                            </button>
                          )}
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

      {/* Quick View Modal */}
      {quickViewHighlight && (
        <QuickViewModal
          highlight={quickViewHighlight}
          onClose={() => setQuickViewHighlight(null)}
        />
      )}

      {/* Custom Delete Confirmation Modal */}
      {confirmDeleteIds && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div 
            className="w-full max-w-sm rounded-2xl border p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
            style={{ backgroundColor: 'var(--bg-card, #fff)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-none text-red-600">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'Lora, Georgia, serif' }}>
                  Delete {confirmDeleteIds.length > 1 ? 'Highlights' : 'Highlight'}
                </h3>
              </div>
            </div>
            
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              Are you sure you want to delete {confirmDeleteIds.length === 1 ? 'this highlight' : `these ${confirmDeleteIds.length} highlights`}? This action cannot be undone.
            </p>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDeleteIds(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-black/5 disabled:opacity-50"
                style={{ color: 'var(--text-secondary)' }}
              >
                Cancel
              </button>
              <button
                onClick={executeDelete}
                disabled={isDeleting}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete {confirmDeleteIds.length > 1 ? `(${confirmDeleteIds.length})` : ''}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
