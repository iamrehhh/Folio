import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { getOpenAI, AI_MODEL, buildVocabSetPrompt, buildIdiomSetPrompt, buildFillBlanksPrompt, buildPassagePrompt } from '@/lib/openai';

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') as 'vocabulary' | 'idiom';
    if (!type) return NextResponse.json({ error: 'Missing type' }, { status: 400 });

    const today = new Date().toISOString().split('T')[0];
    const admin = createAdminClient();

    // Check if today's set already exists
    const { data: existing } = await admin
      .from('daily_quiz_sets')
      .select('*')
      .eq('type', type)
      .eq('date', today)
      .single();

    if (existing) {
      // Get user's attempt for this set
      const { data: attempt } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('user_id', user.id)
        .eq('quiz_set_id', existing.id)
        .single();

      return NextResponse.json({ set: existing, attempt: attempt ?? null });
    }

    // Generate new set — get last 7 days of used words to avoid repeats
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: recentSets } = await admin
      .from('daily_quiz_sets')
      .select('items')
      .eq('type', type)
      .gte('date', sevenDaysAgo.toISOString().split('T')[0]);

    const usedWords: string[] = [];
    for (const s of recentSets ?? []) {
      const items = s.items as any[];
      items?.forEach((item: any) => usedWords.push(item.word));
    }

    const openai = getOpenAI();

    // Generate words/idioms
    const prompt = type === 'vocabulary'
      ? buildVocabSetPrompt(usedWords)
      : buildIdiomSetPrompt(usedWords);

    const wordsRes = await openai.chat.completions.create({
      model: AI_MODEL,
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const wordsText = wordsRes.choices[0]?.message?.content ?? '{}';
    const wordsData = JSON.parse(wordsText.replace(/```json|```/g, '').trim());
    const items = wordsData.words;
    const wordList = items.map((w: any) => w.word);

    // Generate fill-in-the-blank questions
    const fillPrompt = buildFillBlanksPrompt(wordList, type);
    const fillRes = await openai.chat.completions.create({
      model: AI_MODEL,
      max_tokens: 1500,
      messages: [{ role: 'user', content: fillPrompt }],
    });

    const fillText = fillRes.choices[0]?.message?.content ?? '{}';
    const fillData = JSON.parse(fillText.replace(/```json|```/g, '').trim());

    // Generate reading passage
    const passagePrompt = buildPassagePrompt(wordList, type);
    const passageRes = await openai.chat.completions.create({
      model: AI_MODEL,
      max_tokens: 500,
      messages: [{ role: 'user', content: passagePrompt }],
    });
    const passage = passageRes.choices[0]?.message?.content ?? '';

    // Save to DB
    const { data: newSet, error } = await admin
      .from('daily_quiz_sets')
      .insert({
        type,
        date: today,
        items,
        fill_blanks: fillData.questions,
        passage,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ set: newSet, attempt: null });
  } catch (err) {
    console.error('[Quiz Sets GET Error]', err);
    return NextResponse.json({ error: 'Failed to get quiz set' }, { status: 500 });
  }
}
