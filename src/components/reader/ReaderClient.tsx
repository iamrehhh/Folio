'use client';

import { useEffect, useRef, useState } from 'react';
import { useReaderStore } from '@/lib/store';
import ReaderTopBar from './ReaderTopBar';
import ChapterSidebar from './ChapterSidebar';
import SelectionToolbar from './SelectionToolbar';
import WordPopover from './WordPopover';
import AIPanel from './AIPanel';
import ChapterQuiz from './ChapterQuiz';
import type { Book, ReadingProgress, Highlight, Profile, ChapterInfo } from '@/types';
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

      try {
        // Generate locations for accurate progress calculation
        await epubBook.locations.generate(1600);
      } catch (err) {
        console.error('Failed to generate locations:', err);
      }

      const nav = epubBook.navigation;
      const toc = nav?.toc ?? [];
      const chapterList: ChapterInfo[] = toc.map((item: any, i: number) => {
        const spineItem = epubBook.spine.get(item.href);
        return {
          index: i,
          title: item.label?.trim() ?? `Chapter ${i + 1}`,
          href: item.href,
          spinePos: spineItem ? spineItem.index : -1,
        };
      });
      setChapters(chapterList);

      if (initialProgress?.cfi) {
        await rendition.display(initialProgress.cfi);
      } else {
        await rendition.display();
      }

      setIsLoading(false);

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
            padding: 3rem 5rem !important;
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
            { fill: highlightHex(h.color), 'fill-opacity': '0.35' }
          );
        } catch { /* ignore */ }
      }
    }

    initEpub().catch(console.error);

    return () => {
      mounted = false;
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

  function goToChapter(chapter: ChapterInfo) {
    renditionRef.current?.display(chapter.href);
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
        { fill: highlightHex(color), 'fill-opacity': '0.35' }
      );
      setHighlights((prev) => [...prev, data.highlight]);
      setSelectionToolbar(null);
      toast.success('Highlight saved');
    } catch {
      toast.error('Failed to save highlight');
    }
  }

  const progressPercent = useReaderStore((s) => s.progressPercent);

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
        }
        #epub-viewer .epub-container::-webkit-scrollbar { width: 6px; }
        #epub-viewer .epub-container::-webkit-scrollbar-thumb {
          background: #C4BDB4; border-radius: 3px;
        }
      `}</style>

      <ReaderTopBar
        book={book}
        chapterTitle={chapters[currentChapterIndex]?.title ?? ''}
        progressPercent={progressPercent}
        onQuiz={() => setShowQuiz(true)}
      />

      <div className="flex flex-1 overflow-hidden">
        {isChapterSidebarOpen && (
          <ChapterSidebar
            chapters={chapters}
            currentIndex={currentChapterIndex}
            onSelect={goToChapter}
            onQuiz={() => setShowQuiz(true)}
          />
        )}

        {/* Reading column — wider, centered with transition */}
        <div
          className="flex-1 overflow-hidden transition-all duration-300 ease-in-out"
          style={{ backgroundColor: themeBg }}
        >
          <div
            className="w-full h-full relative max-w-[1050px] mx-auto"
          >
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                <div
                  className="w-6 h-6 border-2 rounded-full animate-spin"
                  style={{ borderColor: 'var(--border)', borderTopColor: '#8B6914' }}
                />
              </div>
            )}
            <div
              ref={viewerRef}
              id="epub-viewer"
              className="w-full h-full overflow-hidden"
            />
          </div>
        </div>

        {isAIPanelOpen && (
          <AIPanel
            bookTitle={book.title}
            chapterText={chapterText}
            chapterTitle={chapters[currentChapterIndex]?.title ?? ''}
            onClose={() => useReaderStore.getState().toggleAIPanel()}
          />
        )}
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
    </div>
  );
}

function applyTheme(rendition: any, theme: string, fontSize: number, lineHeight: number) {
  const bg   = { light: '#FAF8F4', sepia: '#F5EDD6', dark: '#1A1A1A' }[theme] ?? '#FAF8F4';
  const text = theme === 'dark' ? '#E8E6E0' : '#1C1C1E';

  rendition.themes.default({
    '*': { 'box-sizing': 'border-box' },
    '*:hover': { 'color': 'inherit !important', 'background-color': 'transparent !important' },
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

function highlightHex(color: string): string {
  return ({ yellow: '#FFE066', blue: '#93C5FD', green: '#86EFAC', pink: '#F9A8D4' } as any)[color] ?? '#FFE066';
}
