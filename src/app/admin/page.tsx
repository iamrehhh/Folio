import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import AdminDashboard from '@/components/admin/AdminDashboard';

const ADMIN_EMAIL = 'abdulrehanoffical@gmail.com';

export const metadata = {
  title: 'Admin — Folio',
};

export default async function AdminPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');
  if (user.email !== ADMIN_EMAIL) redirect('/home');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return (
    <AppShell user={profile}>
      <AdminDashboard />
    </AppShell>
  );
}
