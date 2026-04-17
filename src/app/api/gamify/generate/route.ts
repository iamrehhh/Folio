import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { mode } = await req.json(); // 'vocab' or 'idiom'
    if (mode !== 'vocab' && mode !== 'idiom') {
      return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });
    }

    // 1. Read static bank
    const filePath = path.join(process.cwd(), 'src', 'lib', 'question-banks', `${mode === 'idiom' ? 'idioms' : 'vocab'}.json`);
    const bankData = fs.readFileSync(filePath, 'utf8');
    const questionBank = JSON.parse(bankData);

    // 2. Fetch user's previous mastery to ensure we don't repeat words
    const { data: mastery } = await supabase
      .from('gamify_mastery')
      .select('word')
      .eq('user_id', user.id)
      .eq('type', mode);

    const seenWords = new Set((mastery || []).map(m => m.word.toLowerCase()));

    // 3. Filter bank to only hold unseen questions
    const availableQuestions = questionBank.filter((q: any) => !seenWords.has(q.term.toLowerCase()));

    if (availableQuestions.length === 0) {
      return NextResponse.json({ error: `Congratulations! You have attempted every single ${mode === 'vocab' ? 'vocabulary word' : 'idiom'} in the question bank.` }, { status: 400 });
    }

    // 4. Select up to 5 random distinct questions from available bank
    const shuffledBank = [...availableQuestions].sort(() => 0.5 - Math.random());
    let selectedQuestions = shuffledBank.slice(0, 5);

    // 3. Shuffle options for each selected question
    selectedQuestions = selectedQuestions.map((q: any) => {
      if (!q.options || q.correctIndex === undefined) return q;
      
      const originalCorrectAnswer = q.options[q.correctIndex];
      
      // Shuffle options objectively
      const shuffledOptions = [...q.options]
        .map(value => ({ value, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ value }) => value);
        
      const newCorrectIndex = shuffledOptions.findIndex(opt => opt === originalCorrectAnswer);
      
      return {
        ...q,
        options: shuffledOptions,
        correctIndex: newCorrectIndex !== -1 ? newCorrectIndex : 0
      };
    });

    return NextResponse.json({ questions: selectedQuestions });
  } catch (err) {
    console.error('[Gamify Generate API Error]', err);
    return NextResponse.json({ error: 'Failed to generate questions' }, { status: 500 });
  }
}
