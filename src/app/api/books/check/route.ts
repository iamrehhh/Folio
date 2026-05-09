import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const searchParams = req.nextUrl.searchParams;
    const title = searchParams.get('title');
    const author = searchParams.get('author');

    if (!title || !author) {
      return NextResponse.json({ error: 'Missing title or author' }, { status: 400 });
    }

    const adminSupabase = createAdminClient();
    
    // Check if the exact title and author exist for this user
    const { data: existingBook, error: dbError } = await adminSupabase
      .from('books')
      .select('id')
      .eq('uploaded_by', user.id)
      .ilike('title', title)
      .ilike('author', author)
      .maybeSingle();

    if (dbError && dbError.code !== 'PGRST116') {
      console.error('[Books Check API DB Error]', dbError);
    }

    return NextResponse.json({ exists: !!existingBook });
  } catch (err) {
    console.error('[Books Check API Error]', err);
    return NextResponse.json({ error: 'Failed to check book' }, { status: 500 });
  }
}
