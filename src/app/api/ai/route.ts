import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getOpenAI, AI_MODEL, buildAIAssistantSystemPrompt } from '@/lib/openai';
import type { AIMessage } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { messages, chapterText, bookTitle } = body as {
      messages: AIMessage[];
      chapterText: string;
      bookTitle: string;
    };

    if (!messages || !chapterText) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const openai = getOpenAI();

    const stream = await openai.chat.completions.create({
      model: AI_MODEL,
      max_tokens: 600,
      stream: true,
      messages: [
        { role: 'system', content: buildAIAssistantSystemPrompt(chapterText, bookTitle) },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
    });

    // Create a ReadableStream that sends SSE-formatted chunks
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta?.content;
            if (delta) {
              // Send each token as an SSE data event
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: delta })}\n\n`));
            }
          }
          // Signal end of stream
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (err) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Stream failed' })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (err) {
    console.error('[AI Route Error]', err);
    return new Response(JSON.stringify({ error: 'AI request failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
