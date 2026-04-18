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
import HighlightToolbar from './HighlightToolbar';
import CompletionScreen from './CompletionScreen';
import toast from 'react-hot-toast';

interface Props {
  book: Book;
  epubUrl: string;
  initialProgress: ReadingProgress | null;
  initialHighlights: Highlight[];
  profile: Profile | null;
  userId: string;
  jumpToCfi?: string;
}

export default function ReaderClient({
  book, epubUrl, initialProgress, initialHighlights, profile, userId, jumpToCfi
}: Props) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<any>(null);
  const renditionRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [chapters, setChapters] = useState<ChapterInfo[]>([]);
  const [highlights, setHighlights] = useState<Highlight[]>(initialHighlights);
  const highlightsRef = useRef<Highlight[]>(initialHighlights);
  const [chapterText, setChapterText] = useState('');
  const [showQuiz, setShowQuiz] = useState(false);
  const [highlightToolbar, setHighlightToolbar] = useState<{
    x: number; y: number; cfiRange: string;
  } | null>(null);
  const currentChapterIndexRef = useRef(0);
  const locationsReadyRef = useRef(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [completionShownFor, setCompletionShownFor] = useState<string | null>(null);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const sessionSecondsRef = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionStartRef = useRef<number>(Date.now());
  const [loadError, setLoadError] = useState(false);
  const [showNextChapterOverlay, setShowNextChapterOverlay] = useState(false);
  const [chapterTransition, setChapterTransition] = useState<'idle' | 'exit-next' | 'exit-prev' | 'enter-next' | 'enter-prev' | 'crossfade-exit' | 'crossfade-enter'>('idle');
  const chapterTransitionRef = useRef('idle');
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isNavigatingRef = useRef(false);

  // FIX 1: Track store hydration to avoid white flash on theme refresh
  const [storeHydrated, setStoreHydrated] = useState(false);

  const [selectionToolbar, setSelectionToolbar] = useState<{
    x: number; y: number; text: string; cfiRange: string; contextParagraph: string;
  } | null>(null);

  const [wordPopover, setWordPopover] = useState<{
    x: number; y: number; word: string; paragraph: string;
  } | null>(null);

  const {
    theme, fontFamily, fontSize, lineHeight, continuousReading,
    isChapterSidebarOpen, isAIPanelOpen,
    currentChapterIndex, setProgress,
    toggleChapterSidebar, toggleAIPanel,
  } = useReaderStore();

  // FIX 1: Wait for Zustand persisted store to rehydrate before rendering
  // This prevents the white flash when theme is sepia/dark
  useEffect(() => {
    // useReaderStore.persist is available because we use persist middleware
    const unsub = useReaderStore.persist?.onFinishHydration?.(() => {
      setStoreHydrated(true);
    });
    // Also check if already hydrated (fast path)
    if (useReaderStore.persist?.hasHydrated?.()) {
      setStoreHydrated(true);
    } else {
      // Fallback: mark hydrated after a short tick even if API isn't available
      const t = setTimeout(() => setStoreHydrated(true), 50);
      return () => {
        clearTimeout(t);
        unsub?.();
      };
    }
    return () => unsub?.();
  }, []);

  const themeBg = { light: '#FAF8F4', sepia: '#F5EDD6', dark: '#1A1A1A' }[theme];
  const themeText = { light: '#1C1C1E', sepia: '#1C1C1E', dark: '#D4C5A0' }[theme];

  // FIX 1: Use CSS variable fallback so the wrapper color matches theme immediately
  // even before JS hydration, by reading from data-theme attribute on <html>
  const resolvedBg = storeHydrated ? themeBg : 'var(--bg, #FAF8F4)';
  const resolvedText = storeHydrated ? themeText : 'var(--text-primary, #1C1C1E)';

  // FIX 2: Last known mouse position from inside the iframe (for highlight toolbar)
  const lastIframeMouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    if (!storeHydrated || !viewerRef.current) return;
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

      applyTheme(rendition, theme, fontFamily, fontSize, lineHeight);

      await epubBook.ready;
      if (!mounted) return;

      const nav = epubBook.navigation;
      const toc = nav?.toc ?? [];

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

      // jumpToCfi takes priority (from "Jump to passage" in highlights)
      const targetCfi = jumpToCfi || initialProgress?.cfi;

      // epub.js range CFIs look like epubcfi(/6/4!/4,/2/1:0,/2/1:15)
      // rendition.display() needs just the base CFI without the range part
      // Extract the start position: base + first range component
      function cfiForDisplay(cfi: string): string {
        if (!cfi) return cfi;
        // Match: epubcfi( base , startRange , endRange )
        const rangeMatch = cfi.match(/^(epubcfi\([^,]+),([^,]+),([^)]+\))$/);
        if (rangeMatch) {
          // Reconstruct as: epubcfi( base + startRange )
          const base = rangeMatch[1]; // e.g. "epubcfi(/6/4!/4"
          const startPart = rangeMatch[2]; // e.g. "/2/1:0"
          return base + startPart + ')';
        }
        return cfi;
      }

      let displayOk = false;
      const displayCfi = targetCfi ? cfiForDisplay(targetCfi) : undefined;

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

        // Inject Google Fonts into the iframe so custom fonts are available
        if (doc?.head && !doc.getElementById('folio-gfonts')) {
          const link = doc.createElement('link');
          link.id = 'folio-gfonts';
          link.rel = 'stylesheet';
          link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Merriweather:ital,wght@0,300;0,400;0,700;1,400';
          doc.head.appendChild(link);
        }

        // FIX 2: Track mouse position inside iframe for accurate toolbar placement
        doc.addEventListener('mousemove', (e: MouseEvent) => {
          const iframeEl = viewerRef.current?.querySelector('iframe') as HTMLIFrameElement | null;
          const iframeRect = iframeEl?.getBoundingClientRect();
          lastIframeMouseRef.current = {
            x: (iframeRect?.left ?? 0) + e.clientX,
            y: (iframeRect?.top ?? 0) + e.clientY,
          };
        }, { passive: true });

        // FIX 2: Detect highlight clicks by checking SVG fill colors
        // epub.js renders highlights as SVG <rect> elements with the highlight color as fill
        doc.addEventListener('click', (e: MouseEvent) => {
          const target = e.target as SVGElement | HTMLElement;
          const iframeEl = viewerRef.current?.querySelector('iframe') as HTMLIFrameElement | null;
          const iframeRect = iframeEl?.getBoundingClientRect();
          const absX = (iframeRect?.left ?? 0) + e.clientX;
          const absY = (iframeRect?.top ?? 0) + e.clientY;

          // Walk up the DOM tree looking for highlight marks
          let el: Element | null = target;
          while (el && el !== doc.body) {
            const tagName = el.tagName?.toLowerCase();
            const fill = el.getAttribute('fill') ?? '';
            const className = el.getAttribute('class') ?? '';

            // epub.js highlight SVG rects have the fill color set directly
            const highlightHexValues = ['FFE066', '93C5FD', '86EFAC', 'F87171'];
            const isHighlightRect = (tagName === 'rect' || tagName === 'path') &&
              highlightHexValues.some(hex => fill.toUpperCase().includes(hex.toUpperCase()));

            // epub.js also wraps in a <g> with class 'epubjs-hl'  
            const isHighlightGroup = tagName === 'g' && (
              className.includes('epubjs-hl') ||
              className.includes('highlight') ||
              el.querySelector?.(`rect[fill]`) !== null
            );

            if (isHighlightRect || isHighlightGroup) {
              // Find which highlight this belongs to by checking CFI data
              // Try to get CFI from the element or its parent SVG group
              let cfi: string | null = null;

              // epub.js stores CFI as title attribute or data attribute on the group
              let groupEl: Element | null = el;
              while (groupEl && groupEl !== doc.body) {
                cfi = groupEl.getAttribute('data-epubcfi')
                  ?? groupEl.getAttribute('title')
                  ?? groupEl.getAttribute('data-cfi')
                  ?? null;
                if (cfi) break;
                groupEl = groupEl.parentElement;
              }

              if (!cfi) {
                // Fallback: find the closest highlight by mouse position
                // Check all known highlight CFI ranges and use the first one
                const currentHighlights = highlightsRef.current;
                if (currentHighlights.length > 0) {
                  // Use the most recently added/visible highlight as fallback
                  // Try to find one whose SVG element contains the click point
                  const svgGroups = doc.querySelectorAll('g[data-epubcfi], g[title]') as NodeListOf<Element>;
                  for (const group of Array.from(svgGroups)) {
                    const rect = group.getBoundingClientRect();
                    if (rect && e.clientX >= rect.left && e.clientX <= rect.right &&
                      e.clientY >= rect.top && e.clientY <= rect.bottom) {
                      cfi = group.getAttribute('data-epubcfi') ?? group.getAttribute('title');
                      if (cfi) break;
                    }
                  }
                }
              }

              if (cfi) {
                e.stopPropagation();
                setHighlightToolbar({ x: absX, y: absY, cfiRange: cfi });
                setSelectionToolbar(null);
                setWordPopover(null);
                return;
              }
              // Even if no CFI found, we know they clicked a highlight area
              // so don't clear the toolbar
              return;
            }
            el = el.parentElement;
          }

          // Not a highlight click — clear toolbar if selection is collapsed
          const sel = contents.window.getSelection();
          if (!sel || sel.isCollapsed) {
            setSelectionToolbar(null);
            setWordPopover(null);
            setHighlightToolbar(null);
          }
        });

        // ── Bottom-of-chapter advance detection ──
        // Strategy: detect when user is at the very bottom of the epub-container.
        // For continuous mode: wait 1s at bottom before auto-advancing (so user can read last line).
        // For manual mode: show "Next Chapter" button immediately.
        let scrollSaveTimer: ReturnType<typeof setTimeout> | null = null;
        let bottomAdvanceTimer: ReturnType<typeof setTimeout> | null = null;

        function isAtChapterBottom(): boolean {
          // Try epub-container first (main scroll element in scrolled-doc mode)
          const container = viewerRef.current?.querySelector('.epub-container') as HTMLElement | null;
          if (container) {
            // If the content is smaller than the container, we're naturally at the bottom
            if (container.scrollHeight <= container.clientHeight + 5) return true;
            const gap = container.scrollHeight - container.scrollTop - container.clientHeight;
            return gap < 40;
          }
          // Fallback: check iframe scroll
          try {
            const wind = contents.window;
            const d = contents.document;
            const sh = Math.max(d.body.scrollHeight, d.documentElement.scrollHeight);
            if (sh <= wind.innerHeight + 5) return true;
            const gap = sh - wind.scrollY - wind.innerHeight;
            return gap < 40;
          } catch { }
          return false;
        }

        function handleBottomCheck() {
          if (isNavigatingRef.current) return;

          if (isAtChapterBottom()) {
            const state = useReaderStore.getState();
            if (state.continuousReading) {
              // Debounce: auto-advance after 2s of being at bottom
              if (!bottomAdvanceTimer) {
                bottomAdvanceTimer = setTimeout(() => {
                  if (isAtChapterBottom() && !isNavigatingRef.current) {
                    isNavigatingRef.current = true;
                    navigateChapter('next');
                  }
                  bottomAdvanceTimer = null;
                }, 2000); // 2 second pause allows time to read short title pages
              }
            } else {
              // Manual mode: show button immediately
              setShowNextChapterOverlay(true);
            }
          } else {
            // Scrolled away from bottom — cancel any pending advance
            if (bottomAdvanceTimer) {
              clearTimeout(bottomAdvanceTimer);
              bottomAdvanceTimer = null;
            }
            // Only HIDE the button if user scrolled significantly away (200px+)
            // This prevents the button from flickering on tiny scroll adjustments
            let farFromBottom = false;

            const container = viewerRef.current?.querySelector('.epub-container') as HTMLElement | null;
            if (container) {
              if (container.scrollHeight > container.clientHeight + 50) {
                const gap = container.scrollHeight - container.scrollTop - container.clientHeight;
                farFromBottom = gap > 200;
              }
            } else {
              try {
                const wind = contents.window;
                const d = contents.document;
                const sh = Math.max(d.body.scrollHeight, d.documentElement.scrollHeight);
                if (sh > wind.innerHeight + 50) {
                  const gap = sh - wind.scrollY - wind.innerHeight;
                  farFromBottom = gap > 200;
                }
              } catch { }
            }

            if (farFromBottom) {
              setShowNextChapterOverlay(false);
            }
          }
        }

        function onScroll() {
          if (scrollSaveTimer) clearTimeout(scrollSaveTimer);
          handleBottomCheck();

          scrollSaveTimer = setTimeout(async () => {
            if (!mounted || !renditionRef.current) return;
            try {
              const viewHeight = contents.window.innerHeight ?? 600;
              const el = doc.elementFromPoint(
                contents.window.innerWidth / 2,
                viewHeight * 0.3
              ) as Element | null;

              if (el) {
                const cfi = renditionRef.current.epubcfi?.fromElement?.(el, contents.sectionIndex)
                  ?? renditionRef.current.currentLocation?.()?.start?.cfi;

                if (cfi) {
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
                  }).catch(() => { });
                }
              }
            } catch { /* ignore */ }
          }, 1500);
        }

        // Attach to epub-container (the actual scrolling element)
        const epubContainer = viewerRef.current?.querySelector('.epub-container') as HTMLElement | null;
        if (epubContainer) {
          epubContainer.addEventListener('scroll', onScroll, { passive: true });
          epubContainer.addEventListener('wheel', (e: WheelEvent) => {
            if (e.deltaY > 0) handleBottomCheck();
          }, { passive: true });
          epubContainer.addEventListener('touchend', () => {
            handleBottomCheck();
          }, { passive: true });
        }
        // Fallback: iframe scroll
        contents.window.addEventListener('scroll', onScroll, { passive: true });
        doc.addEventListener('scroll', onScroll, { passive: true });
        doc.addEventListener('mousemove', () => window.dispatchEvent(new Event('folio-activity')));
        doc.addEventListener('keydown', () => window.dispatchEvent(new Event('folio-activity')));
        doc.addEventListener('click', () => window.dispatchEvent(new Event('folio-activity')));
        doc.addEventListener('touchstart', () => window.dispatchEvent(new Event('folio-activity')));
        doc.addEventListener('wheel', (e: WheelEvent) => {
          if (e.deltaY > 0) handleBottomCheck();
        }, { passive: true });
      });

      rendition.on('relocated', async (location: any) => {
        window.dispatchEvent(new Event('folio-activity'));
        if (!mounted) return;
        isNavigatingRef.current = false;

        const cfi = location.start.cfi;
        const spineIdx = location.start.index ?? 0;

        let tocIdx = 0;
        for (let i = 0; i < chapterList.length; i++) {
          const pos = chapterList[i].spinePos;
          if (pos !== undefined && pos !== -1 && pos <= spineIdx) {
            tocIdx = i;
          }
        }

        let percent: number;
        if (locationsReadyRef.current) {
          percent = Math.round(
            (epubBook.locations.percentageFromCfi?.(cfi) ?? 0) * 100
          );
        } else {
          percent = initialProgress?.progress_percent ?? 0;
        }
        const chapterTitle = chapterList[tocIdx]?.title ?? '';
        setProgress(tocIdx, cfi, percent);
        currentChapterIndexRef.current = tocIdx;

        if (percent >= 100 && completionShownFor !== book.id) {
          // Progress is 100%, but we wait until the user finishes reading
          // the last page (i.e. tries to advance past the last section)
          // before showing the rating popup.
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
        }).catch(() => { });
      });

      rendition.on('selected', (cfiRange: string, contents: any) => {
        window.dispatchEvent(new Event('folio-activity'));
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

        // Capture the surrounding paragraph NOW while selection is still active
        let contextParagraph = '';
        try {
          let node: Node | null = range.startContainer;
          const doc = contents.document;
          while (node && node !== doc.body) {
            const el = node.nodeType === Node.ELEMENT_NODE ? node as HTMLElement : node.parentElement;
            if (el) {
              const tag = el.tagName?.toLowerCase();
              if (tag === 'p' || tag === 'div' || tag === 'blockquote' || tag === 'li') {
                contextParagraph = el.textContent?.trim() ?? '';
                break;
              }
            }
            node = node.parentNode;
          }
          if (!contextParagraph) {
            contextParagraph = range.startContainer.parentElement?.textContent?.trim() ?? '';
          }
        } catch { /* ignore */ }

        if (text.split(/\s+/).length === 1) {
          const paragraph = range.startContainer.parentElement?.textContent ?? '';
          setWordPopover({ x, y, word: text, paragraph });
          setSelectionToolbar(null);
        } else {
          setSelectionToolbar({ x, y, text, cfiRange, contextParagraph });
          setWordPopover(null);
        }
      });

      // FIX 2: Also listen to markClicked for epub.js versions that support it reliably
      rendition.on('markClicked', (cfiRange: string, _data: any) => {
        const isOurHighlight = highlightsRef.current.some(h => h.cfi_range === cfiRange);
        if (isOurHighlight) {
          const pos = lastIframeMouseRef.current;
          setHighlightToolbar({ x: pos.x, y: pos.y, cfiRange });
          setSelectionToolbar(null);
          setWordPopover(null);
        }
      });

      await Promise.race([
        (displayCfi
          ? rendition.display(displayCfi).then(() => {
            displayOk = true;
          })
          : rendition.display()
        ).then(() => { displayOk = true; }),
        new Promise<void>((_, reject) =>
          setTimeout(() => reject(new Error('display timeout')), 8000)
        ),
      ]).catch(async (err) => {
        console.warn('[Reader] display failed, retrying:', err.message);
        if (!mounted || !viewerRef.current) return;
        renditionRef.current?.destroy?.();
        viewerRef.current.innerHTML = '';

        const fallback = epubBook.renderTo(viewerRef.current!, {
          width: '100%', height: '100%', spread: 'none',
          flow: 'scrolled', allowScriptedContent: true,
        });
        renditionRef.current = fallback;
        applyTheme(fallback, theme, fontFamily, fontSize, lineHeight);

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

      // After navigating to a highlight via jumpToCfi, scroll the annotation into view
      if (jumpToCfi && displayOk) {
        setTimeout(() => {
          try {
            const iframe = viewerRef.current?.querySelector('iframe') as HTMLIFrameElement | null;
            const iframeDoc = iframe?.contentDocument;
            if (iframeDoc) {
              // epub.js renders highlights as SVG elements with the epubjs-hl class
              const hlElements = iframeDoc.querySelectorAll('.epubjs-hl');
              if (hlElements.length > 0) {
                // Find the highlight matching our CFI by checking data attributes
                let targetEl: Element | null = null;
                for (const el of Array.from(hlElements)) {
                  const elCfi = el.getAttribute('data-epubcfi') ?? el.closest('g')?.getAttribute('data-epubcfi') ?? '';
                  if (elCfi === jumpToCfi) {
                    targetEl = el;
                    break;
                  }
                }
                // Fallback: use the first highlight on the page
                if (!targetEl) targetEl = hlElements[0];

                // Scroll into view smoothly
                targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });

                // Add a brief pulse animation to draw attention
                const rect = targetEl.closest('g') ?? targetEl;
                if (rect instanceof SVGElement || rect instanceof HTMLElement) {
                  rect.style.transition = 'opacity 0.3s';
                  rect.style.opacity = '1';
                  setTimeout(() => { rect.style.opacity = '0.35'; }, 1500);
                  setTimeout(() => { rect.style.opacity = '1'; }, 2000);
                  setTimeout(() => { rect.style.opacity = '0.35'; }, 2500);
                }
              }
            }
          } catch { /* ignore scroll-to-highlight errors */ }
        }, 800);
      }

      setTimeout(() => {
        if (!mounted) return;

        const cacheKey = `folio_locations_${book.id}`;
        let cachedLocations = null;
        
        try {
          cachedLocations = localStorage.getItem(cacheKey);
        } catch { /* ignore */ }

        if (cachedLocations) {
          try {
            epubBook.locations.load(cachedLocations);
            locationsReadyRef.current = true;
            const currentCfi = initialProgress?.cfi;
            if (currentCfi) {
              const accuratePercent = Math.round(
                (epubBook.locations.percentageFromCfi?.(currentCfi) ?? 0) * 100
              );
              if (accuratePercent > 0) {
                setProgress(currentChapterIndexRef.current, currentCfi, accuratePercent);
              }
            }
            return;
          } catch (err) {
            console.error('[Reader] Failed to load cached locations', err);
            // Fallthrough to generation
          }
        }

        epubBook.locations.generate(1000).then(() => {
          if (!mounted) return;
          try {
            const locationsToCache = epubBook.locations.save();
            localStorage.setItem(cacheKey, locationsToCache);
          } catch (err) {
            console.error('[Reader] Failed to cache locations', err);
          }
          
          locationsReadyRef.current = true;
          const currentCfi = initialProgress?.cfi;
          if (currentCfi) {
            const accuratePercent = Math.round(
              (epubBook.locations.percentageFromCfi?.(currentCfi) ?? 0) * 100
            );
            if (accuratePercent > 0) {
              setProgress(currentChapterIndexRef.current, currentCfi, accuratePercent);
            }
          }
        }).catch(() => {
          locationsReadyRef.current = true;
        });
      }, 500);

      for (const h of initialHighlights) {
        try {
          rendition.annotations.highlight(
            h.cfi_range, {}, undefined, 'hl',
            { fill: highlightColorHex(h.color), 'fill-opacity': '0.35' }
          );
        } catch { /* ignore */ }
      }
    }

    const loadingTimeout = setTimeout(() => {
      if (!mounted) return;
      setIsLoading(false);
      setLoadError(true);
    }, 16000);

    let resizeTimer: NodeJS.Timeout;
    function onWindowResize() {
      if (!mounted || !renditionRef.current) return;
      clearTimeout(resizeTimer);

      let currentCfi = renditionRef.current.currentLocation()?.start?.cfi;
      try {
        const iframe = viewerRef.current?.querySelector('iframe') as HTMLIFrameElement | null;
        if (iframe?.contentDocument && iframe.contentWindow) {
          const wind = iframe.contentWindow;
          const doc = iframe.contentDocument;
          const viewHeight = wind.innerHeight ?? 600;
          const el = doc.elementFromPoint(wind.innerWidth / 2, viewHeight * 0.3);
          if (el) {
            const sectionIndex = renditionRef.current.location?.start?.index ?? currentChapterIndexRef.current;
            currentCfi = renditionRef.current.epubcfi?.fromElement?.(el, sectionIndex) ?? currentCfi;
          }
        }
      } catch { /* ignore */ }

      resizeTimer = setTimeout(() => {
        if (!mounted || !renditionRef.current) return;
        try {
          renditionRef.current.resize();
          if (currentCfi) {
            renditionRef.current.display(currentCfi);
          }
        } catch (e) { }
      }, 300);
    }
    window.addEventListener('resize', onWindowResize);

    initEpub()
      .catch((err) => {
        console.error('[Reader] initEpub error:', err);
        if (mounted) { setIsLoading(false); setLoadError(true); }
      })
      .finally(() => clearTimeout(loadingTimeout));

    return () => {
      mounted = false;
      clearTimeout(loadingTimeout);
      clearTimeout(resizeTimer);
      if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
      window.removeEventListener('resize', onWindowResize);
      renditionRef.current?.destroy?.();
      bookRef.current?.destroy?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [epubUrl, storeHydrated, jumpToCfi]);

  useEffect(() => {
    if (renditionRef.current) {
      applyTheme(renditionRef.current, theme, fontFamily, fontSize, lineHeight);
    }
  }, [theme, fontFamily, fontSize, lineHeight]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' || e.key === ']') navigateChapter('next');
      if (e.key === 'ArrowLeft' || e.key === '[') navigateChapter('prev');
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') { e.preventDefault(); toggleChapterSidebar(); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'i') { e.preventDefault(); toggleAIPanel(); }
      if (e.key === 'Escape') { setSelectionToolbar(null); setWordPopover(null); }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [toggleChapterSidebar, toggleAIPanel]);

  async function goToChapter(chapter: ChapterInfo) {
    if (!renditionRef.current || !bookRef.current) return;
    if (chapterTransitionRef.current !== 'idle') return;

    const hrefBase = chapter.href.split('#')[0];

    // Scroll the epub container to top before transitioning
    const epubContainer = viewerRef.current?.querySelector('.epub-container') as HTMLElement | null;

    // Phase 1: Crossfade exit
    chapterTransitionRef.current = 'crossfade-exit';
    setChapterTransition('crossfade-exit');

    if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);

    await new Promise<void>((resolve) => {
      transitionTimeoutRef.current = setTimeout(resolve, 220);
    });

    // Phase 2: Navigate while content is invisible
    try {
      await renditionRef.current.display(hrefBase);

      const chapterDepth = (chapter as any).depth ?? 0;
      const nextChapter = chapters[chapters.indexOf(chapter) + 1];
      const isSection = nextChapter && ((nextChapter as any).depth ?? 0) > chapterDepth;

      if (!isSection) {
        // Check if the displayed chapter has meaningful content
        try {
          const iframe = document.querySelector('#epub-viewer iframe') as HTMLIFrameElement;
          if (iframe?.contentDocument) {
            const body = iframe.contentDocument.body;
            const text = (body?.innerText ?? '').replace(/\s+/g, '').trim();
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
          }
        } catch { /* ignore */ }
      }
    } catch {
      try { await renditionRef.current.display(chapter.href); } catch { /* ignore */ }
    }

    // Scroll to top of new chapter
    if (epubContainer) {
      epubContainer.scrollTop = 0;
    }

    // Phase 3: Crossfade enter
    chapterTransitionRef.current = 'crossfade-enter';
    setChapterTransition('crossfade-enter');

    transitionTimeoutRef.current = setTimeout(() => {
      chapterTransitionRef.current = 'idle';
      setChapterTransition('idle');
    }, 350);
  }

  function navigateChapter(direction: 'next' | 'prev') {
    if (!renditionRef.current || chapterTransitionRef.current !== 'idle') return;

    const exitState = direction === 'next' ? 'exit-next' : 'exit-prev';
    const enterState = direction === 'next' ? 'enter-next' : 'enter-prev';

    if (direction === 'next') {
      let isLastSpine = false;
      if (bookRef.current) {
        const location = renditionRef.current.currentLocation?.();
        const spineIdx = location?.start?.index ?? 0;
        const spineItems: any[] = [];
        bookRef.current.spine.each((item: any) => spineItems.push(item));
        if (spineIdx >= spineItems.length - 1) {
          isLastSpine = true;
        }
      }

      if (isLastSpine) {
        if (completionShownFor !== book.id) {
          setCompletionShownFor(book.id);
          setShowCompletion(true);
        }
        return;
      }
    }

    chapterTransitionRef.current = exitState;
    setChapterTransition(exitState);
    setShowNextChapterOverlay(false);

    if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);

    transitionTimeoutRef.current = setTimeout(() => {
      if (direction === 'next') {
        renditionRef.current?.next();
      } else {
        renditionRef.current?.prev();
      }

      chapterTransitionRef.current = enterState;
      setChapterTransition(enterState);

      transitionTimeoutRef.current = setTimeout(() => {
        chapterTransitionRef.current = 'idle';
        setChapterTransition('idle');
      }, 300);
    }, 250);
  }

  async function saveHighlight(cfiRange: string, text: string, color: string, contextParagraph?: string, note?: string) {
    try {
      const res = await fetch('/api/highlights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: book.id, cfiRange, text, color, note,
          chapterIndex: currentChapterIndex,
          chapterTitle: chapters[currentChapterIndex]?.title,
          contextParagraph: contextParagraph || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      renditionRef.current?.annotations.highlight(
        cfiRange, {}, undefined, 'hl',
        { fill: highlightColorHex(color), 'fill-opacity': '0.35' }
      );
      highlightsRef.current = [...highlightsRef.current, data.highlight];
      setHighlights((prev) => [...prev, data.highlight]);
      setSelectionToolbar(null);
      toast.success('Highlight saved');
    } catch {
      toast.error('Failed to save highlight');
    }
  }

  async function deleteHighlight(cfiRange: string) {
    const highlight = highlights.find(h => h.cfi_range === cfiRange)
      ?? highlights.find(h =>
        (h.cfi_range && cfiRange && (h.cfi_range.includes(cfiRange) || cfiRange.includes(h.cfi_range)))
      );

    try { renditionRef.current?.annotations.remove(cfiRange, 'highlight'); } catch { /* ignore */ }
    if (highlight?.cfi_range && highlight.cfi_range !== cfiRange) {
      try { renditionRef.current?.annotations.remove(highlight.cfi_range, 'highlight'); } catch { /* ignore */ }
    }

    setHighlightToolbar(null);
    if (highlight) {
      setHighlights(prev => prev.filter(h => h.id !== highlight.id));
      highlightsRef.current = highlightsRef.current.filter((h: any) => h.id !== highlight.id);
    }
    toast.success('Highlight removed');

    if (highlight) {
      fetch(`/api/highlights/${highlight.id}`, { method: 'DELETE' }).catch(() => { });
    }
  }

  const progressPercent = useReaderStore((s) => s.progressPercent);

  // Reading timer
  useEffect(() => {
    let lastActivity = Date.now();
    const IDLE_TIMEOUT_MS = 120_000; // 2 minutes

    function updateActivity() {
      lastActivity = Date.now();
    }

    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('click', updateActivity);
    window.addEventListener('touchstart', updateActivity);
    window.addEventListener('scroll', updateActivity, { passive: true });
    window.addEventListener('folio-activity', updateActivity);

    function startTimer() {
      if (timerRef.current) return;
      lastActivity = Date.now(); // reset on start
      timerRef.current = setInterval(() => {
        if (document.hidden) return;
        if (Date.now() - lastActivity > IDLE_TIMEOUT_MS) return;
        
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

    // Track what we've already saved to avoid double-counting
    let lastSavedSeconds = 0;
    // Guard against double-save on unload (beforeunload + cleanup both fire)
    let didSaveOnUnload = false;

    // Save via fetch (for periodic auto-saves and visibility changes)
    async function saveSessionFetch() {
      const dur = sessionSecondsRef.current - lastSavedSeconds;
      if (dur < 5) return;
      lastSavedSeconds = sessionSecondsRef.current;
      try {
        await fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookId: book.id, durationSeconds: dur }),
        });
      } catch { /* ignore */ }
    }

    // Save via sendBeacon (for unload — reliable, fire-and-forget)
    function saveSessionBeacon() {
      if (didSaveOnUnload) return;
      const dur = sessionSecondsRef.current - lastSavedSeconds;
      if (dur < 5) return;
      didSaveOnUnload = true;
      lastSavedSeconds = sessionSecondsRef.current;
      try {
        navigator.sendBeacon(
          '/api/sessions',
          new Blob(
            [JSON.stringify({ bookId: book.id, durationSeconds: dur })],
            { type: 'application/json' }
          )
        );
      } catch { /* ignore */ }
    }

    startTimer();

    function saveProgressOnExit() {
      if (!renditionRef.current || !book.id) return;
      try {
        let cfi = renditionRef.current.currentLocation()?.start?.cfi;
        const iframe = viewerRef.current?.querySelector('iframe') as HTMLIFrameElement | null;
        if (iframe?.contentDocument && iframe.contentWindow) {
          const wind = iframe.contentWindow;
          const doc = iframe.contentDocument;
          const viewHeight = wind.innerHeight ?? 600;
          const el = doc.elementFromPoint(wind.innerWidth / 2, viewHeight * 0.3);
          if (el) {
            const sectionIndex = renditionRef.current.location?.start?.index ?? currentChapterIndexRef.current;
            cfi = renditionRef.current.epubcfi?.fromElement?.(el, sectionIndex) ?? cfi;
          }
        }

        if (cfi) {
          const percent = bookRef.current?.locations ? Math.round((bookRef.current.locations.percentageFromCfi?.(cfi) ?? 0) * 100) : useReaderStore.getState().progressPercent;
          navigator.sendBeacon(
            '/api/books/progress',
            new Blob(
              [JSON.stringify({
                bookId: book.id,
                cfi,
                chapterIndex: currentChapterIndexRef.current ?? 0,
                chapterTitle: '',
                progressPercent: percent,
              })],
              { type: 'application/json' }
            )
          );
        }
      } catch { /* ignore */ }
    }

    function onVisibilityChange() {
      if (document.hidden) {
        pauseTimer();
        saveSessionFetch();
        saveProgressOnExit();
      } else {
        startTimer();
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange);

    function onUnload() {
      pauseTimer();
      saveSessionBeacon();
      saveProgressOnExit();
    }
    window.addEventListener('beforeunload', onUnload);

    const autoSave = setInterval(saveSessionFetch, 60000);

    return () => {
      pauseTimer();
      // On cleanup, use beacon if beforeunload didn't already fire
      saveSessionBeacon();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('beforeunload', onUnload);
      clearInterval(autoSave);

      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('touchstart', updateActivity);
      window.removeEventListener('scroll', updateActivity);
      window.removeEventListener('folio-activity', updateActivity);
    };
  }, [book.id]);

  // FIX 1: Don't render the reader wrapper until store is hydrated
  // Show a theme-colored placeholder to prevent the white flash
  if (!storeHydrated) {
    return (
      <div
        className="flex flex-col h-screen overflow-hidden"
        style={{ backgroundColor: 'var(--bg, #FAF8F4)' }}
      />
    );
  }

  return (
    <div
      className="flex flex-col h-screen overflow-hidden"
      data-theme={theme}
      style={{ backgroundColor: resolvedBg, color: resolvedText, transition: 'background-color 0.3s ease, color 0.3s ease' }}
      onClick={() => { setSelectionToolbar(null); setWordPopover(null); setHighlightToolbar(null); }}
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
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px) translateX(-50%); }
          to   { opacity: 1; transform: translateY(0) translateX(-50%); }
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
        {isChapterSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/30 z-20 md:hidden"
            onClick={toggleChapterSidebar}
          />
        )}

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

        <div
          className="reading-column flex-1 overflow-hidden transition-all duration-300 ease-in-out relative"
          style={{ backgroundColor: resolvedBg, transition: 'background-color 0.3s ease' }}
        >
          <div className="w-full h-full relative max-w-[1050px] mx-auto">
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
              style={{
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                ...(chapterTransition === 'exit-next' ? { animation: 'chapterExitNext 0.25s ease-in forwards' } :
                  chapterTransition === 'exit-prev' ? { animation: 'chapterExitPrev 0.25s ease-in forwards' } :
                    chapterTransition === 'enter-next' ? { animation: 'chapterEnterNext 0.3s ease-out forwards' } :
                      chapterTransition === 'enter-prev' ? { animation: 'chapterEnterPrev 0.3s ease-out forwards' } :
                        chapterTransition === 'crossfade-exit' ? { animation: 'crossfadeExit 0.22s cubic-bezier(0.4, 0, 1, 1) forwards' } :
                          chapterTransition === 'crossfade-enter' ? { animation: 'crossfadeEnter 0.35s cubic-bezier(0, 0, 0.2, 1) forwards' } :
                            {}),
              }}
            />
          </div>

          {/* ── Chapter Nav Rail: Previous (left margin) ── */}
          {!isLoading && currentChapterIndex > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); navigateChapter('prev'); }}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 opacity-[0.12] hover:opacity-100 hover:scale-110 active:scale-95 hidden xl:flex"
              style={{
                backgroundColor: 'var(--bg-card, #fff)',
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)',
              }}
              title="Previous Chapter"
            >
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 4l-4 4 4 4" /></svg>
            </button>
          )}

          {/* ── Chapter Nav Rail: Next (right margin) ── */}
          {!isLoading && (
            <button
              onClick={(e) => { e.stopPropagation(); navigateChapter('next'); }}
              className={`absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 active:scale-95 hidden xl:flex ${showNextChapterOverlay && !continuousReading
                  ? 'opacity-100 scale-110'
                  : 'opacity-[0.12] hover:opacity-100 hover:scale-110'
                }`}
              style={{
                backgroundColor: showNextChapterOverlay && !continuousReading ? '#8B6914' : 'var(--bg-card, #fff)',
                border: showNextChapterOverlay && !continuousReading ? '1px solid #8B6914' : '1px solid var(--border)',
                color: showNextChapterOverlay && !continuousReading ? '#fff' : 'var(--text-secondary)',
                ...(showNextChapterOverlay && !continuousReading ? { animation: 'navPulse 2s ease-in-out infinite' } : {}),
              }}
              title="Next Chapter"
            >
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4l4 4-4 4" /></svg>
            </button>
          )}
        </div>

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
          onHighlight={(color) => saveHighlight(selectionToolbar.cfiRange, selectionToolbar.text, color, selectionToolbar.contextParagraph)}
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

      {highlightToolbar && (
        <HighlightToolbar
          x={highlightToolbar.x}
          y={highlightToolbar.y}
          onDelete={() => deleteHighlight(highlightToolbar.cfiRange)}
          onClose={() => setHighlightToolbar(null)}
        />
      )}

      {/* Mobile fallback: bottom center button (hidden on xl+ where rail buttons show) */}
      {showNextChapterOverlay && !continuousReading && (
        <div
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 xl:hidden"
          style={{ animation: 'fadeSlideUp 0.3s ease-out' }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigateChapter('next');
            }}
            className="px-6 py-3 rounded-full shadow-2xl text-white font-bold transition-transform hover:scale-110 active:scale-95 flex items-center gap-2"
            style={{ backgroundImage: 'linear-gradient(to right, #8B6914, #6a4f0f)' }}
          >
            Next Chapter <span className="text-xl leading-none">➔</span>
          </button>
        </div>
      )}

      {showCompletion && (
        <CompletionScreen
          book={book}
          onContinueReading={() => setShowCompletion(false)}
        />
      )}
    </div>
  );
}

