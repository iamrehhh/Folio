-- ================================================================
-- Kindle Reading App — Supabase Schema
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New query)
-- ================================================================

-- Enable UUID extension (usually already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────
-- PROFILES (extends auth.users)
-- ─────────────────────────────────────────────
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  reading_theme TEXT NOT NULL DEFAULT 'light' CHECK (reading_theme IN ('light', 'sepia', 'dark')),
  font_size INTEGER NOT NULL DEFAULT 17 CHECK (font_size BETWEEN 14 AND 22),
  line_height NUMERIC(3,1) NOT NULL DEFAULT 1.8 CHECK (line_height BETWEEN 1.4 AND 2.2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on sign up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ─────────────────────────────────────────────
-- BOOKS
-- ─────────────────────────────────────────────
CREATE TABLE public.books (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  cover_url TEXT,
  epub_path TEXT NOT NULL, -- path in Supabase Storage bucket 'books'
  genre TEXT,
  description TEXT,
  total_chapters INTEGER,
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id),
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- READING PROGRESS
-- ─────────────────────────────────────────────
CREATE TABLE public.reading_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  cfi TEXT NOT NULL, -- EPUB CFI position
  chapter_index INTEGER NOT NULL DEFAULT 0,
  chapter_title TEXT,
  progress_percent NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, book_id)
);

-- ─────────────────────────────────────────────
-- HIGHLIGHTS
-- ─────────────────────────────────────────────
CREATE TABLE public.highlights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  cfi_range TEXT NOT NULL, -- EPUB CFI range for the selection
  text TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'yellow' CHECK (color IN ('yellow', 'blue', 'green', 'pink')),
  note TEXT,
  chapter_index INTEGER NOT NULL DEFAULT 0,
  chapter_title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX highlights_user_book ON public.highlights(user_id, book_id);

-- ─────────────────────────────────────────────
-- VOCABULARY
-- ─────────────────────────────────────────────
CREATE TABLE public.vocab_words (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  definition TEXT NOT NULL,
  pronunciation TEXT,
  part_of_speech TEXT,
  ai_context TEXT, -- AI explanation of word in this specific context
  source_sentence TEXT,
  chapter_index INTEGER NOT NULL DEFAULT 0,
  chapter_title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, word, book_id)
);

CREATE INDEX vocab_user_id ON public.vocab_words(user_id);
CREATE INDEX vocab_user_book ON public.vocab_words(user_id, book_id);

-- ─────────────────────────────────────────────
-- QUIZ RESULTS
-- ─────────────────────────────────────────────
CREATE TABLE public.quiz_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  chapter_index INTEGER NOT NULL,
  chapter_title TEXT,
  score INTEGER NOT NULL CHECK (score >= 0),
  total_questions INTEGER NOT NULL DEFAULT 10,
  answers JSONB NOT NULL DEFAULT '[]',
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- READING SESSIONS
-- ─────────────────────────────────────────────
CREATE TABLE public.reading_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER
);

CREATE INDEX sessions_user_id ON public.reading_sessions(user_id);
CREATE INDEX sessions_user_date ON public.reading_sessions(user_id, started_at);

-- ─────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vocab_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_sessions ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update their own
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Books: authenticated can only select their own or default ones; only uploader can insert/update/delete
CREATE POLICY "books_select_own" ON public.books FOR SELECT USING (auth.uid() = uploaded_by OR is_default = true);
CREATE POLICY "books_insert_own" ON public.books FOR INSERT WITH CHECK (auth.uid() = uploaded_by);
CREATE POLICY "books_update_own" ON public.books FOR UPDATE USING (auth.uid() = uploaded_by);
CREATE POLICY "books_delete_own" ON public.books FOR DELETE USING (auth.uid() = uploaded_by);

-- Reading progress: own only
CREATE POLICY "progress_own" ON public.reading_progress FOR ALL USING (auth.uid() = user_id);

-- Highlights: own only
CREATE POLICY "highlights_own" ON public.highlights FOR ALL USING (auth.uid() = user_id);

-- Vocab: own only
CREATE POLICY "vocab_own" ON public.vocab_words FOR ALL USING (auth.uid() = user_id);

-- Quiz results: own only
CREATE POLICY "quiz_own" ON public.quiz_results FOR ALL USING (auth.uid() = user_id);

-- Sessions: own only
CREATE POLICY "sessions_own" ON public.reading_sessions FOR ALL USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- STORAGE BUCKETS
-- Run these via Supabase Dashboard > Storage, or via the JS client
-- ─────────────────────────────────────────────

-- Bucket: 'books' (private — EPUBs)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('books', 'books', false);

-- Bucket: 'covers' (public — cover images)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('covers', 'covers', true);

-- Storage policies for 'books' bucket:
-- Allow authenticated users to read any book file
-- Allow only uploaders (admin role) to insert

-- ─────────────────────────────────────────────
-- USEFUL VIEWS
-- ─────────────────────────────────────────────

-- Currently reading + book info in one query
CREATE VIEW public.currently_reading AS
SELECT
  rp.*,
  b.title,
  b.author,
  b.cover_url,
  b.genre,
  b.total_chapters
FROM public.reading_progress rp
JOIN public.books b ON b.id = rp.book_id
WHERE rp.progress_percent < 100
ORDER BY rp.last_read_at DESC;
