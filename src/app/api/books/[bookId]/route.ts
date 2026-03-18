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

    const { data: book } = await supabase
      .from('books')
      .select('file_path, cover_path, uploaded_by, is_default')
      .eq('id', bookId)
      .single();

    if (!book || book.uploaded_by !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Delete storage files
    if (book.file_path) await admin.storage.from('books').remove([book.file_path]);
    if (book.cover_path) await admin.storage.from('covers').remove([book.cover_path]);

    // Delete the book — cascades to all users' progress/highlights for this book
    const { error } = await supabase.from('books').delete().eq('id', bookId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (e: any) {
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

    const { data: existing } = await supabase
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
      const admin = createAdminClient();
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

    const { data: book, error } = await supabase
      .from('books').update(updates).eq('id', bookId).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ book });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
