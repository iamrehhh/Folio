import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ReaderState, ReadingTheme, ReadingFontFamily, AIMessage } from '@/types';

export const useReaderStore = create<ReaderState>()(
  persist(
    (set) => ({
      // Book state
      bookId: null,
      currentChapterIndex: 0,
      currentCfi: null,
      progressPercent: 0,

      // Panel visibility
      isChapterSidebarOpen: true,
      isAIPanelOpen: false,
      isHighlightsPanelOpen: false,
      isAIPanelPinned: false,

      // Reading preferences
      theme: 'light' as ReadingTheme,
      fontFamily: 'default' as ReadingFontFamily,
      fontSize: 17,
      lineHeight: 1.8,
      continuousReading: false,

      // Active interactions
      selectedText: null,
      selectedCfiRange: null,
      aiMessages: [],
      activeHighlightId: null,

      // ── Actions ──────────────────────────────────────

      setTheme: (theme: ReadingTheme) => set({ theme }),

      setFontFamily: (fontFamily: ReadingFontFamily) => set({ fontFamily }),

      setFontSize: (fontSize: number) => set({ fontSize }),

      setLineHeight: (lineHeight: number) => set({ lineHeight }),

      setContinuousReading: (continuousReading: boolean) => set({ continuousReading }),

      toggleChapterSidebar: () =>
        set((s) => ({ isChapterSidebarOpen: !s.isChapterSidebarOpen })),

      toggleAIPanel: () =>
        set((s) => ({
          isAIPanelOpen: !s.isAIPanelOpen,
          isHighlightsPanelOpen: s.isAIPanelOpen ? s.isHighlightsPanelOpen : false,
        })),

      toggleHighlightsPanel: () =>
        set((s) => ({
          isHighlightsPanelOpen: !s.isHighlightsPanelOpen,
          isAIPanelOpen: s.isHighlightsPanelOpen ? s.isAIPanelOpen : false,
        })),

      setSelectedText: (selectedText: string | null, selectedCfiRange: string | null) =>
        set({ selectedText, selectedCfiRange }),

      addAIMessage: (msg: AIMessage) =>
        set((s) => ({ aiMessages: [...s.aiMessages, msg] })),

      updateLastAIMessage: (content: string) =>
        set((s) => {
          const msgs = [...s.aiMessages];
          if (msgs.length > 0 && msgs[msgs.length - 1].role === 'assistant') {
            msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content };
          }
          return { aiMessages: msgs };
        }),

      clearAIMessages: () => set({ aiMessages: [] }),

      setProgress: (currentChapterIndex: number, currentCfi: string, progressPercent: number) =>
        set({ currentChapterIndex, currentCfi, progressPercent }),
    }),
    {
      name: 'reader-preferences',
      // Only persist reading preferences, not ephemeral UI state
      partialize: (state) => ({
        theme: state.theme,
        fontFamily: state.fontFamily,
        fontSize: state.fontSize,
        lineHeight: state.lineHeight,
        continuousReading: state.continuousReading,
        isChapterSidebarOpen: state.isChapterSidebarOpen,
      }),
      // FIX: onRehydrateStorage lets us know when the store is done loading from localStorage
      onRehydrateStorage: () => (state) => {
        // This is called after hydration completes — the store will have the correct theme
        // The ReaderClient listens via useReaderStore.persist.onFinishHydration
      },
    }
  )
);
