import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function DELETE(
  _req: Request,
  { params }: { params: { bookId: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { bookId } = params;
    const admin = createAdminClient();

    // Use admin client to fetch — bypasses RLS so we always get the row
    const { data: book, error: fetchError } = await admin
      .from('books')
      .select('file_path, cover_path, epub_path, uploaded_by, is_default')
      .eq('id', bookId)
      .single();

    console.log('[DELETE] book:', book, 'fetchError:', fetchError?.message);

    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    // Only the uploader can delete their book
    if (book.uploaded_by !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete storage files using admin client
    const filesToDelete: { bucket: string; path: string }[] = [];
    if (book.epub_path)  filesToDelete.push({ bucket: 'books',  path: book.epub_path });
    if (book.file_path)  filesToDelete.push({ bucket: 'books',  path: book.file_path });
    if (book.cover_path) filesToDelete.push({ bucket: 'covers', path: book.cover_path });

    for (const f of filesToDelete) {
      const { error: storageErr } = await admin.storage.from(f.bucket).remove([f.path]);
      if (storageErr) console.warn(`[DELETE] Storage removal failed for ${f.path}:`, storageErr.message);
    }

    // Use admin client to delete — bypasses RLS
    const { error: deleteError } = await admin
      .from('books')
      .delete()
      .eq('id', bookId);

    if (deleteError) {
      console.error('[DELETE] DB delete error:', deleteError.message);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('[DELETE] Exception:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { bookId: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { bookId } = params;
    const admin = createAdminClient();

    const { data: existing } = await admin
      .from('books')
      .select('id, uploaded_by, cover_path')
      .eq('id', bookId)
      .single();

    if (!existing || existing.uploaded_by !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const formData = await req.formData();
    const title  = formData.get('title')  as string;
    const author = formData.get('author') as string;
    const genre  = formData.get('genre')  as string;
    const cover  = formData.get('cover')  as File | null;

    const updates: Record<string, any> = { title, author, genre };

    if (cover && cover.size > 0) {
      const ext = cover.name.split('.').pop();
      const coverPath = `${user.id}/${bookId}/cover.${ext}`;
      const coverBuffer = await cover.arrayBuffer();

      if (existing.cover_path) {
        await admin.storage.from('covers').remove([existing.cover_path]);
      }

      const { error: uploadError } = await admin.storage
        .from('covers')
        .upload(coverPath, coverBuffer, { contentType: cover.type, upsert: true });

      if (!uploadError) {
        const { data: { publicUrl } } = admin.storage.from('covers').getPublicUrl(coverPath);
        updates.cover_url  = publicUrl;
        updates.cover_path = coverPath;
      }
    }

    const { data: book, error } = await admin
      .from('books').update(updates).eq('id', bookId).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ book });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
