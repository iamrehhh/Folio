import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

// GET /api/books/[bookId]/comments — fetch all comments for a book (threaded)
export async function GET(
  _req: Request,
  { params }: { params: { bookId: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bookId } = params;
    const admin = createAdminClient();

    // Fetch all comments for this book
    const { data: comments, error } = await admin
      .from('book_comments')
      .select('*')
      .eq('book_id', bookId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[Comments GET Error]', error);
      return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
    }

    // Fetch user profiles for all commenters
    const userIds = Array.from(new Set((comments ?? []).map((c: any) => c.user_id)));
    let profilesMap = new Map<string, { full_name: string | null; avatar_url: string | null }>();

    if (userIds.length > 0) {
      const { data: profiles } = await admin
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);

      (profiles ?? []).forEach((p: any) => {
        profilesMap.set(p.id, { full_name: p.full_name, avatar_url: p.avatar_url });
      });
    }

    // Attach user info to each comment
    const enrichedComments = (comments ?? []).map((c: any) => ({
      ...c,
      user: profilesMap.get(c.user_id) ?? { full_name: null, avatar_url: null },
    }));

    // Build threaded tree
    const topLevel: any[] = [];
    const childrenMap = new Map<string, any[]>();

    enrichedComments.forEach((c: any) => {
      if (c.parent_id) {
        if (!childrenMap.has(c.parent_id)) childrenMap.set(c.parent_id, []);
        childrenMap.get(c.parent_id)!.push(c);
      } else {
        topLevel.push(c);
      }
    });

    // Attach replies (supports 1 level of nesting)
    topLevel.forEach((c: any) => {
      c.replies = childrenMap.get(c.id) ?? [];
    });

    return NextResponse.json({ comments: topLevel, total: enrichedComments.length });
  } catch (error) {
    console.error('[Comments GET Exception]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/books/[bookId]/comments — create a comment (or reply)
export async function POST(
  req: Request,
  { params }: { params: { bookId: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bookId } = params;
    const admin = createAdminClient();
    const body = await req.json();
    const { content, parentId } = body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 });
    }

    if (content.length > 2000) {
      return NextResponse.json({ error: 'Comment must be under 2000 characters' }, { status: 400 });
    }

    // If replying, verify parent comment exists and belongs to same book
    if (parentId) {
      const { data: parent, error: parentErr } = await admin
        .from('book_comments')
        .select('id, book_id')
        .eq('id', parentId)
        .single();

      if (parentErr || !parent) {
        return NextResponse.json({ error: 'Parent comment not found' }, { status: 404 });
      }
      if (parent.book_id !== bookId) {
        return NextResponse.json({ error: 'Parent comment belongs to a different book' }, { status: 400 });
      }
    }

    // Insert comment
    const { data: comment, error } = await admin
      .from('book_comments')
      .insert({
        book_id: bookId,
        user_id: user.id,
        parent_id: parentId || null,
        content: content.trim(),
      })
      .select('*')
      .single();

    if (error) {
      console.error('[Comments POST Error]', error);
      return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
    }

    // Get commenter profile
    const { data: profile } = await admin
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', user.id)
      .single();

    return NextResponse.json({
      comment: {
        ...comment,
        user: profile ?? { full_name: null, avatar_url: null },
        replies: [],
      },
    });
  } catch (error) {
    console.error('[Comments POST Exception]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE /api/books/[bookId]/comments?commentId=xxx — delete a comment
export async function DELETE(
  req: Request,
  { params }: { params: { bookId: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const commentId = url.searchParams.get('commentId');
    if (!commentId) {
      return NextResponse.json({ error: 'commentId is required' }, { status: 400 });
    }

    const admin = createAdminClient();

    // Verify comment exists and belongs to this user
    const { data: comment, error: fetchErr } = await admin
      .from('book_comments')
      .select('id, user_id, book_id')
      .eq('id', commentId)
      .single();

    if (fetchErr || !comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }
    if (comment.user_id !== user.id) {
      return NextResponse.json({ error: 'You can only delete your own comments' }, { status: 403 });
    }
    if (comment.book_id !== params.bookId) {
      return NextResponse.json({ error: 'Comment does not belong to this book' }, { status: 400 });
    }

    // Delete (CASCADE will remove replies too)
    const { error: deleteErr } = await admin
      .from('book_comments')
      .delete()
      .eq('id', commentId);

    if (deleteErr) {
      console.error('[Comments DELETE Error]', deleteErr);
      return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Comments DELETE Exception]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
