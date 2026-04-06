import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import type { BookVisibility } from '@/types';

const ADMIN_EMAIL = 'abdulrehanoffical@gmail.com';

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || user.email !== ADMIN_EMAIL) {
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

    if (!user || user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bookId, visibility } = await req.json() as { bookId: string; visibility: BookVisibility };
    
    if (!bookId || !visibility) {
      return NextResponse.json({ error: 'Missing bookId or visibility' }, { status: 400 });
    }

    const { error: updateError } = await admin
      .from('books')
      .update({ 
        visibility, 
        is_default: visibility === 'public' // Sync for backward compatibility
      })
      .eq('id', bookId);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
