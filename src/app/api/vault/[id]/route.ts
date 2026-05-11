import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// PATCH — update a vault entry
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json() as {
      title?: string | null;
      content?: string;
      color?: string;
      category?: string;
      is_pinned?: boolean;
    };

    const updates: Record<string, any> = {};
    if (body.title !== undefined) updates.title = body.title?.trim() || null;
    if (body.content !== undefined) updates.content = body.content.trim();
    if (body.color !== undefined) updates.color = body.color;
    if (body.category !== undefined) updates.category = body.category;
    if (body.is_pinned !== undefined) updates.is_pinned = body.is_pinned;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('vault_entries')
      .update(updates)
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ entry: data });
  } catch (err) {
    console.error('[Vault PATCH Error]', err);
    return NextResponse.json({ error: 'Failed to update vault entry' }, { status: 500 });
  }
}

// DELETE — remove a vault entry
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { error } = await supabase
      .from('vault_entries')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Vault DELETE Error]', err);
    return NextResponse.json({ error: 'Failed to delete vault entry' }, { status: 500 });
  }
}
