import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }

    const { count: booksCount } = await supabase
      .from('books')
      .select('*', { count: 'exact', head: true })
      .eq('uploaded_by', user.id);

    const { count: booksFinished } = await supabase
      .from('reading_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('progress_percent', 100);

    const { count: totalHighlights } = await supabase
      .from('highlights')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    return NextResponse.json({
      profile,
      stats: {
        booksUploaded: booksCount ?? 0,
        booksFinished: booksFinished ?? 0,
        totalHighlights: totalHighlights ?? 0
      }
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { full_name } = body;

    if (full_name === undefined || typeof full_name !== 'string') {
      return NextResponse.json({ error: 'Invalid name provided' }, { status: 400 });
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ full_name: full_name.trim() })
      .eq('id', user.id);

    if (updateError) {
      console.error('Profile update error:', updateError);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    return NextResponse.json({ success: true, full_name: full_name.trim() });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
