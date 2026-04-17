-- 004_bug_reports.sql

-- 1. Create bug_reports table
CREATE TABLE IF NOT EXISTS public.bug_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bug_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own bug_reports" ON public.bug_reports;
CREATE POLICY "Users can view own bug_reports"
  ON public.bug_reports FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own bug_reports" ON public.bug_reports;
CREATE POLICY "Users can insert own bug_reports"
  ON public.bug_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own bug_reports" ON public.bug_reports;
CREATE POLICY "Users can update own bug_reports"
  ON public.bug_reports FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view and manage all bug_reports" ON public.bug_reports;
CREATE POLICY "Admins can view and manage all bug_reports"
  ON public.bug_reports FOR ALL
  USING (
    auth.jwt() ->> 'email' IN ('abdulrehanoffical@gmail.com', 'jesanequebal649@gmail.com')
  );

-- 2. Create bug_report_messages table
CREATE TABLE IF NOT EXISTS public.bug_report_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.bug_reports(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  screenshot_url TEXT,
  ocr_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bug_report_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view messages of their reports" ON public.bug_report_messages;
CREATE POLICY "Users can view messages of their reports"
  ON public.bug_report_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bug_reports
      WHERE bug_reports.id = report_id
      AND bug_reports.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert messages into their reports" ON public.bug_report_messages;
CREATE POLICY "Users can insert messages into their reports"
  ON public.bug_report_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bug_reports
      WHERE bug_reports.id = report_id
      AND bug_reports.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can view and send all messages" ON public.bug_report_messages;
CREATE POLICY "Admins can view and send all messages"
  ON public.bug_report_messages FOR ALL
  USING (
    auth.jwt() ->> 'email' IN ('abdulrehanoffical@gmail.com', 'jesanequebal649@gmail.com')
  );

-- 3. Create Storage bucket for bug screenshots
INSERT INTO storage.buckets (id, name, public) 
VALUES ('bug_screenshots', 'bug_screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for 'bug_screenshots'
DROP POLICY IF EXISTS "Public Access to bug_screenshots" ON storage.objects;
CREATE POLICY "Public Access to bug_screenshots"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'bug_screenshots');

DROP POLICY IF EXISTS "Users can upload bug_screenshots" ON storage.objects;
CREATE POLICY "Users can upload bug_screenshots"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'bug_screenshots' AND auth.role() = 'authenticated');
