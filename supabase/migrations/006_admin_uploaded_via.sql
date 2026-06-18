-- ================================================================
-- Migration: Add uploaded_via column to books table
-- Distinguishes admin uploads from personal (library) uploads.
-- Default is 'library' so existing books are unaffected.
-- ================================================================

ALTER TABLE public.books 
ADD COLUMN IF NOT EXISTS uploaded_via TEXT NOT NULL DEFAULT 'library' 
CHECK (uploaded_via IN ('library', 'admin'));

-- Add index for efficient filtering
CREATE INDEX IF NOT EXISTS books_uploaded_via_idx ON public.books(uploaded_via);
