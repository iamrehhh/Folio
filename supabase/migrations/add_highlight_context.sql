-- Add context_paragraph column to highlights table
-- Stores the surrounding paragraph text for Quick View feature
ALTER TABLE public.highlights ADD COLUMN IF NOT EXISTS context_paragraph TEXT;
