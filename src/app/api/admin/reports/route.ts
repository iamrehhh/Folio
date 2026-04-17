import { NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';

const ADMIN_EMAILS = ['abdulrehanoffical@gmail.com', 'jesanequebal649@gmail.com'];

export async function GET(req: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !ADMIN_EMAILS.includes(user.email as string)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { url } = req;
    const urlObj = new URL(url);
    const status = urlObj.searchParams.get('status') || 'active';

    const admin = createAdminClient();
    const { data, error } = await admin
      .from('bug_reports')
      .select('*, user:profiles(full_name, avatar_url, email)')
      .eq('status', status)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ reports: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !ADMIN_EMAILS.includes(user.email as string)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { ids } = await req.json();
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No IDs provided for deletion' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { error } = await admin
      .from('bug_reports')
      .delete()
      .in('id', ids);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
