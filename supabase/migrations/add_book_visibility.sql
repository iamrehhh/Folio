-- Migration: Add granular book access control
-- Safe, idempotent execution checking for existing structures.

-- 1. Create a custom visibility ENUM if it doesn't exist
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'book_visibility_level') THEN
        CREATE TYPE book_visibility_level AS ENUM ('private', 'public', 'assigned');
    END IF;
END $$;

-- 2. Add visibility column to books table (safely)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='books' AND column_name='visibility') THEN
        ALTER TABLE public.books ADD COLUMN visibility book_visibility_level NOT NULL DEFAULT 'private';
        
        -- Migrate old 'is_default' logic
        UPDATE public.books SET visibility = 'public' WHERE is_default = true;
    END IF;
END $$;

-- 3. Create the book_access junction table for fine-grained assignments
CREATE TABLE IF NOT EXISTS public.book_access (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    granted_by UUID NOT NULL REFERENCES auth.users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(book_id, user_id)
);

-- Enable RLS on the new table
ALTER TABLE public.book_access ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see their own access
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'book_access_select_own') THEN
        CREATE POLICY book_access_select_own ON public.book_access
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

-- 4. Update the books selecting RLS policy
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'books_select_own' AND tablename = 'books') THEN
        DROP POLICY books_select_own ON public.books;
    END IF;
END $$;

-- This unified policy allows a user to select books if:
-- 1. They uploaded it.
-- 2. It has 'public' visibility.
-- 3. It's 'assigned' AND the user has a row in book_access for that book.
-- (The is_default check is temporarily retained for fallback safety)
CREATE POLICY books_granular_access ON public.books
    FOR SELECT USING (
        auth.uid() = uploaded_by OR 
        visibility = 'public' OR
        is_default = true OR
        (visibility = 'assigned' AND EXISTS (SELECT 1 FROM public.book_access ba WHERE ba.book_id = id AND ba.user_id = auth.uid()))
    );
