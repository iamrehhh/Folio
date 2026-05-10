-- Migration to add language column to books table
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS language TEXT;
