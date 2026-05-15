-- ─── Bookmarks Table ───────────────────────────
-- Multiple bookmarks per user per book.
-- Stores the EPUB CFI position so the user can jump back to where they left off.

CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  cfi TEXT NOT NULL,
  chapter_index INTEGER NOT NULL DEFAULT 0,
  chapter_title TEXT,
  progress_percent INTEGER NOT NULL DEFAULT 0,
  label TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Row Level Security
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own bookmarks"
  ON bookmarks
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- If you already ran the previous migration with UNIQUE(user_id, book_id),
-- run this to drop the constraint:
-- ALTER TABLE bookmarks DROP CONSTRAINT IF EXISTS bookmarks_user_id_book_id_key;
