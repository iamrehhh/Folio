import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { pointsEarned, mode, wordsSeen } = await req.json();

    if (typeof pointsEarned !== 'number' || !mode || !Array.isArray(wordsSeen)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // 1. Update overall gamify score
    const { data: profile } = await supabase
      .from('profiles')
      .select('gamify_score')
      .eq('id', user.id)
      .single();

    const previousScore = profile?.gamify_score || 0;

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ gamify_score: previousScore + pointsEarned })
      .eq('id', user.id);

    if (profileError) throw profileError;

    // 2. Update/Upsert gamify mastery for each word
    // We fetch existing records to increment, or insert new ones
    // Batch processing isn't natively "upsert" with increment without RPC in Supabase,
    // but we can just query them, prepare updates, and upsert.
    
    const words = wordsSeen.map((w: any) => w.word);
    
    const { data: existingMastery } = await supabase
      .from('gamify_mastery')
      .select('*')
      .eq('user_id', user.id)
      .in('word', words);

    const masteryMap = new Map((existingMastery || []).map(m => [m.word, m]));

    const upserts = wordsSeen.map((ws: any) => {
      const existing = masteryMap.get(ws.word);
      return {
        id: existing?.id, // Let Supabase auto-generate if missing
        user_id: user.id,
        word: ws.word,
        type: mode,
        times_seen: (existing?.times_seen || 0) + 1,
        correct_count: (existing?.correct_count || 0) + (ws.correct ? 1 : 0),
        last_seen_at: new Date().toISOString()
      };
    });

    const { error: masteryError } = await supabase
      .from('gamify_mastery')
      .upsert(upserts, { onConflict: 'user_id, word' });

    if (masteryError) throw masteryError;

    return NextResponse.json({ success: true, newScore: previousScore + pointsEarned });
  } catch (err) {
    console.error('[Gamify Submit API Error]', err);
    return NextResponse.json({ error: 'Failed to submit score' }, { status: 500 });
  }
}
