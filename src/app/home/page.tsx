import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getGreeting, firstName } from '@/lib/utils';
import AppShell from '@/components/layout/AppShell';
import CurrentlyReadingCard from '@/components/home/CurrentlyReadingCard';
import ReadingStatsPanel from '@/components/home/ReadingStatsPanel';
import RecentHighlights from '@/components/home/RecentHighlights';
import RecentVocab from '@/components/home/RecentVocab';
import DailyQuote from '@/components/home/DailyQuote';
import UpcomingBookBanner from '@/components/home/UpcomingBookBanner';
import LiveNotification from '@/components/home/LiveNotification';
import FeedbackPopup from '@/components/home/FeedbackPopup';
import FeaturedFeedback from '@/components/home/FeaturedFeedback';
import type { ReadingProgress, Highlight, VocabWord, ReadingStats, BookSchedule, Book } from '@/types';

export default async function HomePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOfYear  = new Date(now.getFullYear(), 0, 1).toISOString();

  const [
    { data: profile },
    { data: currentlyReading },
    { data: recentHighlights },
    { data: recentVocab },
    { count: completedThisMonth },
    { count: completedThisYear },
    { count: completedAllTime },
    { data: sessions },
    { data: upcomingSchedule },
    { data: featuredFeedbacks }
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    
    supabase.from('reading_progress').select('*, book:books(*)')
      .eq('user_id', user.id).lt('progress_percent', 100)
      .order('last_read_at', { ascending: false }).limit(1).maybeSingle(),
      
    supabase.from('highlights').select('*, book:books(title)')
      .eq('user_id', user.id).order('created_at', { ascending: false }).limit(3),
      
    supabase.from('vocab_words').select('*, book:books(title)')
      .eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
      
    supabase.from('reading_progress').select('*', { count: 'exact', head: true })
      .eq('user_id', user.id).eq('progress_percent', 100).gte('last_read_at', startOfMonth),
      
    supabase.from('reading_progress').select('*', { count: 'exact', head: true })
      .eq('user_id', user.id).eq('progress_percent', 100).gte('last_read_at', startOfYear),
      
    supabase.from('reading_progress').select('*', { count: 'exact', head: true })
      .eq('user_id', user.id).eq('progress_percent', 100),
      
    supabase.from('reading_sessions').select('started_at, duration_seconds')
      .eq('user_id', user.id).order('started_at', { ascending: false }).limit(60),
      
    supabase.from('book_schedules').select('*, book:books(*)')
      .eq('user_id', user.id).gte('scheduled_for', new Date().toISOString().split('T')[0])
      .order('scheduled_for', { ascending: true }).limit(1).maybeSingle(),
      
    supabase.from('site_feedback').select('*, user:profiles(full_name, avatar_url)')
      .eq('show_on_homepage', true)
      .order('created_at', { ascending: false })
      .limit(10)
  ]);

  let streakDays = 0;
  if (sessions?.length) {
    const readDates = new Set(sessions.map(s => new Date(s.started_at).toDateString()));
    let checkDate = new Date();
    while (readDates.has(checkDate.toDateString())) {
      streakDays++;
      checkDate = new Date(checkDate.getTime() - 86400000);
    }
  }

  const totalSecs = sessions?.reduce((s, r) => s + (r.duration_seconds ?? 0), 0) ?? 0;
  const stats: ReadingStats = {
    booksCompletedThisMonth: completedThisMonth ?? 0,
    booksCompletedThisYear:  completedThisYear  ?? 0,
    booksCompletedAllTime:   completedAllTime   ?? 0,
    readingStreakDays: streakDays,
    avgSessionMinutes: sessions?.length ? Math.round(totalSecs / sessions.length / 60) : 0,
  };

  const greeting = getGreeting();
  const name = firstName(profile?.full_name ?? null);

  return (
    <AppShell user={profile}>
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-10">
        {/* Greeting */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-medium"
            style={{ fontFamily: 'Lora, Georgia, serif', color: 'var(--text-primary)' }}>
            {greeting}, {name}
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <DailyQuote />
        
        <UpcomingBookBanner schedule={upcomingSchedule as (BookSchedule & { book: Book }) | null} />

        {/* Main grid — stacks on mobile */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {/* Left column */}
          <div className="md:col-span-2 space-y-4 md:space-y-6">
            <CurrentlyReadingCard progress={currentlyReading as ReadingProgress | null} />
            <RecentHighlights highlights={(recentHighlights as Highlight[]) ?? []} />
          </div>
          {/* Right column */}
          <div className="space-y-4 md:space-y-6">
            <ReadingStatsPanel stats={stats} />
            <RecentVocab words={(recentVocab as VocabWord[]) ?? []} />
          </div>
        </div>

        {/* Featured Feedback Carousel */}
        {featuredFeedbacks && featuredFeedbacks.length > 0 && (
          <FeaturedFeedback feedbacks={featuredFeedbacks as any} />
        )}

        <LiveNotification />
        <FeedbackPopup hasCompletedBooks={(completedAllTime ?? 0) > 0} />
      </div>
    </AppShell>
  );
}
