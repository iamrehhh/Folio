'use client';

import { useEffect, useRef, useState } from 'react';
import { useReaderStore } from '@/lib/store';
import { cn, highlightColorHex } from '@/lib/utils';
import ReaderTopBar from './ReaderTopBar';
import ChapterSidebar from './ChapterSidebar';
import SelectionToolbar from './SelectionToolbar';
import WordPopover from './WordPopover';
import AIPanel from './AIPanel';
import ChapterQuiz from './ChapterQuiz';
import type { Book, ReadingProgress, Highlight, Profile, ChapterInfo } from '@/types';
import CompletionScreen from './CompletionScreen';
import toast from 'react-hot-toast';

interface Props {
  book: Book;
  epubUrl: string;
  initialProgress: ReadingProgress | null;
  initialHighlights: Highlight[];
  profile: Profile | null;
  userId: string;
}

export default function ReaderClient({
  book, epubUrl, initialProgress, initialHighlights, profile, userId
}: Props) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<any>(null);
  const renditionRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [chapters, setChapters] = useState<ChapterInfo[]>([]);
  const [highlights, setHighlights] = useState<Highlight[]>(initialHighlights);
  const [chapterText, setChapterText] = useState('');
  const [showQuiz, setShowQuiz] = useState(false);
  const currentChapterIndexRef = useRef(0);
  const [showCompletion, setShowCompletion] = useState(false);
  const [completionShownFor, setCompletionShownFor] = useState<string | null>(null);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const sessionSecondsRef = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionStartRef = useRef<number>(Date.now());
  const [loadError, setLoadError] = useState(false);

  const [selectionToolbar, setSelectionToolbar] = useState<{
    x: number; y: number; text: string; cfiRange: string;
  } | null>(null);

  const [wordPopover, setWordPopover] = useState<{
    x: number; y: number; word: string; paragraph: string;
  } | null>(null);

  const {
    theme, fontSize, lineHeight,
    isChapterSidebarOpen, isAIPanelOpen,
    currentChapterIndex, setProgress,
    toggleChapterSidebar, toggleAIPanel,
  } = useReaderStore();

  const themeBg = { light: '#FAF8F4', sepia: '#F5EDD6', dark: '#1A1A1A' }[theme];
  const themeText = { light: '#1C1C1E', sepia: '#1C1C1E', dark: '#E8E6E0' }[theme];

  useEffect(() => {
    if (!viewerRef.current) return;
    let mounted = true;

    async function initEpub() {
      const ePub = (await import('epubjs')).default;

      const response = await fetch(epubUrl);
      if (!response.ok) throw new Error('Failed to fetch EPUB file');
      const arrayBuffer = await response.arrayBuffer();
      if (!mounted) return;

      if (viewerRef.current) viewerRef.current.innerHTML = '';

      const epubBook = ePub(arrayBuffer);
      bookRef.current = epubBook;

      const rendition = epubBook.renderTo(viewerRef.current!, {
        width: '100%',
        height: '100%',
        spread: 'none',
        flow: 'scrolled-doc',
        allowScriptedContent: true,
      });
      renditionRef.current = rendition;

      applyTheme(rendition, theme, fontSize, lineHeight);

      await epubBook.ready;
      if (!mounted) return;

      const nav = epubBook.navigation;
      const toc = nav?.toc ?? [];

      // Flatten nested TOC recursively — handles Part > Chapter hierarchies
      function flattenToc(items: any[], depth = 0): { label: string; href: string; depth: number }[] {
        const result: { label: string; href: string; depth: number }[] = [];
        for (const item of items) {
          result.push({ label: item.label?.trim() ?? '', href: item.href ?? '', depth });
          if (Array.isArray(item.subitems) && item.subitems.length > 0) {
            result.push(...flattenToc(item.subitems, depth + 1));
          }
        }
        return result;
      }

      const isValidLabel = (label: string) =>
        label.length > 0 &&
        !/^text\d+$/i.test(label) &&
        !/^item\d+$/i.test(label) &&
        !/^chapter_?\d+\.x?html?$/i.test(label);

      let chapterList: ChapterInfo[] = [];
      const flatToc = flattenToc(toc);

      if (flatToc.length > 0 && flatToc.some(item => isValidLabel(item.label))) {
        chapterList = flatToc.map((item, i) => {
          const spineItem = epubBook.spine.get(item.href);
          const title = item.depth > 0
            ? '\u00A0\u00A0'.repeat(item.depth) + item.label
            : item.label;
          return {
            index: i,
            title: title || `Chapter ${i + 1}`,
            href: item.href,
            depth: item.depth,
            spinePos: spineItem ? spineItem.index : -1,
          };
        });
      } else {
        const spineItems: any[] = [];
        epubBook.spine.each((item: any) => spineItems.push(item));
        chapterList = spineItems.map((item: any, i: number) => {
          const href = item.href ?? item.url ?? '';
          const filename = href.split('/').pop()?.replace(/\.x?html?$/i, '') ?? '';
          const readable = filename.replace(/[-_]/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()).trim();
          return {
            index: i,
            title: readable || `Chapter ${i + 1}`,
            href: item.href ?? '',
            depth: 0,
            spinePos: item.index ?? i,
          };
        });
      }

      setChapters(chapterList);

      // Display with timeout fallback for stubborn EPUB3 books
      let displayOk = false;
      await Promise.race([
        (initialProgress?.cfi
          ? rendition.display(initialProgress.cfi).then(async () => {
              // After display, scroll to exact CFI position
              displayOk = true;
              setTimeout(() => {
                try {
                  renditionRef.current?.display(initialProgress.cfi!);
                } catch { /* ignore */ }
              }, 300);
            })
          : rendition.display()
        ).then(() => { displayOk = true; }),
        new Promise<void>((_, reject) =>
          setTimeout(() => reject(new Error('display timeout')), 8000)
        ),
      ]).catch(async (err) => {
        // First attempt failed — retry with flow: 'scrolled'
        console.warn('[Reader] display failed, retrying:', err.message);
        if (!mounted || !viewerRef.current) return;
        renditionRef.current?.destroy?.();
        viewerRef.current.innerHTML = '';

        const fallback = epubBook.renderTo(viewerRef.current!, {
          width: '100%', height: '100%', spread: 'none',
          flow: 'scrolled', allowScriptedContent: true,
        });
        renditionRef.current = fallback;
        applyTheme(fallback, theme, fontSize, lineHeight);

        await Promise.race([
          fallback.display().then(() => { displayOk = true; }),
          new Promise<void>((_, reject) =>
            setTimeout(() => reject(new Error('fallback timeout')), 8000)
          ),
        ]).catch(() => {
          console.warn('[Reader] fallback also failed — showing error');
        });

        if (displayOk) {
          fallback.hooks.content.register((contents: any) => {
            const iframe = viewerRef.current?.querySelector('iframe') as HTMLIFrameElement | null;
            if (iframe) iframe.style.cssText = 'width:100% !important;height:100% !important;border:none !important;';
            const doc = contents.document;
            if (doc?.body) doc.body.style.cssText = 'width:100% !important;margin:0 !important;padding:3rem 5rem !important;box-sizing:border-box !important;overflow-x:hidden !important;word-wrap:break-word !important;';
            doc.addEventListener('click', () => {
              const sel = contents.window.getSelection();
              if (!sel || sel.isCollapsed) { setSelectionToolbar(null); setWordPopover(null); }
            });
          });
        }
      });

      if (!mounted) return;
      if (!displayOk) {
        setLoadError(true);
        setIsLoading(false);
        return;
      }
      setIsLoading(false);

      // Generate locations in background AFTER rendering (non-blocking)
      setTimeout(() => {
        if (!mounted) return;
        epubBook.locations.generate(1000).catch(() => {});
      }, 500);

      // Fix iframe and body sizing after each render
      rendition.hooks.content.register((contents: any) => {
        const iframe = viewerRef.current?.querySelector('iframe') as HTMLIFrameElement | null;
        if (iframe) {
          iframe.style.cssText = 'width:100% !important; height:100% !important; border:none !important;';
        }
        const doc = contents.document;
        if (doc?.body) {
          doc.body.style.cssText = `
            width: 100% !important;
            margin: 0 !important;
            padding: 1.5rem 4rem 3rem 4rem !important;
            box-sizing: border-box !important;
            overflow-x: hidden !important;
            word-wrap: break-word !important;
          `;
        }
        // Dismiss popovers on click inside iframe
        doc.addEventListener('click', () => {
          const sel = contents.window.getSelection();
          if (!sel || sel.isCollapsed) {
            setSelectionToolbar(null);
            setWordPopover(null);
          }
        });

        // ── Save scroll position while reading ──────────────────
        // epub.js scrolled-doc mode doesn't fire 'relocated' on scroll
        // so we track scroll position ourselves and save CFI periodically
        let scrollSaveTimer: ReturnType<typeof setTimeout> | null = null;
        const scrollable = doc.querySelector('.epub-container') ?? contents.window;

        function onScroll() {
          if (scrollSaveTimer) clearTimeout(scrollSaveTimer);
          scrollSaveTimer = setTimeout(async () => {
            if (!mounted || !renditionRef.current) return;
            try {
              // Get the element currently visible at the top of viewport
              const scrollTop = (doc.documentElement?.scrollTop ?? doc.body?.scrollTop ?? 0);
              const viewHeight = contents.window.innerHeight ?? 600;
              const midY = scrollTop + viewHeight * 0.3;

              // Find element at that position
              const el = doc.elementFromPoint(
                contents.window.innerWidth / 2,
                viewHeight * 0.3
              ) as Element | null;

              if (el) {
                // Generate CFI from this element
                const cfi = renditionRef.current.epubcfi?.fromElement?.(el, contents.sectionIndex)
                  ?? renditionRef.current.currentLocation?.()?.start?.cfi;

                if (cfi) {
                  // Save to DB (debounced — only after 1.5s of no scrolling)
                  fetch('/api/books/progress', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      bookId: book.id,
                      cfi,
                      chapterIndex: currentChapterIndexRef.current ?? 0,
                      chapterTitle: '',
                      progressPercent: Math.round(
                        (epubBook.locations.percentageFromCfi?.(cfi) ?? 0) * 100
                      ),
                    }),
                  }).catch(() => {});
                }
              }
            } catch { /* ignore */ }
          }, 1500);
        }

        contents.window.addEventListener('scroll', onScroll, { passive: true });
        doc.addEventListener('scroll', onScroll, { passive: true });
      });

      rendition.on('relocated', async (location: any) => {
        if (!mounted) return;
        const cfi = location.start.cfi;
        const spineIdx = location.start.index ?? 0;
        
        // Find matching TOC index by comparing spinePos to current spine index
        let tocIdx = 0;
        for (let i = 0; i < chapterList.length; i++) {
          const pos = chapterList[i].spinePos;
          if (pos !== undefined && pos !== -1 && pos <= spineIdx) {
            tocIdx = i;
          }
        }
        
        const percent = Math.round(
          (epubBook.locations.percentageFromCfi?.(cfi) ?? 0) * 100
        );
        const chapterTitle = chapterList[tocIdx]?.title ?? '';
        setProgress(tocIdx, cfi, percent);
        currentChapterIndexRef.current = tocIdx;

        // Show completion screen when book is finished
        if (percent >= 100 && completionShownFor !== book.id) {
          setCompletionShownFor(book.id);
          setTimeout(() => setShowCompletion(true), 800);
        }

        try {
          const section = epubBook.spine.get(location.start.href);
          if (section) {
            const content = await section.load(epubBook.load.bind(epubBook));
            setChapterText(content.textContent ?? '');
          }
        } catch { /* ignore */ }

        fetch('/api/books/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookId: book.id, cfi, chapterIndex: tocIdx,
            chapterTitle, progressPercent: percent,
          }),
        }).catch(() => {});
      });

      rendition.on('selected', (cfiRange: string, contents: any) => {
        const selection = contents.window.getSelection();
        if (!selection || selection.isCollapsed) {
          setSelectionToolbar(null);
          setWordPopover(null);
          return;
        }
        const text = selection.toString().trim();
        if (!text || text.length < 2) return;

        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const iframeRect = contents.document.defaultView.frameElement?.getBoundingClientRect();
        const x = (iframeRect?.left ?? 0) + rect.left + rect.width / 2;
        const y = (iframeRect?.top ?? 0) + rect.top - 10;

        if (text.split(/\s+/).length === 1) {
          const paragraph = range.startContainer.parentElement?.textContent ?? '';
          setWordPopover({ x, y, word: text, paragraph });
          setSelectionToolbar(null);
        } else {
          setSelectionToolbar({ x, y, text, cfiRange });
          setWordPopover(null);
        }
      });

      for (const h of initialHighlights) {
        try {
          rendition.annotations.highlight(
            h.cfi_range, {}, undefined, 'hl',
            { fill: highlightColorHex(h.color), 'fill-opacity': '0.35' }
          );
        } catch { /* ignore */ }
      }
    }

    // Safety net — if loading takes more than 16s, show error
    const loadingTimeout = setTimeout(() => {
      if (!mounted) return;
      setIsLoading(false);
      setLoadError(true);
    }, 16000);

    initEpub()
      .catch((err) => {
        console.error('[Reader] initEpub error:', err);
        if (mounted) { setIsLoading(false); setLoadError(true); }
      })
      .finally(() => clearTimeout(loadingTimeout));

    return () => {
      mounted = false;
      clearTimeout(loadingTimeout);
      renditionRef.current?.destroy?.();
      bookRef.current?.destroy?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [epubUrl]);

  useEffect(() => {
    if (renditionRef.current) {
      applyTheme(renditionRef.current, theme, fontSize, lineHeight);
    }
  }, [theme, fontSize, lineHeight]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' || e.key === ']') renditionRef.current?.next();
      if (e.key === 'ArrowLeft'  || e.key === '[') renditionRef.current?.prev();
      if (e.ctrlKey && e.key === 'b') { e.preventDefault(); toggleChapterSidebar(); }
      if (e.ctrlKey && e.key === 'i') { e.preventDefault(); toggleAIPanel(); }
      if (e.key === 'Escape') { setSelectionToolbar(null); setWordPopover(null); }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [toggleChapterSidebar, toggleAIPanel]);

  async function goToChapter(chapter: ChapterInfo) {
    if (!renditionRef.current || !bookRef.current) return;

    const hrefBase = chapter.href.split('#')[0];

    try {
      // First display the chapter
      await renditionRef.current.display(hrefBase);

      // Only auto-advance for leaf chapters (not section headers like "Part I", "DEFCON 5")
      // Section headers have subitems in the TOC — leaf chapters do not
      const chapterDepth = (chapter as any).depth ?? 0;
      const hasChildren = chapters.some((c, ci) => {
        const idx = chapters.indexOf(chapter);
        return ci > idx && (c as any).depth > chapterDepth;
      });
      // Only auto-advance if it's a leaf chapter (no children follow it at deeper depth)
      const nextChapter = chapters[chapters.indexOf(chapter) + 1];
      const isSection = nextChapter && ((nextChapter as any).depth ?? 0) > chapterDepth;

      if (!isSection) {
        setTimeout(async () => {
          if (!renditionRef.current || !bookRef.current) return;
          try {
            const iframe = document.querySelector('#epub-viewer iframe') as HTMLIFrameElement;
            if (!iframe?.contentDocument) return;
            const body = iframe.contentDocument.body;
            if (!body) return;
            const text = (body.innerText ?? '').replace(/\s+/g, '').trim();
            // Only advance if truly empty (< 30 chars)
            if (text.length < 30) {
              const spineItems: any[] = [];
              bookRef.current!.spine.each((item: any) => spineItems.push(item));
              const currentIdx = spineItems.findIndex(
                item => item.href && (item.href.endsWith(hrefBase) || item.href === hrefBase
                  || hrefBase.endsWith(item.href))
              );
              if (currentIdx >= 0 && currentIdx + 1 < spineItems.length) {
                await renditionRef.current.display(spineItems[currentIdx + 1].href);
              }
            }
          } catch { /* ignore */ }
        }, 600);
      }

    } catch {
      // Fallback
      try { await renditionRef.current.display(chapter.href); } catch { /* ignore */ }
    }
  }

  async function saveHighlight(cfiRange: string, text: string, color: string, note?: string) {
    try {
      const res = await fetch('/api/highlights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: book.id, cfiRange, text, color, note,
          chapterIndex: currentChapterIndex,
          chapterTitle: chapters[currentChapterIndex]?.title,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      renditionRef.current?.annotations.highlight(
        cfiRange, {}, undefined, 'hl',
        { fill: highlightColorHex(color), 'fill-opacity': '0.35' }
      );
      setHighlights((prev) => [...prev, data.highlight]);
      setSelectionToolbar(null);
      toast.success('Highlight saved');
    } catch {
      toast.error('Failed to save highlight');
    }
  }

  const progressPercent = useReaderStore((s) => s.progressPercent);

  // ── Reading timer ────────────────────────────────────────────
  useEffect(() => {
    function startTimer() {
      if (timerRef.current) return;
      timerRef.current = setInterval(() => {
        sessionSecondsRef.current += 1;
        setSessionSeconds(s => s + 1);
      }, 1000);
    }

    function pauseTimer() {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    async function saveSession() {
      const dur = sessionSecondsRef.current;
      if (dur < 5) return;
      try {
        await fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookId: book.id, durationSeconds: dur }),
        });
      } catch { /* ignore */ }
    }

    // Start immediately
    startTimer();

    // Pause when tab hidden, resume when visible
    function onVisibilityChange() {
      if (document.hidden) pauseTimer();
      else startTimer();
    }
    document.addEventListener('visibilitychange', onVisibilityChange);

    // Save session on page unload
    function onUnload() {
      pauseTimer();
      saveSession();
    }
    window.addEventListener('beforeunload', onUnload);

    // Auto-save every 60s in case of crash
    const autoSave = setInterval(saveSession, 60000);

    return () => {
      pauseTimer();
      saveSession();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('beforeunload', onUnload);
      clearInterval(autoSave);
    };
  }, [book.id]);


  return (
    <div
      className="flex flex-col h-screen overflow-hidden"
      data-theme={theme}
      style={{ backgroundColor: themeBg, color: themeText }}
      onClick={() => { setSelectionToolbar(null); setWordPopover(null); }}
    >
      <style>{`
        #epub-viewer iframe {
          width: 100% !important;
          height: 100% !important;
          border: none !important;
        }
        #epub-viewer .epub-container {
          width: 100% !important;
          height: 100% !important;
          overflow-y: auto !important;
          overflow-x: hidden !important;
          scrollbar-width: thin !important;
          scrollbar-color: rgba(139,105,20,0.3) transparent !important;
        }
        /* Webkit scrollbar — thin, right edge, only visible on hover/scroll */
        #epub-viewer .epub-container::-webkit-scrollbar {
          width: 5px !important;
        }
        #epub-viewer .epub-container::-webkit-scrollbar-track {
          background: transparent !important;
        }
        #epub-viewer .epub-container::-webkit-scrollbar-thumb {
          background: rgba(139,105,20,0.3) !important;
          border-radius: 3px !important;
        }
        #epub-viewer .epub-container::-webkit-scrollbar-thumb:hover {
          background: rgba(139,105,20,0.6) !important;
        }
      `}</style>

      <ReaderTopBar
        book={book}
        chapterTitle={chapters[currentChapterIndex]?.title ?? ''}
        progressPercent={progressPercent}
        sessionSeconds={sessionSeconds}
        onQuiz={() => setShowQuiz(true)}
      />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile backdrop */}
        {isChapterSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/30 z-20 md:hidden"
            onClick={toggleChapterSidebar}
          />
        )}

        {/* Sidebar — overlay on mobile, inline on desktop */}
        <div
          className={cn(
            'overflow-hidden transition-all duration-300 ease-in-out',
            isChapterSidebarOpen
              ? 'fixed md:relative md:flex-none inset-y-0 left-0 z-30 md:z-auto w-56'
              : 'hidden md:block md:w-0'
          )}
          style={isChapterSidebarOpen && typeof window !== 'undefined' && window.innerWidth < 768 ? { top: '3rem' } : undefined}
        >
          <ChapterSidebar
            chapters={chapters}
            currentIndex={currentChapterIndex}
            onSelect={(ch) => {
              goToChapter(ch);
              if (typeof window !== 'undefined' && window.innerWidth < 768) {
                toggleChapterSidebar();
              }
            }}
            onQuiz={() => setShowQuiz(true)}
          />
        </div>

        {/* Reading column — wider, centered with transition */}
        <div
          className="reading-column flex-1 overflow-hidden transition-all duration-300 ease-in-out relative"
          style={{ backgroundColor: themeBg }}
        >
          <div
            className="w-full h-full relative max-w-[1050px] mx-auto"
          >
            {isLoading && !loadError && (
              <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                <div
                  className="w-6 h-6 border-2 rounded-full animate-spin"
                  style={{ borderColor: 'var(--border)', borderTopColor: '#8B6914' }}
                />
              </div>
            )}

            {loadError && (
              <div className="absolute inset-0 flex items-center justify-center z-10 p-8">
                <div className="text-center max-w-sm">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ backgroundColor: '#8B691415' }}>
                    <span className="text-2xl">📖</span>
                  </div>
                  <h3 className="font-semibold text-base mb-2"
                    style={{ fontFamily: 'Lora, Georgia, serif', color: 'var(--text-primary)' }}>
                    Unable to load this book
                  </h3>
                  <p className="text-sm mb-4 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    This EPUB uses a format that isn't fully supported. It may be a complex EPUB3 or have custom DRM.
                  </p>
                  <p className="text-xs mb-5 px-4 py-3 rounded-lg" style={{ backgroundColor: '#8B691410', color: '#8B6914' }}>
                    ✦ For best results, use EPUBs from{' '}
                    <a href="https://gutenberg.org" target="_blank" rel="noopener noreferrer"
                      className="underline font-medium">Project Gutenberg</a>{' '}
                    or{' '}
                    <a href="https://standardebooks.org" target="_blank" rel="noopener noreferrer"
                      className="underline font-medium">Standard Ebooks</a>
                  </p>
                  <a href="/library"
                    className="inline-block px-5 py-2.5 rounded-lg text-sm font-medium text-white"
                    style={{ backgroundColor: '#8B6914' }}>
                    Back to Library
                  </a>
                </div>
              </div>
            )}
            <div
              ref={viewerRef}
              id="epub-viewer"
              style={{ width: '100%', height: '100%', overflow: 'hidden' }}
            />
          </div>
        </div>

        {/* AI Panel with smooth transition */}
        <div
          className="flex-none overflow-hidden transition-all duration-300 ease-in-out h-full"
          style={{ width: isAIPanelOpen ? '20rem' : '0' }}
        >
          {isAIPanelOpen && (
            <AIPanel
              bookTitle={book.title}
              chapterText={chapterText}
              chapterTitle={chapters[currentChapterIndex]?.title ?? ''}
              onClose={() => useReaderStore.getState().toggleAIPanel()}
            />
          )}
        </div>
      </div>

      {!isAIPanelOpen && (
        <button
          onClick={(e) => { e.stopPropagation(); toggleAIPanel(); }}
          className="fixed bottom-6 right-6 w-11 h-11 rounded-full flex items-center justify-center text-white shadow-soft-lg transition-transform hover:scale-105 z-30"
          style={{ backgroundColor: '#8B6914' }}
          title="AI Assistant (Ctrl+I)"
        >
          <span className="text-base leading-none">✦</span>
        </button>
      )}

      {selectionToolbar && (
        <SelectionToolbar
          x={selectionToolbar.x}
          y={selectionToolbar.y}
          text={selectionToolbar.text}
          cfiRange={selectionToolbar.cfiRange}
          onHighlight={(color) => saveHighlight(selectionToolbar.cfiRange, selectionToolbar.text, color)}
          onAskAI={() => {
            useReaderStore.getState().setSelectedText(selectionToolbar.text, selectionToolbar.cfiRange);
            if (!isAIPanelOpen) toggleAIPanel();
            setSelectionToolbar(null);
          }}
          onClose={() => setSelectionToolbar(null)}
        />
      )}

      {wordPopover && (
        <WordPopover
          word={wordPopover.word}
          paragraph={wordPopover.paragraph}
          x={wordPopover.x}
          y={wordPopover.y}
          bookId={book.id}
          chapterIndex={currentChapterIndex}
          chapterTitle={chapters[currentChapterIndex]?.title}
          onClose={() => setWordPopover(null)}
          onAskAI={(word) => {
            useReaderStore.getState().setSelectedText(word, null);
            if (!isAIPanelOpen) toggleAIPanel();
            setWordPopover(null);
          }}
        />
      )}

      {showQuiz && (
        <ChapterQuiz
          bookId={book.id}
          chapterIndex={currentChapterIndex}
          chapterTitle={chapters[currentChapterIndex]?.title ?? ''}
          chapterText={chapterText}
          onClose={() => setShowQuiz(false)}
          userId={userId}
        />
      )}
      {/* Book completion celebration */}
      {showCompletion && (
        <CompletionScreen
          book={book}
          onContinueReading={() => setShowCompletion(false)}
        />
      )}
    </div>
  );
}

