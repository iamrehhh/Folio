import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bookId, rating } = await req.json();

    if (!bookId || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Invalid rating data' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('book_ratings')
      .upsert({
        user_id: user.id,
        book_id: bookId,
        rating: Math.floor(rating),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id, book_id'
      })
      .select()
      .single();

    if (error) {
      console.error('[Book Rating Error]', error);
      return NextResponse.json({ error: 'Failed to submit rating' }, { status: 500 });
    }

    return NextResponse.json({ rating: data });
  } catch (error) {
    console.error('[Book Rating Exception]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
