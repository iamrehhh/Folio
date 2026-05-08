import { redirect } from 'next/navigation';
import { requireUser, getCachedProfile } from '@/lib/cache';
import { createClient } from '@/lib/supabase/server';
import ProfileClient from './ProfileClient';


export const metadata = {
  title: 'Profile | Folio',
};

export default async function ProfilePage() {
  const user = await requireUser();
  const profile = await getCachedProfile();
  const supabase = createClient();
  
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
    <>
      <div className="max-w-4xl mx-auto px-4 py-12 md:py-16">
        <h1 className="text-3xl font-serif text-[var(--text-primary)] mb-8" style={{ color: '#1C1C1E', fontFamily: 'Lora, Georgia, serif' }}>Profile</h1>
        <ProfileClient 
          profile={profile} 
          stats={stats} 
          userEmail={user.email || ''}
          authProvider={user.app_metadata?.provider || 'email'}
        />
      </div>
    </>
  );
}
