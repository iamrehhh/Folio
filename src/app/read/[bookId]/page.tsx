import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import ReaderClient from '@/components/reader/ReaderClient';
import type { Book, ReadingProgress, Highlight } from '@/types';

const ADMIN_EMAILS = ['abdulrehanoffical@gmail.com', 'jesanequebal649@gmail.com'];

interface ReadPageProps {
  params: { bookId: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function ReadPage({ params, searchParams }: ReadPageProps) {
  const supabase = createClient();
  const admin = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Fetch book using admin to bypass RLS
  const { data: book } = await admin
    .from('books')
    .select('*')
    .eq('id', params.bookId)
    .single();

  if (!book) notFound();

  // Verify access manually
  let hasAccess = false;
  if (ADMIN_EMAILS.includes(user.email as string) || book.uploaded_by === user.id || book.visibility === 'public' || book.is_default) {
    hasAccess = true;
  } else if (book.visibility === 'assigned') {
    const { data: access } = await admin
      .from('book_access')
      .select('id')
      .eq('book_id', book.id)
      .eq('user_id', user.id)
      .single();
    if (access) hasAccess = true;
  }

  if (!hasAccess) notFound();

  // Get signed URL for the private EPUB file using admin
  const { data: signedUrlData } = await admin.storage
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

  // Extract jump-to CFI from URL query params (from "Jump to passage" links)
  const jumpToCfi = typeof searchParams.cfi === 'string' ? searchParams.cfi : undefined;

  return (
    <ReaderClient
      book={book as Book}
      epubUrl={signedUrlData.signedUrl}
      initialProgress={(progress as ReadingProgress) ?? null}
      initialHighlights={(highlights as Highlight[]) ?? []}
      profile={profile}
      userId={user.id}
      jumpToCfi={jumpToCfi}
    />
  );
}
