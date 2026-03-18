import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import LibraryClient from '@/components/library/LibraryClient';
import type { Book } from '@/types';

export default async function LibraryPage() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single();

  // Fetch user's own books + all default books (uploaded by admin)
  // Using OR filter: uploaded_by = current user OR is_default = true
  const { data: books } = await supabase
    .from('books')
    .select('*')
    .or(`uploaded_by.eq.${user.id},is_default.eq.true`)
    .order('is_default', { ascending: false }) // default books first
    .order('created_at', { ascending: false });

  // Reading progress for this user
  const { data: progress } = await supabase
    .from('reading_progress')
    .select('book_id, progress_percent, last_read_at, chapter_title')
    .eq('user_id', user.id);

  const progressMap = new Map(
    (progress ?? []).map(p => [p.book_id, p])
  );

  return (
    <AppShell user={profile}>
      <LibraryClient
        books={(books as Book[]) ?? []}
        progressMap={progressMap}
        userId={user.id}
      />
    </AppShell>
  );
}
