import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { getOpenAI, AI_MODEL, buildCustomPassagePrompt } from '@/lib/openai';

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { quizSetId, theme, type } = await req.json();
    if (!quizSetId || !theme || !type) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const admin = createAdminClient();

    // 1. Fetch the vocabulary words from the quiz set
    const { data: set } = await admin.from('daily_quiz_sets')
      .select('items')
      .eq('id', quizSetId)
      .single();

    if (!set) return NextResponse.json({ error: 'Set not found' }, { status: 404 });
    const wordList = (set.items as any[]).map((w: any) => w.word);

    // 2. Generate the custom passage
    const openai = getOpenAI();
    let customPassage = '';
    try {
      const res = await openai.chat.completions.create({
        model: AI_MODEL,
        max_tokens: 600,
        messages: [{ role: 'user', content: buildCustomPassagePrompt(wordList, type, theme) }],
      });
      customPassage = res.choices[0]?.message?.content?.trim() || '';
    } catch (e) {
      console.error('OpenAI passage generation failed:', e);
      return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
    }

    if (!customPassage) {
      return NextResponse.json({ error: 'Empty passage returned' }, { status: 500 });
    }

    // 3. Update the user's quiz attempt
    const { data: currentAttempt } = await admin.from('quiz_attempts')
      .select('feedback')
      .eq('user_id', user.id)
      .eq('quiz_set_id', quizSetId)
      .single();

    const existingFeedback = currentAttempt?.feedback || {};
    const newFeedback = { ...existingFeedback, customPassage };

    const { error } = await admin.from('quiz_attempts')
      .update({ feedback: newFeedback, stage: 'read' })
      .eq('user_id', user.id)
      .eq('quiz_set_id', quizSetId);

    if (error) throw error;

    return NextResponse.json({ customPassage });
  } catch (err) {
    console.error('[Custom Passage Error]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
