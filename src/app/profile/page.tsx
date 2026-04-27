import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ProfileClient from './ProfileClient';

import AppShell from '@/components/layout/AppShell';

export const metadata = {
  title: 'Profile | Folio',
};

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/login');
  }

  const { count: booksCount } = await supabase
    .from('books')
    .select('*', { count: 'exact', head: true })
    .eq('uploaded_by', user.id);

  const { count: booksFinished } = await supabase
    .from('reading_progress')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('progress_percent', 100);

  const { count: totalHighlights } = await supabase
    .from('highlights')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  const stats = {
    booksUploaded: booksCount ?? 0,
    booksFinished: booksFinished ?? 0,
    totalHighlights: totalHighlights ?? 0
  };

  return (
    <AppShell user={profile}>
      <div className="max-w-4xl mx-auto px-4 py-12 md:py-16">
        <h1 className="text-3xl font-serif text-[var(--text-primary)] mb-8" style={{ color: '#1C1C1E', fontFamily: 'Lora, Georgia, serif' }}>Profile</h1>
        <ProfileClient 
          profile={profile} 
          stats={stats} 
          userEmail={user.email || ''}
          authProvider={user.app_metadata?.provider || 'email'}
        />
      </div>
    </AppShell>
  );
}
