import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET — fetch all bookmarks for a book
export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const bookId = req.nextUrl.searchParams.get('bookId');
    if (!bookId) return NextResponse.json({ error: 'bookId required' }, { status: 400 });

    const { data, error } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', user.id)
      .eq('book_id', bookId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ bookmarks: data ?? [] });
  } catch (err) {
    console.error('[Bookmarks GET Error]', err);
    return NextResponse.json({ error: 'Failed to fetch bookmarks' }, { status: 500 });
  }
}

// POST — create a new bookmark
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json() as {
      bookId: string;
      cfi: string;
      chapterIndex: number;
      chapterTitle?: string;
      progressPercent: number;
      label?: string;
    };

    const { data, error } = await supabase
      .from('bookmarks')
      .insert({
        user_id: user.id,
        book_id: body.bookId,
        cfi: body.cfi,
        chapter_index: body.chapterIndex,
        chapter_title: body.chapterTitle ?? null,
        progress_percent: body.progressPercent,
        label: body.label ?? null,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ bookmark: data });
  } catch (err) {
    console.error('[Bookmarks POST Error]', err);
    return NextResponse.json({ error: 'Failed to save bookmark' }, { status: 500 });
  }
}

// DELETE — remove a bookmark by ID or all for a book
export async function DELETE(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const id = req.nextUrl.searchParams.get('id');
    const bookId = req.nextUrl.searchParams.get('bookId');

    if (id) {
      // Delete a specific bookmark
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) throw error;
    } else if (bookId) {
      // Delete all bookmarks for a book
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('user_id', user.id)
        .eq('book_id', bookId);
      if (error) throw error;
    } else {
      return NextResponse.json({ error: 'id or bookId required' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Bookmarks DELETE Error]', err);
    return NextResponse.json({ error: 'Failed to delete bookmark' }, { status: 500 });
  }
}
