import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('bug_report_messages')
      .select('*, sender:profiles(full_name, avatar_url)')
      .eq('report_id', params.id)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ messages: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, screenshotUrl, ocrText } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('bug_report_messages')
      .insert({
        report_id: params.id,
        sender_id: user.id,
        message,
        screenshot_url: screenshotUrl || null,
        ocr_text: ocrText || null
      });

    if (error) throw error;

    // touch the updated_at timestamp on the report
    await supabase
      .from('bug_reports')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', params.id);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
