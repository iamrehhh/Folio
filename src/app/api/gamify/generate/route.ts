import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getOpenAI, AI_MODEL } from '@/lib/openai';

export const maxDuration = 60; // Allow longer generation times

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { mode } = await req.json(); // 'vocab' or 'idiom'
    if (mode !== 'vocab' && mode !== 'idiom') {
      return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });
    }

    // 1. Fetch user's previous mastery to avoid too many repeats
    // We explicitly limit this to the 30 most recently seen words so that
    // the accuracy calculation below is a "Rolling Accuracy" and adapts quickly.
    const { data: mastery } = await supabase
      .from('gamify_mastery')
      .select('word, times_seen, correct_count, last_seen_at')
      .eq('user_id', user.id)
      .eq('type', mode)
      .order('last_seen_at', { ascending: false })
      .limit(30);

    // Last 20 words to completely avoid
    const avoidedWords = (mastery || []).slice(0, 20).map(m => m.word).join(', ') || 'None';

    // 2. Identify "Weak Words" (words they got wrong at least once recently) 
    // to explicitly re-test them (Spaced Repetition)
    const weakWords = (mastery || [])
      .filter(m => m.correct_count < m.times_seen)
      .slice(0, 2) // Pick up to 2 weak words to re-inject
      .map(m => m.word)
      .join(', ');

    // 3. Determine Dynamic Difficulty based on Accuracy (instead of Score)
    const totalSeen = (mastery || []).reduce((acc, m) => acc + m.times_seen, 0);
    const totalCorrect = (mastery || []).reduce((acc, m) => acc + m.correct_count, 0);
    
    let difficultyContext = 'intermediate';
    
    if (totalSeen >= 10) {
      const accuracy = totalCorrect / totalSeen;
      if (accuracy < 0.5) {
        difficultyContext = 'fundamental/beginner (keep it easy but useful)';
      } else if (accuracy > 0.8) {
        difficultyContext = 'highly advanced and nuanced (make it challenging)';
      }
    }

    const openai = getOpenAI();

    const systemPrompt = `You are an expert English language tutor. Generate a daily 5-question adaptive multiple-choice quiz for a student learning ${difficultyContext} ${mode === 'vocab' ? 'vocabulary' : 'idioms'}.
IMPORTANT: Do NOT use the following recently tested words/idioms: ${avoidedWords}.
${weakWords ? `CRITICAL SPACED REPETITION: The user previously struggled with these exact terms: [${weakWords}]. You MUST include them as testing questions in this set of 5 to help them practice.` : ''}

Return the response strictly as a JSON object with this exact schema:
{
  "questions": [
    {
      "term": "The word or idiom being tested in title case.",
      "options": ["Option A", "Option B", "Option C", "Option D"], // 4 short, distinct definitions
      "correctIndex": 0, // Integer 0-3 corresponding to the correct definition
      "definition": "A clear, dictionary-style definition of the term.",
      "example": "A highly illustrative English sentence using the term correctly.",
      "synonyms": ["synonym1", "synonym2", "synonym3"] // Exactly 3 synonyms
    }
  ]
}
Make sure all distracting options are plausible but definitely incorrect.
CRITICAL RULE: All 4 options (the correct answer and the 3 distractors) MUST be approximately the EXACT SAME length (word count) and grammatical structure. Do NOT make the correct answer noticeably longer or more detailed than the distractors, otherwise the game is too predictable!
`;

    const response = await openai.chat.completions.create({
      model: AI_MODEL,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Please generate a fresh set of 5 ${mode === 'vocab' ? 'vocabulary words' : 'idioms'}.` }
      ]
    });

    const parsed = JSON.parse(response.choices[0]?.message?.content || '{}');

    if (!parsed.questions || !Array.isArray(parsed.questions) || parsed.questions.length !== 5) {
      throw new Error('AI returned an invalid quiz schema');
    }

    // Completely eliminate AI option-placing bias by shuffling the options on our backend
    parsed.questions = parsed.questions.map((q: any) => {
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

    return NextResponse.json(parsed);
  } catch (err) {
    console.error('[Gamify Generate API Error]', err);
    return NextResponse.json({ error: 'Failed to generate questions' }, { status: 500 });
  }
}
