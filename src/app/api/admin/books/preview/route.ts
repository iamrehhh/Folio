import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

const ADMIN_EMAILS = ['abdulrehanoffical@gmail.com', 'jesanequebal649@gmail.com'];

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/admin/books/preview?bookId=...
 * 
 * Returns a signed URL for the EPUB file so the admin can preview the book
 * in a read-only viewer. This does NOT create reading progress or any personal data.
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !ADMIN_EMAILS.includes(user.email as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bookId = req.nextUrl.searchParams.get('bookId');
    if (!bookId) {
      return NextResponse.json({ error: 'bookId is required' }, { status: 400 });
    }

    // Fetch book details
    const { data: book, error: bookError } = await admin
      .from('books')
      .select('id, title, author, cover_url, genre, language, visibility, epub_path, uploaded_via, created_at')
      .eq('id', bookId)
      .single();

    if (bookError || !book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    // Create a signed URL for the EPUB file (1 hour expiry)
    const { data: signedUrlData, error: urlError } = await admin.storage
      .from('books')
      .createSignedUrl(book.epub_path, 60 * 60);

    if (urlError || !signedUrlData?.signedUrl) {
      return NextResponse.json({ error: 'Could not generate preview URL' }, { status: 500 });
    }

    return NextResponse.json({
      book,
      signedUrl: signedUrlData.signedUrl,
    });
  } catch (err: any) {
    console.error('[Admin Books Preview Error]', err);
    return NextResponse.json({ error: err.message ?? 'Internal error' }, { status: 500 });
  }
}
