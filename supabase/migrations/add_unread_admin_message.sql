-- Add unread admin message tracking for report chat notifications
ALTER TABLE public.bug_reports 
ADD COLUMN has_unread_admin_message BOOLEAN DEFAULT false NOT NULL;
