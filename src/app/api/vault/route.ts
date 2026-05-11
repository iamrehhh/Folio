import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { VaultCategory } from '@/types';

// GET — list vault entries (optionally filtered by category)
export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') as VaultCategory | null;

    let query = supabase
      .from('vault_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('is_pinned', { ascending: false })
      .order('updated_at', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) throw error;
    return NextResponse.json({ entries: data });
  } catch (err) {
    console.error('[Vault GET Error]', err);
    return NextResponse.json({ error: 'Failed to fetch vault entries' }, { status: 500 });
  }
}

// POST — create a new vault entry
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json() as {
      category: VaultCategory;
      title?: string;
      content: string;
      color?: string;
    };

    if (!body.content?.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('vault_entries')
      .insert({
        user_id: user.id,
        category: body.category || 'note',
        title: body.title?.trim() || null,
        content: body.content.trim(),
        color: body.color || 'default',
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ entry: data });
  } catch (err) {
    console.error('[Vault POST Error]', err);
    return NextResponse.json({ error: 'Failed to create vault entry' }, { status: 500 });
  }
}
