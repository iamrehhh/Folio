-- create system_notifications table
CREATE TABLE IF NOT EXISTS public.system_notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  message text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- enable RLS
ALTER TABLE public.system_notifications ENABLE ROW LEVEL SECURITY;

-- policy for anyone to read
CREATE POLICY "Anyone can read system_notifications"
  ON public.system_notifications
  FOR SELECT
  USING (true);

-- policy for admin to insert
CREATE POLICY "Admins can insert system_notifications"
  ON public.system_notifications
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (SELECT id FROM public.profiles WHERE email = 'abdulrehanoffical@gmail.com')
  );

-- policy for admin to update (deactivate)
CREATE POLICY "Admins can update system_notifications"
  ON public.system_notifications
  FOR UPDATE
  USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE email = 'abdulrehanoffical@gmail.com')
  );

-- realtime: enable replication for system_notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.system_notifications;
