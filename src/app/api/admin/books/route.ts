import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import type { BookVisibility } from '@/types';

const ADMIN_EMAILS = ['abdulrehanoffical@gmail.com', 'jesanequebal649@gmail.com'];

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !ADMIN_EMAILS.includes(user.email as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: books, error: booksError } = await admin
      .from('books')
      .select('id, title, author, cover_url, genre, uploaded_by, is_default, visibility, created_at')
      .order('created_at', { ascending: false });

    if (booksError) throw booksError;

    // Get uploader names
    const uploaderIds = Array.from(new Set((books ?? []).map(b => b.uploaded_by)));
    const { data: uploaderProfiles } = await admin
      .from('profiles')
      .select('id, full_name, email')
      .in('id', uploaderIds);

    const profileMap = new Map(uploaderProfiles?.map(p => [p.id, p]));

    // Get assigned counts
    const { data: accessCounts } = await admin
      .from('book_access')
      .select('book_id');
      
    const countsMap = new Map<string, number>();
    (accessCounts ?? []).forEach(r => {
      countsMap.set(r.book_id, (countsMap.get(r.book_id) ?? 0) + 1);
    });

    const enrichedBooks = books?.map(b => {
      const p = profileMap.get(b.uploaded_by);
      return {
        ...b,
        uploader_name: p?.full_name ?? p?.email ?? 'Unknown User',
        assigned_count: countsMap.get(b.id) ?? 0
      };
    });

    return NextResponse.json({ books: enrichedBooks });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !ADMIN_EMAILS.includes(user.email as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bookId, bookIds, visibility } = await req.json() as { bookId?: string; bookIds?: string[]; visibility: BookVisibility };
    
    const targetIds = bookIds || (bookId ? [bookId] : []);

    if (targetIds.length === 0 || !visibility) {
      return NextResponse.json({ error: 'Missing bookId(s) or visibility' }, { status: 400 });
    }

    const { error: updateError } = await admin
      .from('books')
      .update({ 
        visibility, 
        is_default: visibility === 'public' // Sync for backward compatibility
      })
      .in('id', targetIds);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !ADMIN_EMAILS.includes(user.email as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bookIds } = await req.json() as { bookIds: string[] };
    if (!bookIds || !Array.isArray(bookIds) || bookIds.length === 0) {
      return NextResponse.json({ error: 'Missing bookIds' }, { status: 400 });
    }

    // Fetch paths to delete from storage
    const { data: booksToDelete, error: fetchError } = await admin
      .from('books')
      .select('id, file_path, epub_path, cover_path')
      .in('id', bookIds);

    if (fetchError) throw fetchError;

    const filesToDelete: { bucket: string; path: string }[] = [];
    booksToDelete?.forEach(book => {
      if (book.epub_path)  filesToDelete.push({ bucket: 'books',  path: book.epub_path });
      if (book.file_path)  filesToDelete.push({ bucket: 'books',  path: book.file_path });
      if (book.cover_path) filesToDelete.push({ bucket: 'covers', path: book.cover_path });
    });

    // Delete from storage
    for (const f of filesToDelete) {
      const { error: storageErr } = await admin.storage.from(f.bucket).remove([f.path]);
      if (storageErr) console.warn(`[DELETE] Storage removal failed for ${f.path}:`, storageErr.message);
    }

    // Delete from database
    const { error: deleteError } = await admin
      .from('books')
      .delete()
      .in('id', bookIds);

    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true, deleted: bookIds.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !ADMIN_EMAILS.includes(user.email as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bookIds, userIds } = await req.json() as { bookIds: string[], userIds: string[] };

    if (!Array.isArray(bookIds) || !Array.isArray(userIds)) {
      return NextResponse.json({ error: 'Invalid bookIds or userIds array' }, { status: 400 });
    }

    if (bookIds.length === 0) {
      return NextResponse.json({ success: true });
    }

    // 1. Remove all existing access for these books
    const { error: removeError } = await admin
      .from('book_access')
      .delete()
      .in('book_id', bookIds);
    
    if (removeError) throw removeError;

    let totalAdded = 0;

    // 2. Add new access for each book and user combo
    if (userIds.length > 0) {
      const rows = bookIds.flatMap(bookId => 
        userIds.map(userId => ({
          book_id: bookId,
          user_id: userId,
          granted_by: user.id
        }))
      );

      const { error: insertError } = await admin.from('book_access').insert(rows);
      if (insertError) throw insertError;
      totalAdded = rows.length;
    }

    // 3. Update visibility based on assignments
    const newVisibility = userIds.length > 0 ? 'assigned' : 'private';
    const { error: updateError } = await admin
      .from('books')
      .update({ visibility: newVisibility })
      .in('id', bookIds);
      
    if (updateError) throw updateError;

    return NextResponse.json({ success: true, added: totalAdded });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
