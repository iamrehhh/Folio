import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { HighlightColor } from '@/types';

// POST — create highlight
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json() as {
      bookId: string;
      cfiRange: string;
      text: string;
      color: HighlightColor;
      note?: string;
      chapterIndex: number;
      chapterTitle?: string;
      contextParagraph?: string;
    };

    const { data, error } = await supabase
      .from('highlights')
      .insert({
        user_id: user.id,
        book_id: body.bookId,
        cfi_range: body.cfiRange,
        text: body.text,
        color: body.color,
        note: body.note ?? null,
        chapter_index: body.chapterIndex,
        chapter_title: body.chapterTitle ?? null,
        context_paragraph: body.contextParagraph ?? null,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ highlight: data });
  } catch (err) {
    console.error('[Highlights POST Error]', err);
    return NextResponse.json({ error: 'Failed to save highlight' }, { status: 500 });
  }
}

// PATCH — update highlight (color or note)
export async function PATCH(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, color, note } = await req.json() as {
      id: string;
      color?: HighlightColor;
      note?: string;
    };

    const { data, error } = await supabase
      .from('highlights')
      .update({ ...(color && { color }), ...(note !== undefined && { note }) })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ highlight: data });
  } catch (err) {
    console.error('[Highlights PATCH Error]', err);
    return NextResponse.json({ error: 'Failed to update highlight' }, { status: 500 });
  }
}

// DELETE — remove highlight
export async function DELETE(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await req.json() as { id: string };

    const { error } = await supabase
      .from('highlights')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Highlights DELETE Error]', err);
    return NextResponse.json({ error: 'Failed to delete highlight' }, { status: 500 });
  }
}
