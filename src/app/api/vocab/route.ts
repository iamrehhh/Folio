import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST — save word
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json() as {
      bookId: string;
      word: string;
      definition: string;
      pronunciation?: string;
      partOfSpeech?: string;
      aiContext?: string;
      sourceSentence?: string;
      chapterIndex: number;
      chapterTitle?: string;
    };

    const { data, error } = await supabase
      .from('vocab_words')
      .upsert(
        {
          user_id: user.id,
          book_id: body.bookId,
          word: body.word.toLowerCase(),
          definition: body.definition,
          pronunciation: body.pronunciation ?? null,
          part_of_speech: body.partOfSpeech ?? null,
          ai_context: body.aiContext ?? null,
          source_sentence: body.sourceSentence ?? null,
          chapter_index: body.chapterIndex,
          chapter_title: body.chapterTitle ?? null,
        },
        { onConflict: 'user_id,word,book_id', ignoreDuplicates: false }
      )
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ word: data });
  } catch (err) {
    console.error('[Vocab POST Error]', err);
    return NextResponse.json({ error: 'Failed to save word' }, { status: 500 });
  }
}

// DELETE — remove word
export async function DELETE(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await req.json() as { id: string };

    const { error } = await supabase
      .from('vocab_words')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Vocab DELETE Error]', err);
    return NextResponse.json({ error: 'Failed to delete word' }, { status: 500 });
  }
}
