import { NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';

const ADMIN_EMAILS = ['abdulrehanoffical@gmail.com', 'jesanequebal649@gmail.com'];

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !ADMIN_EMAILS.includes(user.email as string)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { status } = await req.json();

    if (!['active', 'resolved'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { error } = await admin
      .from('bug_reports')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', params.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
