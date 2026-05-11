import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/books/[bookId]/ratings — get aggregate rating stats + current user's rating
export async function GET(
  _req: Request,
  { params }: { params: { bookId: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bookId } = params;

    // Fetch all ratings for this book to compute stats
    const { data: allRatings, error: ratingsError } = await supabase
      .from('book_ratings')
      .select('rating, user_id')
      .eq('book_id', bookId);

    if (ratingsError) {
      console.error('[Ratings GET Error]', ratingsError);
      return NextResponse.json({ error: 'Failed to fetch ratings' }, { status: 500 });
    }

    const ratings = allRatings ?? [];
    const totalRatings = ratings.length;
    const averageRating = totalRatings > 0
      ? Math.round((ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings) * 10) / 10
      : 0;

    // Rating distribution (1-5)
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratings.forEach(r => { distribution[r.rating] = (distribution[r.rating] || 0) + 1; });

    // Current user's rating
    const userRating = ratings.find(r => r.user_id === user.id)?.rating ?? null;

    return NextResponse.json({
      averageRating,
      totalRatings,
      distribution,
      userRating,
    });
  } catch (error) {
    console.error('[Ratings GET Exception]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
