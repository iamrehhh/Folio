import { NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';

const ADMIN_EMAILS = ['abdulrehanoffical@gmail.com', 'jesanequebal649@gmail.com'];

export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !ADMIN_EMAILS.includes(user.email as string)) {
      return NextResponse.json({ count: 0 }, { status: 403 });
    }

    const admin = createAdminClient();
    const { count, error } = await admin
      .from('bug_reports')
      .select('id', { count: 'exact', head: true })
      .eq('has_unread_user_message', true)
      .eq('status', 'active');

    if (error) throw error;

    return NextResponse.json({ count: count || 0 });
  } catch (err: any) {
    console.error('Error fetching admin unread reports:', err);
    return NextResponse.json({ count: 0 });
  }
}
