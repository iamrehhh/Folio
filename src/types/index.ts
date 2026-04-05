// ─────────────────────────────────────────────
// Database row types (mirrors Supabase schema)
// ─────────────────────────────────────────────

export type ReadingTheme = 'light' | 'sepia' | 'dark';
export type HighlightColor = 'yellow' | 'blue' | 'green' | 'pink';

export interface Profile {
  id: string; // = auth.users.id
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  reading_theme: ReadingTheme;
  font_size: number; // 14–22
  line_height: number; // 1.4–2.2
  gamify_score: number;
  created_at: string;
  updated_at: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  cover_url: string | null;
  epub_path: string; // Supabase Storage path
  genre: string | null;
  description: string | null;
  total_chapters: number | null;
  uploaded_by: string; // profile id (admin)
  is_default: boolean;
  created_at: string;
}

export interface ReadingProgress {
  id: string;
  user_id: string;
  book_id: string;
  cfi: string; // EPUB CFI — exact position
  chapter_index: number;
  chapter_title: string | null;
  progress_percent: number; // 0–100
  last_read_at: string;
  // joined
  book?: Book;
}

export interface Highlight {
  id: string;
  user_id: string;
  book_id: string;
  cfi_range: string; // EPUB CFI range
  text: string; // highlighted text
  color: HighlightColor;
  note: string | null;
  chapter_index: number;
  chapter_title: string | null;
  created_at: string;
  // joined
  book?: Book;
}

export interface VocabWord {
  id: string;
  user_id: string;
  book_id: string;
  word: string;
  definition: string;
  pronunciation: string | null;
  part_of_speech: string | null;
  ai_context: string | null; // AI explanation in context of book
  source_sentence: string | null; // sentence the word was found in
  chapter_index: number;
  chapter_title: string | null;
  created_at: string;
  // joined
  book?: Book;
}

export interface QuizResult {
  id: string;
  user_id: string;
  book_id: string;
  chapter_index: number;
  chapter_title: string | null;
  score: number; // 0–10
  total_questions: number;
  answers: QuizAnswer[];
  completed_at: string;
}

export interface QuizAnswer {
  question: string;
  options: string[];
  selected_index: number;
  correct_index: number;
}

export interface ReadingSession {
  id: string;
  user_id: string;
  book_id: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
}

export interface BookSchedule {
  id: string;
  user_id: string;
  book_id: string;
  scheduled_for: string; // DATE
  created_at: string;
}

export interface GamifyMastery {
  id: string;
  user_id: string;
  word: string;
  type: 'vocab' | 'idiom';
  times_seen: number;
  correct_count: number;
  last_seen_at: string;
}

// ─────────────────────────────────────────────
// API / UI types
// ─────────────────────────────────────────────

export interface DictionaryEntry {
  word: string;
  phonetic?: string;
  meanings: {
    partOfSpeech: string;
    definitions: {
      definition: string;
      example?: string;
    }[];
  }[];
}

export interface QuizQuestion {
  question: string;
  options: string[]; // 4 options
  correctIndex: number;
}

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChapterInfo {
  index: number;
  title: string;
  href: string;
  spinePos?: number;
}

export interface ReadingStats {
  booksCompletedThisMonth: number;
  booksCompletedThisYear: number;
  booksCompletedAllTime: number;
  readingStreakDays: number;
  avgSessionMinutes: number;
}

// ─────────────────────────────────────────────
// Reader store (Zustand)
// ─────────────────────────────────────────────

export interface ReaderState {
  // Book + progress
  bookId: string | null;
  currentChapterIndex: number;
  currentCfi: string | null;
  progressPercent: number;

  // UI panels
  isChapterSidebarOpen: boolean;
  isAIPanelOpen: boolean;
  isHighlightsPanelOpen: boolean;
  isAIPanelPinned: boolean;

  // Reading preferences (also in DB via profile)
  theme: ReadingTheme;
  fontSize: number;
  lineHeight: number;

  // Active interactions
  selectedText: string | null;
  selectedCfiRange: string | null;
  aiMessages: AIMessage[];
  activeHighlightId: string | null;

  // Actions
  setTheme: (theme: ReadingTheme) => void;
  setFontSize: (size: number) => void;
  setLineHeight: (lh: number) => void;
  toggleChapterSidebar: () => void;
  toggleAIPanel: () => void;
  toggleHighlightsPanel: () => void;
  setSelectedText: (text: string | null, cfi: string | null) => void;
  addAIMessage: (msg: AIMessage) => void;
  clearAIMessages: () => void;
  setProgress: (chapter: number, cfi: string, percent: number) => void;
}
