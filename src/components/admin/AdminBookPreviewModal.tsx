'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Loader2, ChevronLeft, ChevronRight, Globe, Lock, BookOpen, ZoomIn, ZoomOut } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Book, Rendition } from 'epubjs';

interface Props {
  bookId: string;
  bookTitle: string;
  currentVisibility: string;
  onClose: () => void;
  onVisibilityChanged: (newVisibility: string) => void;
}

export default function AdminBookPreviewModal({ bookId, bookTitle, currentVisibility, onClose, onVisibilityChanged }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [chapterTitle, setChapterTitle] = useState<string>('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [fontSize, setFontSize] = useState(16);

  const viewerRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<Book | null>(null);
  const renditionRef = useRef<Rendition | null>(null);

  // Fetch the signed EPUB URL
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/admin/books/preview?bookId=${bookId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Failed to load preview');
        setSignedUrl(data.signedUrl);
      } catch (e: any) {
        setError(e.message);
      }
    })();
  }, [bookId]);

  // Initialize EPUB reader
  useEffect(() => {
    let mounted = true;
    if (!signedUrl || !viewerRef.current) return;

    (async () => {
      try {
        const ePub = (await import('epubjs')).default;
        
        const response = await fetch(signedUrl);
        if (!response.ok) throw new Error('Failed to fetch EPUB file');
        const arrayBuffer = await response.arrayBuffer();
        if (!mounted) return;

        const book = ePub(arrayBuffer);
        bookRef.current = book;

    const rendition = book.renderTo(viewerRef.current!, {
      width: '100%',
      height: '100%',
      spread: 'none',
      flow: 'paginated',
    });

    renditionRef.current = rendition;

    // Listen to wheel events on the rendition to turn pages
    rendition.on('wheel', (e: WheelEvent) => {
      // Small debounce/threshold for wheel to avoid flying through pages
      if (Math.abs(e.deltaY) > 20 || Math.abs(e.deltaX) > 20) {
        if (e.deltaY > 0 || e.deltaX > 0) handleNext();
        else handlePrev();
      }
    });

    rendition.themes.default({
      body: {
        'font-size': `${fontSize}px !important`,
        'line-height': '1.7 !important',
        'color': 'var(--text-primary, #1a1a1a) !important',
        'font-family': 'Georgia, serif !important',
        'padding': '20px !important',
      }
    });

    rendition.display();

    rendition.on('relocated', (location: any) => {
      try {
        const spine = book.spine as any;
        if (spine && location.start) {
          const idx = location.start.index;
          const item = spine.get(idx);
          if (item?.href) {
            const toc = book.navigation?.toc || [];
            const match = toc.find((t: any) => item.href.includes(t.href));
            setChapterTitle(match?.label?.trim() ?? `Chapter ${idx + 1}`);
          }
        }
      } catch {
        // Ignore TOC errors
      }
    });

    setLoading(false);
      } catch (e) {
        console.error('Failed to init epubjs', e);
        if (mounted) {
          setError('Failed to render book');
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
      if (renditionRef.current) renditionRef.current.destroy();
      if (bookRef.current) bookRef.current.destroy();
    };
  }, [signedUrl]);

  // Update font size
  useEffect(() => {
    if (renditionRef.current) {
      renditionRef.current.themes.default({
        body: {
          'font-size': `${fontSize}px !important`,
        }
      });
    }
  }, [fontSize]);

  function handlePrev() {
    renditionRef.current?.prev();
  }

  function handleNext() {
    renditionRef.current?.next();
  }

  async function handleMakePublic() {
    setIsPublishing(true);
    try {
      const res = await fetch('/api/admin/books', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId, visibility: 'public' }),
      });
      if (!res.ok) throw new Error('Failed to update visibility');
      toast.success('Book is now public!');
      onVisibilityChanged('public');
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to make public');
    } finally {
      setIsPublishing(false);
    }
  }

  async function handleMakePrivate() {
    setIsPublishing(true);
    try {
      const res = await fetch('/api/admin/books', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId, visibility: 'private' }),
      });
      if (!res.ok) throw new Error('Failed to update visibility');
      toast.success('Book is now private.');
      onVisibilityChanged('private');
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to make private');
    } finally {
      setIsPublishing(false);
    }
  }

  // Freeze background scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative z-10 w-full max-w-4xl h-[90vh] rounded-2xl border shadow-2xl flex flex-col overflow-hidden"
        style={{ backgroundColor: 'var(--bg-card,#fff)', borderColor: 'var(--border)' }}
      >
        {/* Top Bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b flex-none" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-none" style={{ backgroundColor: '#8B691415' }}>
              <BookOpen className="w-4 h-4" style={{ color: '#8B6914' }} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)', fontFamily: 'Lora, Georgia, serif' }}>
                {bookTitle}
              </h3>
              {chapterTitle && (
                <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{chapterTitle}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-none">
            {/* Font size controls */}
            <button
              onClick={() => setFontSize(s => Math.max(12, s - 2))}
              className="w-8 h-8 rounded-lg border flex items-center justify-center transition-colors hover:bg-[var(--border)]"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
              title="Decrease font size"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-medium tabular-nums w-6 text-center" style={{ color: 'var(--text-secondary)' }}>{fontSize}</span>
            <button
              onClick={() => setFontSize(s => Math.min(28, s + 2))}
              className="w-8 h-8 rounded-lg border flex items-center justify-center transition-colors hover:bg-[var(--border)]"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
              title="Increase font size"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>

            <div className="w-px h-6 mx-1" style={{ backgroundColor: 'var(--border)' }} />

            {/* Visibility toggle */}
            {currentVisibility === 'public' ? (
              <button
                onClick={handleMakePrivate}
                disabled={isPublishing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors hover:bg-[var(--border)]"
                style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
              >
                {isPublishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
                Make Private
              </button>
            ) : (
              <button
                onClick={handleMakePublic}
                disabled={isPublishing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: '#22C55E' }}
              >
                {isPublishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5" />}
                Make Public
              </button>
            )}

            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-[var(--border)]" style={{ color: 'var(--text-secondary)' }}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Reader Area */}
        <div className="flex-1 relative overflow-y-auto" style={{ backgroundColor: '#FAF8F4' }}>
          {(loading || !signedUrl) && !error && (
            <div className="absolute inset-0 flex items-center justify-center gap-3 pointer-events-none">
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#8B6914' }} />
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Loading book preview…</span>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center p-6">
                <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-20" style={{ color: 'var(--text-secondary)' }} />
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Failed to load preview</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{error}</p>
              </div>
            </div>
          )}

          <div ref={viewerRef} className="w-full h-full" />

          {/* Navigation Arrows */}
          {!loading && !error && signedUrl && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full border flex items-center justify-center transition-all hover:shadow-md hover:scale-105"
                style={{ backgroundColor: 'var(--bg-card,#fff)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full border flex items-center justify-center transition-all hover:shadow-md hover:scale-105"
                style={{ backgroundColor: 'var(--bg-card,#fff)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-2.5 border-t flex-none" style={{ borderColor: 'var(--border)' }}>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Admin preview mode — no reading progress is saved
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Use ← → keys to navigate</span>
          </div>
        </div>
      </div>
    </div>
  );
}
