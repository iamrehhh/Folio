-- Enable Realtime replication for bug reporting tables so the frontend can listen to changes instead of polling

ALTER PUBLICATION supabase_realtime ADD TABLE public.bug_reports;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bug_report_messages;
