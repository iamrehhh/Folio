import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ReaderState, ReadingTheme, AIMessage } from '@/types';

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
      fontSize: 17,
      lineHeight: 1.8,

      // Active interactions
      selectedText: null,
      selectedCfiRange: null,
      aiMessages: [],
      activeHighlightId: null,

      // ── Actions ──────────────────────────────────────

      setTheme: (theme: ReadingTheme) => set({ theme }),

      setFontSize: (fontSize: number) => set({ fontSize }),

      setLineHeight: (lineHeight: number) => set({ lineHeight }),

      toggleChapterSidebar: () =>
        set((s) => ({ isChapterSidebarOpen: !s.isChapterSidebarOpen })),

      toggleAIPanel: () =>
        set((s) => ({
          isAIPanelOpen: !s.isAIPanelOpen,
          // Close highlights panel when opening AI
          isHighlightsPanelOpen: s.isAIPanelOpen ? s.isHighlightsPanelOpen : false,
        })),

      toggleHighlightsPanel: () =>
        set((s) => ({
          isHighlightsPanelOpen: !s.isHighlightsPanelOpen,
          // Close AI panel when opening highlights
          isAIPanelOpen: s.isHighlightsPanelOpen ? s.isAIPanelOpen : false,
        })),

      setSelectedText: (selectedText: string | null, selectedCfiRange: string | null) =>
        set({ selectedText, selectedCfiRange }),

      addAIMessage: (msg: AIMessage) =>
        set((s) => ({ aiMessages: [...s.aiMessages, msg] })),

      clearAIMessages: () => set({ aiMessages: [] }),

      setProgress: (currentChapterIndex: number, currentCfi: string, progressPercent: number) =>
        set({ currentChapterIndex, currentCfi, progressPercent }),
    }),
    {
      name: 'reader-preferences',
      // Only persist reading preferences, not ephemeral UI state
      partialize: (state) => ({
        theme: state.theme,
        fontSize: state.fontSize,
        lineHeight: state.lineHeight,
        isChapterSidebarOpen: state.isChapterSidebarOpen,
      }),
    }
  )
);
