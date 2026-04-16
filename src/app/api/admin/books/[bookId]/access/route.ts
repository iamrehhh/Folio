import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

const ADMIN_EMAILS = ['abdulrehanoffical@gmail.com', 'jesanequebal649@gmail.com'];

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/admin/books/[bookId]/access
export async function GET(req: Request, { params }: { params: { bookId: string } }) {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !ADMIN_EMAILS.includes(user.email as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bookId = params.bookId;

    const { data: users, error: usersError } = await admin
      .from('profiles')
      .select('id, full_name, email, avatar_url')
      .order('full_name', { ascending: true });

    if (usersError) throw usersError;

    const { data: access, error: accessError } = await admin
      .from('book_access')
      .select('user_id')
      .eq('book_id', bookId);

    if (accessError) throw accessError;

    const accessSet = new Set((access ?? []).map(a => a.user_id));

    const result = users?.map(u => ({
      ...u,
      assigned: accessSet.has(u.id)
    }));

    return NextResponse.json({ users: result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT /api/admin/books/[bookId]/access
export async function PUT(req: Request, { params }: { params: { bookId: string } }) {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !ADMIN_EMAILS.includes(user.email as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bookId = params.bookId;
    const { userIds } = await req.json() as { userIds: string[] };

    if (!Array.isArray(userIds)) {
      return NextResponse.json({ error: 'Invalid userIds array' }, { status: 400 });
    }

    // 1. Get current assigned users
    const { data: currentAccess } = await admin
      .from('book_access')
      .select('user_id')
      .eq('book_id', bookId);

    const currentSet = new Set((currentAccess ?? []).map(a => a.user_id));
    const newSet = new Set(userIds);

    const toAdd = userIds.filter(id => !currentSet.has(id));
    const toRemove = Array.from(currentSet).filter(id => !newSet.has(id));

    // 2. Remove old access
    if (toRemove.length > 0) {
      const { error: removeError } = await admin
        .from('book_access')
        .delete()
        .eq('book_id', bookId)
        .in('user_id', toRemove);
      
      if (removeError) throw removeError;
    }

    // 3. Add new access
    if (toAdd.length > 0) {
      const rows = toAdd.map(id => ({
        book_id: bookId,
        user_id: id,
        granted_by: user.id
      }));

      const { error: insertError } = await admin.from('book_access').insert(rows);
      if (insertError) throw insertError;

      // Book info for notifications
      const { data: book } = await admin.from('books').select('title').eq('id', bookId).single();

      if (book) {
        const notifications = toAdd.map(userId => ({
          user_id: userId,
          type: 'system',
          title: 'New Book Assigned',
          message: `The admin has assigned you a new book: "${book.title}"`,
          is_read: false
        }));

        try {
          await admin.from('user_notifications').insert(notifications);
        } catch {
          // Table may not exist yet — silently ignore
        }
      }
    }

    // 4. FIX: Update book visibility based on assignment state
    //    - If users are assigned → set visibility to 'assigned' so RLS allows access via book_access
    //    - If all users removed → revert to 'private'
    const finalCount = newSet.size;
    const newVisibility = finalCount > 0 ? 'assigned' : 'private';

    const { error: updateError } = await admin
      .from('books')
      .update({ visibility: newVisibility })
      .eq('id', bookId);
      
    if (updateError) throw updateError;

    return NextResponse.json({ success: true, added: toAdd.length, removed: toRemove.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}