function applyTheme(rendition: any, theme: string, fontSize: number, lineHeight: number) {
  const bg   = { light: '#FAF8F4', sepia: '#F5EDD6', dark: '#1A1A1A' }[theme] ?? '#FAF8F4';
  const text = theme === 'dark' ? '#E8E6E0' : '#1C1C1E';

  rendition.themes.default({
    '*': { 'box-sizing': 'border-box' },
    'html': { 'overflow-x': 'hidden' },
    'body': {
      background: bg,
      color: text,
      'font-family': "'Lora', Georgia, serif",
      'font-size': `${fontSize}px`,
      'line-height': String(lineHeight),
      'width': '100%',
      'margin': '0 auto !important',
      'padding': '0',
      'box-sizing': 'border-box',
      'overflow-x': 'hidden',
      'word-wrap': 'break-word',
      'overflow-wrap': 'break-word',
    },
    'p, span, div, li': {
      'font-size': `${fontSize}px !important`,
      'line-height': `${lineHeight} !important`,
    },
    'p':   { margin: '0 0 1.2em 0 !important', 'overflow-wrap': 'break-word' },
    'h1':  { 'font-size': '1.6em !important',  'font-weight': 'bold !important', margin: '1.5em 0 0.75em !important', color: `${text} !important` },
    'h2':  { 'font-size': '1.35em !important', 'font-weight': 'bold !important', margin: '1.5em 0 0.75em !important', color: `${text} !important` },
    'h3':  { 'font-size': '1.15em !important', 'font-weight': 'bold !important', margin: '1.2em 0 0.6em !important',  color: `${text} !important` },
    'h4':  { 'font-size': '1.05em !important', 'font-weight': 'bold !important', margin: '1.2em 0 0.6em !important',  color: `${text} !important` },
    'h5':  { 'font-size': '1.0em !important',  'font-weight': 'bold !important', margin: '1.2em 0 0.6em !important',  color: `${text} !important` },
    'h6':  { 'font-size': '1.0em !important',  'font-weight': 'bold !important', margin: '1.2em 0 0.6em !important',  color: `${text} !important` },
    'a':   { color: '#8B6914', 'text-decoration': 'none' },
    'a:hover': { color: '#8B6914 !important', 'text-decoration': 'underline !important', 'background-color': 'transparent !important' },
    'img': { 'max-width': '100% !important', height: 'auto !important' },
  });
}

