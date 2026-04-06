import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import LibraryClient from '@/components/library/LibraryClient';
import type { Book } from '@/types';

const ADMIN_EMAIL = 'abdulrehanoffical@gmail.com';

export default async function LibraryPage() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single();

  const isAdmin = user.email === ADMIN_EMAIL;

  // Fetch books the user can access.
  // Try new visibility system first, fall back to legacy is_default if migration hasn't run.
  let books: any[] | null = null;

  // Check if book_access table exists by attempting a query
  const { data: assignedBookIds, error: accessError } = await supabase
    .from('book_access')
    .select('book_id')
    .eq('user_id', user.id);

  if (!accessError) {
    // New system: visibility-based access
    const assignedIds = (assignedBookIds ?? []).map(r => r.book_id);

    let booksQuery = supabase
      .from('books')
      .select('*')
      .order('created_at', { ascending: false });

    if (assignedIds.length > 0) {
      booksQuery = booksQuery.or(
        `uploaded_by.eq.${user.id},visibility.eq.public,and(visibility.eq.assigned,id.in.(${assignedIds.join(',')}))`
      );
    } else {
      booksQuery = booksQuery.or(`uploaded_by.eq.${user.id},visibility.eq.public`);
    }

    const { data: newBooks, error: booksError } = await booksQuery;

    if (!booksError) {
      books = newBooks;
    }
  }

  // Fallback: use legacy is_default query
  if (books === null) {
    const { data: legacyBooks } = await supabase
      .from('books')
      .select('*')
      .or(`uploaded_by.eq.${user.id},is_default.eq.true`)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });
    books = legacyBooks;
  }

  const { data: progress } = await supabase
    .from('reading_progress')
    .select('book_id, progress_percent, last_read_at, chapter_title')
    .eq('user_id', user.id);

  const progressMap = new Map(
    (progress ?? []).map(p => [p.book_id, p])
  );

  const { data: schedules } = await supabase
    .from('book_schedules')
    .select('*')
    .eq('user_id', user.id);

  const scheduleMap = new Map(
    (schedules ?? []).map(s => [s.book_id, s])
  );

  const { data: ratingsData } = await supabase
    .from('book_ratings')
    .select('book_id, rating')
    .eq('user_id', user.id);

  const ratingsMap = new Map(
    (ratingsData ?? []).map(r => [r.book_id, r.rating])
  );

  return (
    <AppShell user={profile}>
      <LibraryClient
        books={(books as Book[]) ?? []}
        progressMap={progressMap}
        scheduleMap={scheduleMap}
        ratingsMap={ratingsMap}
        userId={user.id}
        isAdmin={isAdmin}
      />
    </AppShell>
  );
}
