import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { book_id, scheduled_for } = await req.json();

    if (!book_id || !scheduled_for) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('book_schedules')
      .upsert({ 
        user_id: user.id, 
        book_id, 
        scheduled_for 
      }, { onConflict: 'user_id, book_id' })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Schedule POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const book_id = searchParams.get('book_id');

    if (!book_id) {
      return NextResponse.json({ error: 'Missing book_id' }, { status: 400 });
    }

    const { error } = await supabase
      .from('book_schedules')
      .delete()
      .eq('user_id', user.id)
      .eq('book_id', book_id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Schedule DELETE error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
