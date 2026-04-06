import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

const ADMIN_EMAIL = 'abdulrehanoffical@gmail.com';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { is_active } = await req.json();
    if (typeof is_active !== 'boolean') {
      return NextResponse.json({ error: 'is_active query parameter is required' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { error, data } = await admin
      .from('system_notifications')
      .update({ is_active })
      .eq('id', params.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ notification: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
