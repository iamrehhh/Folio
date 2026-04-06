-- Create book_ratings table
CREATE TABLE public.book_ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, book_id)
);

-- Enable RLS
ALTER TABLE public.book_ratings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "book_ratings_select_all" ON public.book_ratings FOR SELECT USING (true);
CREATE POLICY "book_ratings_insert_own" ON public.book_ratings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "book_ratings_update_own" ON public.book_ratings FOR UPDATE USING (auth.uid() = user_id);

-- Auto-update updated_at for book_ratings
CREATE TRIGGER book_ratings_updated_at
    BEFORE UPDATE ON public.book_ratings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Create a view for quick average aggregation
CREATE VIEW public.book_rating_stats AS
SELECT 
    book_id,
    ROUND(AVG(rating)::numeric, 1) as average_rating,
    COUNT(rating) as total_ratings
FROM public.book_ratings
GROUP BY book_id;

-- Add an index on book_id to speed up aggregation
CREATE INDEX IF NOT EXISTS book_ratings_book_id_idx ON public.book_ratings(book_id);
