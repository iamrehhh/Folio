-- Migration: Add force_feedback_request column to profiles

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS force_feedback_request BOOLEAN DEFAULT FALSE;
