-- Add missing indexes for bug reports to fix Disk IO depletion from polling

CREATE INDEX IF NOT EXISTS bug_reports_user_id_idx ON public.bug_reports(user_id);
CREATE INDEX IF NOT EXISTS bug_report_messages_report_id_idx ON public.bug_report_messages(report_id);
CREATE INDEX IF NOT EXISTS bug_report_messages_sender_id_idx ON public.bug_report_messages(sender_id);
