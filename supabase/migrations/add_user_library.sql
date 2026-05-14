-- Migration: Add user_library table for personal book curation
-- Only books the user has UPLOADED are auto-added. Public books must be explicitly added.

-- 1. Create user_library table
CREATE TABLE IF NOT EXISTS public.user_library (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, book_id)
);

-- 2. Enable RLS
ALTER TABLE public.user_library ENABLE ROW LEVEL SECURITY;

-- 3. Policy: users manage their own library entries only
CREATE POLICY "user_library_own" ON public.user_library
  FOR ALL USING (auth.uid() = user_id);

-- 4. Indexes for fast lookups
CREATE INDEX IF NOT EXISTS user_library_user_id ON public.user_library(user_id);
CREATE INDEX IF NOT EXISTS user_library_book_id ON public.user_library(book_id);

-- 5. Clean slate: remove everything, then only seed uploaded books
DELETE FROM public.user_library;

INSERT INTO public.user_library (user_id, book_id)
SELECT uploaded_by, id FROM public.books
ON CONFLICT (user_id, book_id) DO NOTHING;
