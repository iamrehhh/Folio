import { NextRequest, NextResponse } from 'next/server';
import { getOpenAI, AI_MODEL } from '@/lib/openai';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { term, definition, mode } = await req.json();
    const openai = getOpenAI();

    const response = await openai.chat.completions.create({
      model: AI_MODEL,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: `Provide a highly illustrative English sentence example and exactly 3 synonyms for the ${mode === 'vocab' ? 'vocabulary word' : 'idiomatic phrase'}: "${term}" relying on the definition: "${definition}". 
Return ONLY a valid JSON object strictly matching this schema:
{
  "example": "A highly illustrative English sentence using the term correctly in context.",
  "synonyms": ["synonym1", "synonym2", "synonym3"]
}` }
      ]
    });

    const parsed = JSON.parse(response.choices[0]?.message?.content || '{}');
    return NextResponse.json(parsed);
  } catch (err) {
    console.error('[Enrich API Error]', err);
    return NextResponse.json({ error: 'Failed to enrich term' }, { status: 500 });
  }
}
