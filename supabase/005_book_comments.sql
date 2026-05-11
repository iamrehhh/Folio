-- ================================================================
-- Book Comments with Threading Support
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New query)
-- ================================================================

-- ─────────────────────────────────────────────
-- BOOK COMMENTS (threaded via parent_id)
-- ─────────────────────────────────────────────
CREATE TABLE public.book_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.book_comments(id) ON DELETE CASCADE,  -- NULL = top-level, set = reply
  content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX book_comments_book_id_idx ON public.book_comments(book_id);
CREATE INDEX book_comments_parent_id_idx ON public.book_comments(parent_id);
CREATE INDEX book_comments_user_id_idx ON public.book_comments(user_id);
CREATE INDEX book_comments_created_at_idx ON public.book_comments(book_id, created_at DESC);

-- Auto-update updated_at
CREATE TRIGGER book_comments_updated_at
  BEFORE UPDATE ON public.book_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ─────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────
ALTER TABLE public.book_comments ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read all comments
CREATE POLICY "book_comments_select_all" ON public.book_comments
  FOR SELECT USING (true);

-- Authenticated users can insert their own comments
CREATE POLICY "book_comments_insert_own" ON public.book_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own comments
CREATE POLICY "book_comments_update_own" ON public.book_comments
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "book_comments_delete_own" ON public.book_comments
  FOR DELETE USING (auth.uid() = user_id);
