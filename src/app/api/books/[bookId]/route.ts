import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function PATCH(
  req: Request,
  { params }: { params: { bookId: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    console.log('[PATCH] bookId:', params.bookId);
    console.log('[PATCH] user:', user?.id, 'authError:', authError?.message);
    
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: existing, error: fetchError } = await supabase
      .from('books')
      .select('id, uploaded_by, cover_path')
      .eq('id', params.bookId)
      .single();

    console.log('[PATCH] existing:', existing, 'fetchError:', fetchError?.message);

    if (!existing) {
      return NextResponse.json({ error: 'Not found', details: fetchError?.message }, { status: 404 });
    }
    if (existing.uploaded_by !== user.id) {
      return NextResponse.json({ error: 'Not found - wrong user', bookUserId: existing.uploaded_by, userId: user.id }, { status: 404 });
    }

    const formData = await req.formData();
    const title  = formData.get('title') as string;
    const author = formData.get('author') as string;
    const genre  = formData.get('genre') as string;
    const cover  = formData.get('cover') as File | null;

    const updates: Record<string, any> = { title, author, genre };

    if (cover && cover.size > 0) {
      const admin = createAdminClient();
      const ext = cover.name.split('.').pop();
      const coverPath = `${user.id}/${params.bookId}/cover.${ext}`;
      const coverBuffer = await cover.arrayBuffer();

      if (existing.cover_path) {
        await admin.storage.from('covers').remove([existing.cover_path]);
      }

      const { error: uploadError } = await admin.storage
        .from('covers')
        .upload(coverPath, coverBuffer, { contentType: cover.type, upsert: true });

      console.log('[PATCH] uploadError:', uploadError?.message);

      if (!uploadError) {
        const { data: { publicUrl } } = admin.storage.from('covers').getPublicUrl(coverPath);
        updates.cover_url  = publicUrl;
        updates.cover_path = coverPath;
      }
    }

    const { data: book, error } = await supabase
      .from('books')
      .update(updates)
      .eq('id', params.bookId)
      .select()
      .single();

    console.log('[PATCH] update error:', error?.message);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ book });
  } catch (e: any) {
    console.error('[PATCH] exception:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { bookId: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: book, error: fetchError } = await supabase
      .from('books')
      .select('epub_path, cover_url, uploaded_by')
      .eq('id', params.bookId)
      .single();

    console.log('[DELETE] book:', book, 'fetchError:', fetchError?.message);

    if (!book || book.uploaded_by !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const admin = createAdminClient();
    
    // Remove EPUB file
    if (book.epub_path) {
      await admin.storage.from('books').remove([book.epub_path]);
    }
    
    // Remove cover image if it exists
    if (book.cover_url) {
      const coverPath = book.cover_url.split('/public/covers/')[1];
      if (coverPath) {
        await admin.storage.from('covers').remove([coverPath]);
      }
    }

    // Use admin client to bypass RLS missing delete policy
    const { error } = await admin.from('books').delete().eq('id', params.bookId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('[DELETE] exception:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
