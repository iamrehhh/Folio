import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import ReaderClient from '@/components/reader/ReaderClient';
import type { Book, ReadingProgress, Highlight } from '@/types';

interface ReadPageProps {
  params: { bookId: string };
}

export default async function ReadPage({ params }: ReadPageProps) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Fetch book
  const { data: book } = await supabase
    .from('books')
    .select('*')
    .eq('id', params.bookId)
    .single();

  if (!book) notFound();

  // Get signed URL for the private EPUB file
  const { data: signedUrlData } = await supabase.storage
    .from('books')
    .createSignedUrl(book.epub_path, 60 * 60); // 1 hour

  if (!signedUrlData?.signedUrl) {
    throw new Error('Unable to load book file. Please try again.');
  }

  // Fetch reading progress
  const { data: progress } = await supabase
    .from('reading_progress')
    .select('*')
    .eq('user_id', user.id)
    .eq('book_id', params.bookId)
    .single();

  // Fetch all highlights for this book+user
  const { data: highlights } = await supabase
    .from('highlights')
    .select('*')
    .eq('user_id', user.id)
    .eq('book_id', params.bookId)
    .order('created_at', { ascending: true });

  return (
    <ReaderClient
      book={book as Book}
      epubUrl={signedUrlData.signedUrl}
      initialProgress={(progress as ReadingProgress) ?? null}
      initialHighlights={(highlights as Highlight[]) ?? []}
      profile={profile}
      userId={user.id}
    />
  );
}
