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
    const word      = searchParams.get('word');
    const paragraph = searchParams.get('paragraph') ?? '';

    if (!word) {
      return NextResponse.json({ error: 'Missing word parameter' }, { status: 400 });
    }

    // Fetch dictionary + AI context in parallel
    const [dictRes, aiResult] = await Promise.allSettled([
      fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`),
      (async () => {
        if (!paragraph) return null;
        const openai = getOpenAI();
        const response = await openai.chat.completions.create({
          model: AI_MODEL,
          response_format: { type: 'json_object' },
          max_tokens: 250,
          messages: [{ role: 'user', content: buildContextualDefinitionPrompt(word, paragraph) }],
        });
        const content = response.choices[0]?.message?.content;
        return content ? JSON.parse(content) : null;
      })(),
    ]);

    // Parse all dictionary entries
    let dictionaryData: DictionaryEntry | null = null;
    let allDefinitions: { partOfSpeech: string; definition: string }[] = [];

    if (dictRes.status === 'fulfilled' && dictRes.value.ok) {
      const data = await dictRes.value.json();
      if (Array.isArray(data) && data.length > 0) {
        dictionaryData = data[0] as DictionaryEntry;

        // Collect all definitions across all meanings
        for (const entry of data) {
          for (const meaning of entry.meanings ?? []) {
            for (const def of meaning.definitions ?? []) {
              allDefinitions.push({
                partOfSpeech: meaning.partOfSpeech,
                definition: def.definition,
              });
            }
          }
        }
      }
    }

    const aiData = aiResult.status === 'fulfilled' ? aiResult.value : null;
    const aiContext = aiData?.contextualMeaning ?? null;

    if (dictionaryData && aiData?.phonetic) {
      dictionaryData.phonetic = aiData.phonetic;
    }

    // If we have multiple definitions and a paragraph context,
    // use AI to pick the most appropriate one
    if (allDefinitions.length > 1 && paragraph && dictionaryData) {
      try {
        const openai = getOpenAI();
        const defList = allDefinitions
          .slice(0, 8) // limit to 8 to avoid token bloat
          .map((d, i) => `${i + 1}. [${d.partOfSpeech}] ${d.definition}`)
          .join('\n');

        const pickResponse = await openai.chat.completions.create({
          model: AI_MODEL,
          max_tokens: 20,
          messages: [{
            role: 'user',
            content: `Given this sentence: "${paragraph.slice(0, 300)}"\n\nWhich numbered definition best fits the word "${word}"?\n\n${defList}\n\nReply with only the number.`,
          }],
        });

        const replyContent = pickResponse.choices[0]?.message?.content?.trim() ?? '1';
        const numberMatch = replyContent.match(/\d+/);
        const picked = numberMatch ? parseInt(numberMatch[0], 10) : 1;
        
        const bestIdx = isNaN(picked) ? 0 : Math.max(0, Math.min(picked - 1, allDefinitions.length - 1));
        const best = allDefinitions[bestIdx];

        if (best && dictionaryData.meanings) {
          // Reorder meanings so the best match appears first
          const reordered = [...dictionaryData.meanings];
          const matchingMeaningIdx = reordered.findIndex(m =>
            m.partOfSpeech === best.partOfSpeech &&
            m.definitions?.some(d => d.definition === best.definition)
          );
          if (matchingMeaningIdx > 0) {
            const [matched] = reordered.splice(matchingMeaningIdx, 1);
            // Move matched definition to top of that meaning
            const defIdx = matched.definitions?.findIndex(d => d.definition === best.definition) ?? -1;
            if (defIdx > 0 && matched.definitions) {
              const [bestDef] = matched.definitions.splice(defIdx, 1);
              matched.definitions.unshift(bestDef);
            }
            reordered.unshift(matched);
            dictionaryData = { ...dictionaryData, meanings: reordered };
          }
        }
      } catch {
        // If AI picking fails, just use original order — no crash
      }
    }

    return NextResponse.json({ dictionary: dictionaryData, aiContext });
  } catch (err) {
    console.error('[Dictionary Route Error]', err);
    return NextResponse.json({ error: 'Definition lookup failed' }, { status: 500 });
  }
}
