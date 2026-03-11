import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getOpenAI, AI_MODEL, buildContextualDefinitionPrompt } from '@/lib/openai';
import type { DictionaryEntry } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const word = searchParams.get('word');
    const paragraph = searchParams.get('paragraph') ?? '';

    if (!word) {
      return NextResponse.json({ error: 'Missing word parameter' }, { status: 400 });
    }

    // Fetch dictionary definition and AI context in parallel
    const [dictRes, aiResult] = await Promise.allSettled([
      fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`),
      (async () => {
        if (!paragraph) return null;
        const openai = getOpenAI();
        const response = await openai.chat.completions.create({
          model: AI_MODEL,
          max_tokens: 150,
          messages: [
            {
              role: 'user',
              content: buildContextualDefinitionPrompt(word, paragraph),
            },
          ],
        });
        return response.choices[0]?.message?.content ?? null;
      })(),
    ]);

    let dictionaryData: DictionaryEntry | null = null;
    if (dictRes.status === 'fulfilled' && dictRes.value.ok) {
      const data = await dictRes.value.json();
      if (Array.isArray(data) && data.length > 0) {
        dictionaryData = data[0] as DictionaryEntry;
      }
    }

    const aiContext = aiResult.status === 'fulfilled' ? aiResult.value : null;

    return NextResponse.json({ dictionary: dictionaryData, aiContext });
  } catch (err) {
    console.error('[Dictionary Route Error]', err);
    return NextResponse.json({ error: 'Definition lookup failed' }, { status: 500 });
  }
}