function applyTheme(rendition: any, theme: string, fontFamily: string, fontSize: number, lineHeight: number) {
  const bg = { light: '#FAF8F4', sepia: '#F5EDD6', dark: '#1A1A1A' }[theme] ?? '#FAF8F4';
  const text = theme === 'dark' ? '#D4C5A0' : '#1C1C1E';

  const THEME_NAME = 'folio';

  // Google Fonts URL to inject into iframes so non-system fonts are available
  const GOOGLE_FONTS_URL = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Merriweather:ital,wght@0,300;0,400;0,700;1,400';

  // Step 1: Immediately paint every existing iframe so the user never sees white.
  // Also inject Google Fonts <link> into each iframe so custom fonts are available.
  try {
    const views = rendition.manager?.views?._views ?? rendition.manager?.views ?? [];
    const viewList = Array.isArray(views) ? views : (typeof views.forEach === 'function' ? Array.from(views) : []);
    for (const view of viewList) {
      const doc = view?.document ?? view?.iframe?.contentDocument;
      if (!doc) continue;
      if (doc.documentElement) {
        doc.documentElement.style.setProperty('background', bg, 'important');
      }
      if (doc.body) {
        doc.body.style.setProperty('background', bg, 'important');
        doc.body.style.setProperty('color', text, 'important');
      }
      // Inject Google Fonts into the iframe if not already present
      if (doc.head && !doc.getElementById('folio-gfonts')) {
        const link = doc.createElement('link');
        link.id = 'folio-gfonts';
        link.rel = 'stylesheet';
        link.href = GOOGLE_FONTS_URL;
        doc.head.appendChild(link);
      }
    }
  } catch { /* best-effort */ }

  // Step 2: Register + select the single named theme. Using a fixed name
  // ensures epub.js overwrites the previous rules instead of stacking.
  const fontStyle = {
    default: "'Lora', Georgia, serif",
    inter: "'Inter', system-ui, sans-serif",
    merriweather: "'Merriweather', serif",
    'comic-sans': "'Comic Sans MS', 'Chalkboard SE', sans-serif",
    arial: "Arial, sans-serif"
  }[fontFamily] || "'Lora', Georgia, serif";

  const rules: Record<string, Record<string, string>> = {
    '*': { 'box-sizing': 'border-box' },
    'html': { 'overflow-x': 'hidden', 'background': `${bg} !important` },
    'body': {
      'background': `${bg} !important`,
      'color': `${text} !important`,
      'font-family': `${fontStyle} !important`,
      'font-size': `${fontSize}px`,
      'line-height': String(lineHeight),
      'width': '100%',
      'margin': '0 auto !important',
      'padding': '0',
      'box-sizing': 'border-box',
      'overflow-x': 'hidden',
      'word-wrap': 'break-word',
      'overflow-wrap': 'break-word'
    },
    'p, span, div, li': {
      'color': `${text} !important`,
      'font-family': `${fontStyle} !important`,
      'font-size': `${fontSize}px !important`,
      'line-height': `${lineHeight} !important`,
    },
    'p': { 'margin': '0 0 1.2em 0 !important', 'overflow-wrap': 'break-word' },
    'h1': { 'font-size': '1.6em !important', 'font-weight': 'bold !important', 'margin': '1.5em 0 0.75em !important', 'color': `${text} !important` },
    'h2': { 'font-size': '1.35em !important', 'font-weight': 'bold !important', 'margin': '1.5em 0 0.75em !important', 'color': `${text} !important` },
    'h3': { 'font-size': '1.15em !important', 'font-weight': 'bold !important', 'margin': '1.2em 0 0.6em !important', 'color': `${text} !important` },
    'h4': { 'font-size': '1.05em !important', 'font-weight': 'bold !important', 'margin': '1.2em 0 0.6em !important', 'color': `${text} !important` },
    'h5': { 'font-size': '1.0em !important', 'font-weight': 'bold !important', 'margin': '1.2em 0 0.6em !important', 'color': `${text} !important` },
    'h6': { 'font-size': '1.0em !important', 'font-weight': 'bold !important', 'margin': '1.2em 0 0.6em !important', 'color': `${text} !important` },
    'a': { 'color': '#8B6914', 'text-decoration': 'none' },
    'a:hover': { 'color': '#8B6914 !important', 'text-decoration': 'underline !important', 'background-color': 'transparent !important' },
    'img': { 'max-width': '100% !important', 'height': 'auto !important' },
  };

  rendition.themes.register(THEME_NAME, rules);
  rendition.themes.select(THEME_NAME);
}
