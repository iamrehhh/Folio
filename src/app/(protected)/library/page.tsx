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

  // Run independent queries in parallel to drastically reduce waterfall delay
  const [
    profileRes,
    accessRes,
    progressRes,
    schedulesRes,
    userLibraryRes
  ] = await Promise.all([
    admin.from('profiles').select('can_view_all_public_books').eq('id', user.id).single(),
    admin.from('book_access').select('book_id').eq('user_id', user.id),
    supabase.from('reading_progress').select('book_id, progress_percent, last_read_at, chapter_title').eq('user_id', user.id),
    supabase.from('book_schedules').select('*').eq('user_id', user.id),
    supabase.from('user_library').select('book_id, added_at').eq('user_id', user.id)
  ]);

  const canViewAllPublic = isAdmin || (profileRes.data?.can_view_all_public_books ?? false);

  let books: any[] | null = null;

  if (!accessRes.error) {
    const assignedIds = (accessRes.data ?? []).map(r => r.book_id);

    // Use admin client — no RLS interference
    let booksQuery = admin
      .from('books')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);

    // Build the OR filter based on access level:
    const publicFilter = canViewAllPublic
      ? 'visibility.eq.public'
      : 'and(visibility.eq.public,is_showcase.eq.true)';

    if (assignedIds.length > 0) {
      booksQuery = booksQuery.or(
        `and(uploaded_by.eq.${user.id},uploaded_via.eq.library),${publicFilter},and(visibility.eq.assigned,id.in.(${assignedIds.join(',')}))`
      );
    } else {
      booksQuery = booksQuery.or(`and(uploaded_by.eq.${user.id},uploaded_via.eq.library),${publicFilter}`);
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

  const progressMap = new Map((progressRes.data ?? []).map(p => [p.book_id, p]));
  const scheduleMap = new Map((schedulesRes.data ?? []).map(s => [s.book_id, s]));

  const userLibraryBookIds = (userLibraryRes.data ?? []).map(r => r.book_id);
  const userLibraryAddedAt: Record<string, string> = {};
  (userLibraryRes.data ?? []).forEach(r => {
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
