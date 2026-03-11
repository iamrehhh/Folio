import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { bookId, chapterIndex, chapterTitle, score, totalQuestions, answers } = body;

    const { data, error } = await supabase
      .from('quiz_results')
      .insert({
        user_id: user.id,
        book_id: bookId,
        chapter_index: chapterIndex,
        chapter_title: chapterTitle ?? null,
        score,
        total_questions: totalQuestions,
        answers,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ result: data });
  } catch (err) {
    console.error('[Quiz Results POST Error]', err);
    return NextResponse.json({ error: 'Failed to save quiz result' }, { status: 500 });
  }
}
