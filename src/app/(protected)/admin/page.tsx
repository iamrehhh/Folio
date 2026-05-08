import { requireUser } from '@/lib/cache';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AdminDashboard from '@/components/admin/AdminDashboard';

const ADMIN_EMAILS = ['abdulrehanoffical@gmail.com', 'jesanequebal649@gmail.com'];

export const metadata = {
  title: 'Admin — Folio',
};

export default async function AdminPage() {
  const supabase = createClient();
  const user = await requireUser();
  if (!ADMIN_EMAILS.includes(user.email as string)) redirect('/home');

  
  return (
    <>
      <AdminDashboard />
    </>
  );
}
