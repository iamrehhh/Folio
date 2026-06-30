import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

const ADMIN_EMAILS = ['abdulrehanoffical@gmail.com', 'jesanequebal649@gmail.com'];

export async function GET(
  _req: Request,
  { params }: { params: { bookId: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = createAdminClient();
    const { data: book } = await admin
      .from('books')
      .select('id, title, epub_path, uploaded_by, visibility, is_default, is_showcase')
      .eq('id', params.bookId)
      .single();

    if (!book) return NextResponse.json({ error: 'Book not found' }, { status: 404 });

    // Verify access — same logic as the reader page
    let hasAccess = false;
    if (
      ADMIN_EMAILS.includes(user.email as string) ||
      book.uploaded_by === user.id
    ) {
      hasAccess = true;
    } else if (book.visibility === 'public' || book.is_default) {
      // Public books: check if showcase or user has full public access
      if (book.is_showcase) {
        hasAccess = true;
      } else {
        const { data: profileData } = await admin
          .from('profiles')
          .select('can_view_all_public_books')
          .eq('id', user.id)
          .single();
        if (profileData?.can_view_all_public_books) hasAccess = true;
      }
    } else if (book.visibility === 'assigned') {
      const { data: access } = await admin
        .from('book_access')
        .select('id')
        .eq('book_id', book.id)
        .eq('user_id', user.id)
        .single();
      if (access) hasAccess = true;
    }

    if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Generate a short-lived signed URL (5 minutes is plenty for a download)
    const { data: signedUrlData, error: urlError } = await admin.storage
      .from('books')
      .createSignedUrl(book.epub_path, 5 * 60, {
        download: `${book.title}.epub`,
      });

    if (urlError || !signedUrlData?.signedUrl) {
      return NextResponse.json({ error: 'Failed to generate download link' }, { status: 500 });
    }

    return NextResponse.json({ url: signedUrlData.signedUrl });
  } catch (e: any) {
    console.error('[DOWNLOAD] Exception:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
