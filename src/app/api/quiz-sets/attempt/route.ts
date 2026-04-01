import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { getOpenAI, AI_MODEL, buildAnswerCheckPrompt } from '@/lib/openai';

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { quizSetId, stage, answers } = await req.json();
    const admin = createAdminClient();

    if (stage === 'test' && answers) {
      const { data: set } = await admin
        .from('daily_quiz_sets').select('*').eq('id', quizSetId).single();
      if (!set) return NextResponse.json({ error: 'Set not found' }, { status: 404 });

      const questions = set.fill_blanks as any[];
      const wordList = (set.items as any[]).map((w: any) => w.word);

      const openai = getOpenAI();
      const checkRes = await openai.chat.completions.create({
        model: AI_MODEL, max_tokens: 1000,
        messages: [{ role: 'user', content: buildAnswerCheckPrompt(questions, answers, wordList) }],
      });

      const checkData = JSON.parse(
        (checkRes.choices[0]?.message?.content ?? '{}').replace(/```json|```/g, '').trim()
      );

      const { data: attempt, error } = await admin.from('quiz_attempts')
        .upsert({
          user_id: user.id, quiz_set_id: quizSetId, stage: 'read',
          answers, score: checkData.totalScore, feedback: checkData,
        }, { onConflict: 'user_id,quiz_set_id' }).select().single();

      if (error) throw error;
      return NextResponse.json({ attempt, results: checkData });
    }

    const { data: attempt, error } = await admin.from('quiz_attempts')
      .upsert({
        user_id: user.id, quiz_set_id: quizSetId, stage,
        ...(stage === 'complete' ? { completed_at: new Date().toISOString() } : {}),
      }, { onConflict: 'user_id,quiz_set_id' }).select().single();

    if (error) throw error;
    return NextResponse.json({ attempt });
  } catch (err) {
    console.error('[Quiz Attempt Error]', err);
    return NextResponse.json({ error: 'Failed to update attempt' }, { status: 500 });
  }
}
