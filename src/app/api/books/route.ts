import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Now receives JSON — files were uploaded directly from browser to Supabase Storage
    const { title, author, genre, language, epubPath, coverUrl, coverPath, visibility } = await req.json();

    if (!title || !author || !epubPath) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const adminSupabase = createAdminClient();

    const { data: existingBook } = await adminSupabase
      .from('books')
      .select('id')
      .eq('uploaded_by', user.id)
      .ilike('title', title)
      .ilike('author', author)
      .maybeSingle();

    if (existingBook) {
      return NextResponse.json({ error: 'Book already exists in library' }, { status: 409 });
    }

    const { data: book, error: dbError } = await adminSupabase
      .from('books')
      .insert({
        title,
        author,
        cover_url:   coverUrl   ?? null,
        cover_path:  coverPath  ?? null,
        epub_path:   epubPath,
        genre:       genre      ?? null,
        language:    language   ?? null,
        visibility:  visibility ?? 'private',
        uploaded_by: user.id,
      })
      .select()
      .single();

    if (dbError) throw dbError;

    return NextResponse.json({ book });
  } catch (err) {
    console.error('[Books API Error]', err);
    return NextResponse.json({ error: 'Failed to save book' }, { status: 500 });
  }
}
