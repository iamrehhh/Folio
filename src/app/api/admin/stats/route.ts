import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

const ADMIN_EMAILS = ['abdulrehanoffical@gmail.com', 'jesanequebal649@gmail.com'];

async function fetchAll(admin: any, table: string, select: string, modifier?: (q: any) => any) {
  let allData: any[] = [];
  let from = 0;
  const step = 1000;
  while (true) {
    let q = admin.from(table).select(select).range(from, from + step - 1);
    if (modifier) q = modifier(q);
    const { data, error } = await q;
    if (error) throw error;
    if (!data || data.length === 0) break;
    allData = allData.concat(data);
    if (data.length < step) break;
    from += step;
  }
  return allData;
}

export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !ADMIN_EMAILS.includes(user.email as string)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const admin = createAdminClient();

    // 1. All users (profiles)
    const profiles = await fetchAll(admin, 'profiles', 'id, email, full_name, avatar_url, created_at, gamify_score, force_feedback_request', q => q.order('created_at', { ascending: false }));

    // 2. All books with uploader info
    const books = await fetchAll(admin, 'books', 'id, title, author, genre, uploaded_by, is_default, visibility, created_at, epub_path, cover_path', q => q.order('created_at', { ascending: false }));

    // 3. Reading progress stats
    const progressRows = await fetchAll(admin, 'reading_progress', 'user_id, progress_percent, last_read_at');

    // 4. Reading sessions for activity
    const sessions = await fetchAll(admin, 'reading_sessions', 'user_id, duration_seconds, started_at');

    // 5. Highlights count per user
    const highlights = await fetchAll(admin, 'highlights', 'user_id');

    // 6. Vocab count per user
    const vocabWords = await fetchAll(admin, 'vocab_words', 'user_id');

    // 7. Quiz attempts
    const quizAttempts = await fetchAll(admin, 'quiz_attempts', 'user_id, score, completed_at', q => q.not('completed_at', 'is', null));

    // 8. Quiz results (chapter quizzes)
    const quizResults = await fetchAll(admin, 'quiz_results', 'user_id, score, total_questions');

    // ── Aggregate per-user stats ──
    const userStats = (profiles ?? []).map(profile => {
      // Books uploaded by this user (excluding defaults)
      const userBooks = (books ?? []).filter(
        b => b.uploaded_by === profile.id && b.visibility === 'private'
      );

      // Reading progress
      const userProgress = (progressRows ?? []).filter(p => p.user_id === profile.id);
      const booksCompleted = userProgress.filter(p => p.progress_percent >= 100).length;
      const booksInProgress = userProgress.filter(p => p.progress_percent > 0 && p.progress_percent < 100).length;
      const lastRead = userProgress.reduce((latest, p) => {
        if (!latest) return p.last_read_at;
        return p.last_read_at > latest ? p.last_read_at : latest;
      }, null as string | null);

      // Sessions
      const userSessions = (sessions ?? []).filter(s => s.user_id === profile.id);
      const totalReadingSeconds = userSessions.reduce((sum, s) => sum + (s.duration_seconds ?? 0), 0);

      // Highlights
      const highlightCount = (highlights ?? []).filter(h => h.user_id === profile.id).length;

      // Vocab
      const vocabCount = (vocabWords ?? []).filter(v => v.user_id === profile.id).length;

      // Daily quiz attempts
      const userQuizAttempts = (quizAttempts ?? []).filter(q => q.user_id === profile.id);
      const avgQuizScore = userQuizAttempts.length
        ? Math.round(userQuizAttempts.reduce((sum, q) => sum + (q.score ?? 0), 0) / userQuizAttempts.length)
        : 0;

      // Chapter quiz results
      const userChapterQuizzes = (quizResults ?? []).filter(q => q.user_id === profile.id);
      const avgChapterScore = userChapterQuizzes.length
        ? Math.round(
            userChapterQuizzes.reduce((sum, q) => sum + (q.score / q.total_questions) * 100, 0) /
            userChapterQuizzes.length
          )
        : 0;

      return {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        joined_at: profile.created_at,
        gamify_score: profile.gamify_score,
        books_uploaded: userBooks.length,
        uploaded_book_titles: userBooks.map(b => ({ id: b.id, title: b.title, author: b.author, genre: b.genre, created_at: b.created_at })),
        books_completed: booksCompleted,
        books_in_progress: booksInProgress,
        last_read_at: lastRead,
        total_reading_minutes: Math.round(totalReadingSeconds / 60),
        highlight_count: highlightCount,
        vocab_count: vocabCount,
        daily_quizzes_completed: userQuizAttempts.length,
        avg_daily_quiz_score: avgQuizScore,
        chapter_quizzes_taken: userChapterQuizzes.length,
        avg_chapter_quiz_score: avgChapterScore,
        force_feedback_request: profile.force_feedback_request || false,
      };
    });

    // ── Site-wide aggregates ──
    const totalUsers = profiles?.length ?? 0;
    const usersWhoUploaded = userStats.filter(u => u.books_uploaded > 0).length;
    const totalUserBooks = (books ?? []).filter(b => b.visibility === 'private').length;
    const totalDefaultBooks = (books ?? []).filter(b => b.visibility === 'public').length;
    const totalAssignedBooks = (books ?? []).filter(b => b.visibility === 'assigned').length;
    const totalHighlights = highlights?.length ?? 0;
    const totalVocab = vocabWords?.length ?? 0;
    const totalQuizAttempts = quizAttempts?.length ?? 0;
    const totalReadingSecondsGlobal = (sessions ?? []).reduce((sum, s) => sum + (s.duration_seconds ?? 0), 0);
    const totalReadingMinutesGlobal = Math.round(totalReadingSecondsGlobal / 60);

    return NextResponse.json({
      overview: {
        total_users: totalUsers,
        users_who_uploaded: usersWhoUploaded,
        total_user_books: totalUserBooks,
        total_default_books: totalDefaultBooks,
        total_highlights: totalHighlights,
        total_vocab_saved: totalVocab,
        total_quiz_attempts: totalQuizAttempts,
        total_reading_minutes: totalReadingMinutesGlobal,
      },
      users: userStats,
    });
  } catch (err: any) {
    console.error('[Admin Stats Error]', err);
    return NextResponse.json({ error: err.message ?? 'Internal error' }, { status: 500 });
  }
}
