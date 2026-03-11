import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getOpenAI, AI_MODEL, buildAIAssistantSystemPrompt } from '@/lib/openai';
import type { AIMessage } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { messages, chapterText, bookTitle } = body as {
      messages: AIMessage[];
      chapterText: string;
      bookTitle: string;
    };

    if (!messages || !chapterText) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const openai = getOpenAI();

    const response = await openai.chat.completions.create({
      model: AI_MODEL,
      max_tokens: 600,
      messages: [
        { role: 'system', content: buildAIAssistantSystemPrompt(chapterText, bookTitle) },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
    });

    const reply = response.choices[0]?.message?.content ?? 'No response generated.';
    return NextResponse.json({ reply });
  } catch (err) {
    console.error('[AI Route Error]', err);
    return NextResponse.json({ error: 'AI request failed' }, { status: 500 });
  }
}
