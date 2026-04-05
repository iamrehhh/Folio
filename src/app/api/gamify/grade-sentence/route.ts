import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getOpenAI, AI_MODEL } from '@/lib/openai';

export const maxDuration = 45;

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { sentence, term } = await req.json();

    if (!sentence || !term) {
      return NextResponse.json({ error: 'Missing sentence or term' }, { status: 400 });
    }

    const openai = getOpenAI();

    const systemPrompt = `You are a helpful English language tutor. The user is practicing the term: "${term}".
They have written the following sentence: ${sentence}

Give them short, constructive, and friendly feedback (max 3 sentences). 
Focus on:
1. Did they use the word accurately?
2. Is the grammar correct?
3. How could it be improved or sound more natural?`;

    // Attempt to stream
    const response = await openai.chat.completions.create({
      model: AI_MODEL,
      stream: true,
      messages: [
        { role: 'system', content: systemPrompt }
      ]
    });

    // Handle Streaming correctly for Next.js App Router
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of response) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              controller.enqueue(new TextEncoder().encode(content));
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      }
    });

    return new Response(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });

  } catch (err) {
    console.error('[Gamify Grade API Error]', err);
    return new Response('Failed to grade sentence.', { status: 500 });
  }
}
