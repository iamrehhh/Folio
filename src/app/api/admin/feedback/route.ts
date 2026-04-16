import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

const ADMIN_EMAILS = ['abdulrehanoffical@gmail.com', 'jesanequebal649@gmail.com'];

export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !ADMIN_EMAILS.includes(user.email as string)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const admin = createAdminClient();

    // Fetch all site feedback
    const { data: feedbacks, error: fbError } = await admin
      .from('site_feedback')
      .select('*')
      .order('created_at', { ascending: false });

    if (fbError) throw fbError;

    // Fetch profiles for the users who left feedback
    const userIds = (feedbacks ?? []).map(f => f.user_id);
    let profileMap: Record<string, { full_name: string | null; email: string; avatar_url: string | null }> = {};

    if (userIds.length > 0) {
      const { data: profiles } = await admin
        .from('profiles')
        .select('id, full_name, email, avatar_url')
        .in('id', userIds);

      (profiles ?? []).forEach(p => {
        profileMap[p.id] = { full_name: p.full_name, email: p.email, avatar_url: p.avatar_url };
      });
    }

    // Enrich feedbacks with user info
    const enriched = (feedbacks ?? []).map(f => ({
      ...f,
      user: profileMap[f.user_id] || { full_name: null, email: 'Unknown', avatar_url: null },
    }));

    // Compute stats
    const total = enriched.length;
    const avgRating = total > 0
      ? Math.round((enriched.reduce((sum, f) => sum + f.rating, 0) / total) * 10) / 10
      : 0;

    // Rating distribution
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    enriched.forEach(f => {
      distribution[f.rating] = (distribution[f.rating] || 0) + 1;
    });

    return NextResponse.json({
      feedbacks: enriched,
      stats: {
        total_feedbacks: total,
        average_rating: avgRating,
        distribution,
      },
    });
  } catch (err: any) {
    console.error('[Admin Feedback Error]', err);
    return NextResponse.json({ error: err.message ?? 'Internal error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !ADMIN_EMAILS.includes(user.email as string)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id, show_on_homepage } = await req.json();

    if (!id || typeof show_on_homepage !== 'boolean') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { error } = await admin
      .from('site_feedback')
      .update({ show_on_homepage })
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[Admin Feedback PATCH Error]', err);
    return NextResponse.json({ error: err.message ?? 'Internal error' }, { status: 500 });
  }
}
