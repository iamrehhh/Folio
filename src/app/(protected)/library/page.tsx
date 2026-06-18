import { createClient, createAdminClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/cache';
import LibraryClient from '@/components/library/LibraryClient';
import type { Book } from '@/types';

const ADMIN_EMAILS = ['abdulrehanoffical@gmail.com', 'jesanequebal649@gmail.com'];

export default async function LibraryPage() {
  const user = await requireUser();
  const supabase = createClient();
  const admin = createAdminClient();

  const isAdmin = ADMIN_EMAILS.includes(user.email as string);

  // Fetch books the user can access using admin client (bypasses RLS).
  // We handle access filtering ourselves below.
  let books: any[] | null = null;

  // Get book IDs assigned to this user
  const { data: assignedBookIds, error: accessError } = await admin
    .from('book_access')
    .select('book_id')
    .eq('user_id', user.id);

  if (!accessError) {
    const assignedIds = (assignedBookIds ?? []).map(r => r.book_id);

    // Use admin client — no RLS interference
    let booksQuery = admin
      .from('books')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);

    if (assignedIds.length > 0) {
      booksQuery = booksQuery.or(
        `and(uploaded_by.eq.${user.id},uploaded_via.eq.library),visibility.eq.public,and(visibility.eq.assigned,id.in.(${assignedIds.join(',')}))`
      );
    } else {
      booksQuery = booksQuery.or(`and(uploaded_by.eq.${user.id},uploaded_via.eq.library),visibility.eq.public`);
    }

    const { data: newBooks, error: booksError } = await booksQuery;

    if (!booksError) {
      books = newBooks;
    }
  }

  // Fallback: use legacy is_default query
  if (books === null) {
    const { data: legacyBooks } = await admin
      .from('books')
      .select('*')
      .or(`uploaded_by.eq.${user.id},is_default.eq.true`)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(500);
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


  // Fetch the user's personal library entries
  const { data: userLibraryData } = await supabase
    .from('user_library')
    .select('book_id, added_at')
    .eq('user_id', user.id);
  
  const userLibraryBookIds = (userLibraryData ?? []).map(r => r.book_id);

  const userLibraryAddedAt: Record<string, string> = {};
  (userLibraryData ?? []).forEach(r => {
    userLibraryAddedAt[r.book_id] = r.added_at;
  });

  return (
    <>
      <LibraryClient
        books={(books as Book[]) ?? []}
        progressMap={progressMap}
        scheduleMap={scheduleMap}
        userLibraryBookIds={userLibraryBookIds}
        userLibraryAddedAt={userLibraryAddedAt}
        userId={user.id}
        isAdmin={isAdmin}
      />
    </>
  );
}
