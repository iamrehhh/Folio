import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import ReportClient from '@/components/report/ReportClient';

export default async function ReportPage() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return (
    <AppShell user={profile}>
      <div className="w-full flex-1 flex flex-col min-h-[calc(100vh-64px)]">
        <ReportClient user={profile} />
      </div>
    </AppShell>
  );
}
