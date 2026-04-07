-- ============================================================
-- Fix: Book Visibility RLS Policy
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- Safe & idempotent — can be re-run without issues.
-- ============================================================

-- 1. Drop ALL old SELECT policies on books (clean slate)
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'books_select_own' AND tablename = 'books') THEN
        DROP POLICY books_select_own ON public.books;
    END IF;
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'books_granular_access' AND tablename = 'books') THEN
        DROP POLICY books_granular_access ON public.books;
    END IF;
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'books_visibility_access' AND tablename = 'books') THEN
        DROP POLICY books_visibility_access ON public.books;
    END IF;
END $$;

-- 2. Create the single correct SELECT policy
--    A user can see a book if:
--      a) They uploaded it
--      b) It has 'public' visibility
--      c) It has 'assigned' visibility AND they have a row in book_access
CREATE POLICY books_visibility_access ON public.books
    FOR SELECT USING (
        auth.uid() = uploaded_by
        OR visibility = 'public'
        OR (
            visibility = 'assigned'
            AND EXISTS (
                SELECT 1 FROM public.book_access ba
                WHERE ba.book_id = id
                  AND ba.user_id = auth.uid()
            )
        )
    );
