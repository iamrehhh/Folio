import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { bookId, cfi, chapterIndex, chapterTitle, progressPercent } = await req.json();

    const { error } = await supabase
      .from('reading_progress')
      .upsert(
        {
          user_id: user.id,
          book_id: bookId,
          cfi,
          chapter_index: chapterIndex,
          chapter_title: chapterTitle ?? null,
          progress_percent: progressPercent,
          last_read_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,book_id' }
      );

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Progress POST Error]', err);
    return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 });
  }
}
