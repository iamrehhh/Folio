-- Add unread user message tracking for admin notification badge on reports
ALTER TABLE public.bug_reports 
ADD COLUMN IF NOT EXISTS has_unread_user_message BOOLEAN DEFAULT false NOT NULL;

-- Index for efficient admin unread count queries
CREATE INDEX IF NOT EXISTS idx_bug_reports_admin_unread 
ON public.bug_reports(has_unread_user_message) 
WHERE has_unread_user_message = true;
