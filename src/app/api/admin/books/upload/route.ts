import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

const ADMIN_EMAILS = ['abdulrehanoffical@gmail.com', 'jesanequebal649@gmail.com'];

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/admin/books/upload
 * 
 * Admin-specific book upload endpoint.
 * - Sets uploaded_via = 'admin'
 * - Does NOT add to user_library (so it never appears in the admin's personal library)
 * - Defaults visibility to 'private' (admin can preview, then make public)
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !ADMIN_EMAILS.includes(user.email as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, author, genre, language, epubPath, coverUrl, coverPath, visibility } = await req.json();

    if (!title || !author || !epubPath) {
      return NextResponse.json({ error: 'Missing required fields (title, author, epubPath)' }, { status: 400 });
    }

    // Check for duplicates
    const { data: existingBook } = await admin
      .from('books')
      .select('id')
      .ilike('title', title)
      .ilike('author', author)
      .maybeSingle();

    if (existingBook) {
      return NextResponse.json({ error: 'Book already exists in the library' }, { status: 409 });
    }

    // Insert book with uploaded_via = 'admin'
    const { data: book, error: dbError } = await admin
      .from('books')
      .insert({
        title,
        author,
        cover_url: coverUrl ?? null,
        cover_path: coverPath ?? null,
        epub_path: epubPath,
        genre: genre ?? null,
        language: language ?? null,
        visibility: visibility ?? 'private',
        uploaded_by: user.id,
        uploaded_via: 'admin',       // Key difference from /api/books
        is_default: (visibility ?? 'private') === 'public',
      })
      .select()
      .single();

    if (dbError) throw dbError;

    // NOTE: We intentionally do NOT add to user_library here.
    // Admin uploads should only appear in the public library, not the admin's personal library.

    return NextResponse.json({ book });
  } catch (err: any) {
    console.error('[Admin Books Upload Error]', err);
    return NextResponse.json({ error: err.message ?? 'Failed to save book' }, { status: 500 });
  }
}
