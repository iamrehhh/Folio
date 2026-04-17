import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { url } = req;
    const urlObj = new URL(url);
    const status = urlObj.searchParams.get('status') || 'active'; // 'active' or 'resolved'

    const { data, error } = await supabase
      .from('bug_reports')
      .select('*, user:profiles(full_name, avatar_url)')
      .eq('user_id', user.id)
      .eq('status', status)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ reports: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { subject, initialMessage, screenshotUrl, ocrText } = await req.json();

    if (!subject || !initialMessage) {
      return NextResponse.json({ error: 'Subject and message are required' }, { status: 400 });
    }

    // 1. Create report
    const { data: report, error: reportError } = await supabase
      .from('bug_reports')
      .insert({
        user_id: user.id,
        subject
      })
      .select()
      .single();

    if (reportError) throw reportError;

    // 2. Create initial message
    const { error: msgError } = await supabase
      .from('bug_report_messages')
      .insert({
        report_id: report.id,
        sender_id: user.id,
        message: initialMessage,
        screenshot_url: screenshotUrl || null,
        ocr_text: ocrText || null
      });

    if (msgError) throw msgError;

    return NextResponse.json({ report });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
