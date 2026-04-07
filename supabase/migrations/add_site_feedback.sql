-- ─────────────────────────────────────────────
-- SITE FEEDBACK (website product reviews)
-- ─────────────────────────────────────────────
-- One feedback per user. Captures a 1–5 star rating
-- and optional free-text feedback about the Folio platform.

CREATE TABLE public.site_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)  -- one review per user
);

-- RLS
ALTER TABLE public.site_feedback ENABLE ROW LEVEL SECURITY;

-- Users can read their own feedback (to check if already submitted)
CREATE POLICY "site_feedback_select_own"
  ON public.site_feedback FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own feedback
CREATE POLICY "site_feedback_insert_own"
  ON public.site_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Index for quick lookup by user
CREATE INDEX site_feedback_user_id_idx ON public.site_feedback(user_id);
