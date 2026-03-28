import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { bookId, durationSeconds } = await req.json();

    if (!bookId || !durationSeconds || durationSeconds < 5) {
      return NextResponse.json({ success: true }); // ignore tiny sessions
    }

    const { error } = await supabase.from('reading_sessions').insert({
      user_id:          user.id,
      book_id:          bookId,
      started_at:       new Date(Date.now() - durationSeconds * 1000).toISOString(),
      duration_seconds: Math.round(durationSeconds),
    });

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Sessions POST Error]', err);
    return NextResponse.json({ error: 'Failed to save session' }, { status: 500 });
  }
}
