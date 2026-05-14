import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/library — Add a book to user's personal library
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { book_id } = await req.json();
    if (!book_id) return NextResponse.json({ error: 'book_id is required' }, { status: 400 });

    const { error } = await supabase
      .from('user_library')
      .upsert({ user_id: user.id, book_id }, { onConflict: 'user_id,book_id' });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Library API POST Error]', err);
    return NextResponse.json({ error: 'Failed to add book to library' }, { status: 500 });
  }
}

// DELETE /api/library?book_id=... — Remove a book from user's personal library
export async function DELETE(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const bookId = req.nextUrl.searchParams.get('book_id');
    if (!bookId) return NextResponse.json({ error: 'book_id is required' }, { status: 400 });

    const { error } = await supabase
      .from('user_library')
      .delete()
      .eq('user_id', user.id)
      .eq('book_id', bookId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Library API DELETE Error]', err);
    return NextResponse.json({ error: 'Failed to remove book from library' }, { status: 500 });
  }
}
