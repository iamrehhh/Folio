-- ─────────────────────────────────────────────
-- PERSONAL VAULT
-- ─────────────────────────────────────────────
CREATE TABLE public.vault_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'note'
    CHECK (category IN ('note', 'reading_list', 'vocabulary', 'quick_capture')),
  title TEXT,
  content TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'default'
    CHECK (color IN ('default', 'amber', 'sage', 'sky', 'rose', 'lavender')),
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX vault_entries_user_id ON public.vault_entries(user_id);
CREATE INDEX vault_entries_user_category ON public.vault_entries(user_id, category);

ALTER TABLE public.vault_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vault_entries_own" ON public.vault_entries FOR ALL USING (auth.uid() = user_id);

CREATE TRIGGER vault_entries_updated_at
  BEFORE UPDATE ON public.vault_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
