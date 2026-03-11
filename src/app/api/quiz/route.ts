import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getOpenAI, AI_MODEL, buildChapterQuizPrompt } from '@/lib/openai';
import type { QuizQuestion } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { chapterText, chapterTitle } = await req.json() as {
      chapterText: string;
      chapterTitle: string;
    };

    if (!chapterText) {
      return NextResponse.json({ error: 'Missing chapterText' }, { status: 400 });
    }

    const openai = getOpenAI();

    const response = await openai.chat.completions.create({
      model: AI_MODEL,
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: buildChapterQuizPrompt(chapterTitle ?? 'This Chapter', chapterText),
        },
      ],
    });

    const raw = response.choices[0]?.message?.content ?? '[]';

    // Strip markdown fences if present
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let questions: QuizQuestion[];
    try {
      questions = JSON.parse(cleaned);
    } catch {
      console.error('[Quiz] JSON parse failed:', cleaned);
      return NextResponse.json({ error: 'Failed to parse quiz questions' }, { status: 500 });
    }

    // Validate structure
    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: 'No questions generated' }, { status: 500 });
    }

    return NextResponse.json({ questions: questions.slice(0, 10) });
  } catch (err) {
    console.error('[Quiz Route Error]', err);
    return NextResponse.json({ error: 'Quiz generation failed' }, { status: 500 });
  }
}
