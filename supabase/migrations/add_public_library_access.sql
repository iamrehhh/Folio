-- Migration: Add public library access control (Showcase Mode)
-- Adds per-user flag to control who sees the full public library,
-- and a showcase flag on books to mark universally visible books.

-- 1. Add per-user flag to control public library access
-- Default false = user only sees showcase books in public library
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='can_view_all_public_books') THEN
        ALTER TABLE public.profiles ADD COLUMN can_view_all_public_books BOOLEAN NOT NULL DEFAULT false;
    END IF;
END $$;

-- 2. Add showcase flag to books
-- When true, the book is visible to ALL users in the public library regardless of their access level
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='books' AND column_name='is_showcase') THEN
        ALTER TABLE public.books ADD COLUMN is_showcase BOOLEAN NOT NULL DEFAULT false;
    END IF;
END $$;
