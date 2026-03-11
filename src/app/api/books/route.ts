import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { createClient } from '@/lib/supabase/server';

// POST — upload EPUB + metadata
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await req.formData();
    const epubFile = formData.get('epub') as File | null;
    const coverFile = formData.get('cover') as File | null;
    const title = formData.get('title') as string;
    const author = formData.get('author') as string;
    const genre = formData.get('genre') as string | null;
    const description = formData.get('description') as string | null;

    if (!epubFile || !title || !author) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const adminSupabase = createAdminClient();

    // Upload EPUB to private 'books' bucket
    const epubPath = `${user.id}/${Date.now()}-${epubFile.name.replace(/\s/g, '_')}`;
    const epubBuffer = await epubFile.arrayBuffer();

    const { error: epubError } = await adminSupabase.storage
      .from('books')
      .upload(epubPath, epubBuffer, {
        contentType: 'application/epub+zip',
        upsert: false,
      });

    if (epubError) throw epubError;

    // Upload cover to public 'covers' bucket (optional)
    let coverUrl: string | null = null;
    if (coverFile) {
      const coverPath = `${user.id}/${Date.now()}-${coverFile.name.replace(/\s/g, '_')}`;
      const coverBuffer = await coverFile.arrayBuffer();

      const { error: coverError } = await adminSupabase.storage
        .from('covers')
        .upload(coverPath, coverBuffer, {
          contentType: coverFile.type,
          upsert: false,
        });

      if (!coverError) {
        const { data: urlData } = adminSupabase.storage
          .from('covers')
          .getPublicUrl(coverPath);
        coverUrl = urlData.publicUrl;
      }
    }

    // Insert book record
    const { data: book, error: dbError } = await adminSupabase
      .from('books')
      .insert({
        title,
        author,
        cover_url: coverUrl,
        epub_path: epubPath,
        genre: genre || null,
        description: description || null,
        uploaded_by: user.id,
      })
      .select()
      .single();

    if (dbError) throw dbError;

    return NextResponse.json({ book });
  } catch (err) {
    console.error('[Books Upload Error]', err);
    return NextResponse.json({ error: 'Failed to upload book' }, { status: 500 });
  }
}
