import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getGreeting, firstName } from '@/lib/utils';
import AppShell from '@/components/layout/AppShell';
import CurrentlyReadingCard from '@/components/home/CurrentlyReadingCard';
import ReadingStatsPanel from '@/components/home/ReadingStatsPanel';
import RecentHighlights from '@/components/home/RecentHighlights';
import RecentVocab from '@/components/home/RecentVocab';
import DailyQuote from '@/components/home/DailyQuote';
import type { ReadingProgress, Highlight, VocabWord, ReadingStats } from '@/types';

export default async function HomePage() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Currently reading (most recently read book < 100%)
  const { data: currentlyReading } = await supabase
    .from('reading_progress')
    .select('*, book:books(*)')
    .eq('user_id', user.id)
    .lt('progress_percent', 100)
    .order('last_read_at', { ascending: false })
    .limit(1)
    .single();

  // Recent highlights
  const { data: recentHighlights } = await supabase
    .from('highlights')
    .select('*, book:books(title)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(3);

  // Recent vocab
  const { data: recentVocab } = await supabase
    .from('vocab_words')
    .select('*, book:books(title)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5);

  // Reading stats
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString();

  const { count: completedThisMonth } = await supabase
    .from('reading_progress')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('progress_percent', 100)
    .gte('last_read_at', startOfMonth);

  const { count: completedThisYear } = await supabase
    .from('reading_progress')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('progress_percent', 100)
    .gte('last_read_at', startOfYear);

  const { count: completedAllTime } = await supabase
    .from('reading_progress')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('progress_percent', 100);

  // Reading sessions for streak + avg
  const { data: sessions } = await supabase
    .from('reading_sessions')
    .select('started_at, duration_seconds')
    .eq('user_id', user.id)
    .order('started_at', { ascending: false })
    .limit(60);

  // Calculate streak
  let streakDays = 0;
  if (sessions && sessions.length > 0) {
    const readDates = new Set(
      sessions.map((s) => new Date(s.started_at).toDateString())
    );
    const today = new Date();
    let checkDate = today;
    while (readDates.has(checkDate.toDateString())) {
      streakDays++;
      checkDate = new Date(checkDate.getTime() - 86400000);
    }
  }

  const totalSessionSeconds = sessions?.reduce((sum, s) => sum + (s.duration_seconds ?? 0), 0) ?? 0;
  const avgSessionMinutes = sessions?.length
    ? Math.round(totalSessionSeconds / sessions.length / 60)
    : 0;

  const stats: ReadingStats = {
    booksCompletedThisMonth: completedThisMonth ?? 0,
    booksCompletedThisYear: completedThisYear ?? 0,
    booksCompletedAllTime: completedAllTime ?? 0,
    readingStreakDays: streakDays,
    avgSessionMinutes,
  };

  const greeting = getGreeting();
  const name = firstName(profile?.full_name ?? null);

  return (
    <AppShell user={profile}>
      <div className="max-w-5xl mx-auto px-8 py-10">
        {/* Greeting */}
        <div className="mb-8">
          <h1
            className="text-3xl font-medium"
            style={{ fontFamily: 'Lora, Georgia, serif', color: 'var(--text-primary)' }}
          >
            {greeting}, {name}
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <DailyQuote />

        {/* Main grid */}
        <div className="grid grid-cols-3 gap-6">
          {/* Left column (2/3 width) */}
          <div className="col-span-2 space-y-6">
            <CurrentlyReadingCard progress={currentlyReading as ReadingProgress | null} />
            <RecentHighlights highlights={(recentHighlights as Highlight[]) ?? []} />
          </div>

          {/* Right column (1/3 width) */}
          <div className="space-y-6">
            <ReadingStatsPanel stats={stats} />
            <RecentVocab words={(recentVocab as VocabWord[]) ?? []} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
