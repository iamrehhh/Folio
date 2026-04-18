import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ hasUnread: false }, { status: 401 });
    }

    // Check if the user has any report with `has_unread_admin_message` = true
    const { data, error } = await supabase
      .from('bug_reports')
      .select('id')
      .eq('user_id', user.id)
      .eq('has_unread_admin_message', true)
      .limit(1);

    if (error) throw error;

    return NextResponse.json({ hasUnread: data && data.length > 0 });
  } catch (err: any) {
    console.error('Error fetching unread reports:', err);
    return NextResponse.json({ hasUnread: false }); // Fallback on error so the app doesn't break
  }
}
