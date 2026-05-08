-- ==========================================
-- SUPABASE PERFORMANCE OPTIMIZATION SCRIPT
-- ==========================================
-- Run this script in your Supabase SQL Editor to apply missing indexes and performance functions.

-- 1. Create an RPC function to aggregate reading time efficiently.
-- This replaces the Node.js memory-heavy sum operation.
CREATE OR REPLACE FUNCTION get_user_total_reading_time(user_uuid UUID)
RETURNS BIGINT
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(SUM(duration_seconds), 0)
  FROM public.reading_sessions
  WHERE user_id = user_uuid;
$$;

-- 2. Add missing indexes for common foreign keys and lookup queries.
-- These will drastically reduce DB Disk IO by replacing sequential scans with index scans.

CREATE INDEX IF NOT EXISTS idx_reading_sessions_user_id ON public.reading_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_progress_user_id ON public.reading_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_progress_user_book ON public.reading_progress(user_id, book_id);
CREATE INDEX IF NOT EXISTS idx_highlights_user_id ON public.highlights(user_id);
CREATE INDEX IF NOT EXISTS idx_highlights_user_book ON public.highlights(user_id, book_id);
CREATE INDEX IF NOT EXISTS idx_vocab_words_user_id ON public.vocab_words(user_id);
CREATE INDEX IF NOT EXISTS idx_book_access_user_id ON public.book_access(user_id);
CREATE INDEX IF NOT EXISTS idx_books_uploaded_by ON public.books(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_book_schedules_user_id ON public.book_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_book_ratings_user_id ON public.book_ratings(user_id);

-- Optional: Index for retrieving active system notifications efficiently
CREATE INDEX IF NOT EXISTS idx_system_notifications_active ON public.system_notifications(is_active) WHERE is_active = true;

-- Optional: Index for fast lookup of unread admin messages
CREATE INDEX IF NOT EXISTS idx_bug_reports_unread ON public.bug_reports(user_id, has_unread_admin_message) WHERE has_unread_admin_message = true;
