import { requireUser } from '@/lib/cache';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ReportClient from '@/components/report/ReportClient';

export default async function ReportPage() {
  const profile = await getCachedProfile();

  if (!profile) {
    redirect('/login');
  }
  return (
    <>
      <div className="w-full flex-1 flex flex-col min-h-[calc(100vh-64px)]">
        <ReportClient user={profile} />
      </div>
    </>
  );
}
