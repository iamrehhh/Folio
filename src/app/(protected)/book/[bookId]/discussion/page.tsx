import { createAdminClient } from '@/lib/supabase/server';
import { requireUser, getCachedProfile } from '@/lib/cache';
import { notFound } from 'next/navigation';
import type { Book } from '@/types';
import BookDiscussionClient from './BookDiscussionClient';

export default async function BookDiscussionPage({
  params,
}: {
  params: { bookId: string };
}) {
  const user = await requireUser();
  const profile = await getCachedProfile();
  const admin = createAdminClient();

  // Fetch book details
  const { data: book, error } = await admin
    .from('books')
    .select('*')
    .eq('id', params.bookId)
    .single();

  if (error || !book) {
    notFound();
  }

  return (
    <BookDiscussionClient
      book={book as Book}
      userId={user.id}
      userName={profile?.full_name || user.email?.split('@')[0] || 'Anonymous'}
      userAvatar={profile?.avatar_url || null}
    />
  );
}
