import { createClient } from '@/lib/supabase/server';
import { getGreeting, firstName } from '@/lib/utils';
import { requireUser, getCachedProfile } from '@/lib/cache';
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
  const user = await requireUser();
  const profile = await getCachedProfile();
  const supabase = createClient();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOfYear  = new Date(now.getFullYear(), 0, 1).toISOString();

  const [
    { data: currentlyReading },
    { data: recentHighlights },
    { data: recentVocab },
    { count: completedThisMonth },
    { count: completedThisYear },
    { count: completedAllTime },
    { data: sessions }, // We use an RPC for this in the future, for now fallback to just not crashing the server
    { data: upcomingSchedule },
    { data: featuredFeedbacks }
  ] = await Promise.all([
    
    supabase.from('reading_progress').select('*, book:books(*)')
      .eq('user_id', user.id).lt('progress_percent', 100)
      .order('last_read_at', { ascending: false }).limit(1).maybeSingle(),
      
    supabase.from('highlights').select('*, book:books(title)')
      .eq('user_id', user.id).order('created_at', { ascending: false }).limit(3),
      
    supabase.from('vocab_words').select('*, book:books(title)')
      .eq('user_id', user.id).order('created_at', { ascending: false }).limit(3),
      
    supabase.from('reading_progress').select('*', { count: 'exact', head: true })
      .eq('user_id', user.id).eq('progress_percent', 100).gte('last_read_at', startOfMonth),
      
    supabase.from('reading_progress').select('*', { count: 'exact', head: true })
      .eq('user_id', user.id).eq('progress_percent', 100).gte('last_read_at', startOfYear),
      
    supabase.from('reading_progress').select('*', { count: 'exact', head: true })
      .eq('user_id', user.id).eq('progress_percent', 100),
      
    supabase.from('reading_sessions').select('duration_seconds, started_at').eq('user_id', user.id).order('started_at', { ascending: true }), // Removed limit to calculate exact total; OOM risk is negligible for standard users
      
    supabase.from('book_schedules').select('*, book:books(*)')
      .eq('user_id', user.id).gte('scheduled_for', new Date().toISOString().split('T')[0])
      .order('scheduled_for', { ascending: true }).limit(1).maybeSingle(),
      
    supabase.from('site_feedback').select('*, user:profiles(full_name, avatar_url)')
      .eq('show_on_homepage', true)
      .order('created_at', { ascending: false })
      .limit(10)
  ]);

  let trueSessionCount = 0;
  let totalSecs = 0;

  if (sessions && sessions.length > 0) {
    trueSessionCount = 1;
    let lastSessionEnd = new Date(sessions[0].started_at).getTime() + (sessions[0].duration_seconds ?? 0) * 1000;
    totalSecs += sessions[0].duration_seconds ?? 0;

    for (let i = 1; i < sessions.length; i++) {
      const s = sessions[i];
      const startMs = new Date(s.started_at).getTime();
      const durSecs = s.duration_seconds ?? 0;

      // New session if gap is > 30 minutes
      if (startMs - lastSessionEnd > 30 * 60 * 1000) {
        trueSessionCount++;
      }
      
      lastSessionEnd = Math.max(lastSessionEnd, startMs + durSecs * 1000);
      totalSecs += durSecs;
    }
  }

  const stats: ReadingStats = {
    booksCompletedThisMonth: completedThisMonth ?? 0,
    booksCompletedThisYear:  completedThisYear  ?? 0,
    booksCompletedAllTime:   completedAllTime   ?? 0,
    totalReadingTimeMinutes: Math.round(totalSecs / 60),
    avgSessionMinutes: trueSessionCount > 0 ? Math.max(1, Math.round(totalSecs / trueSessionCount / 60)) : 0,
  };

  const greeting = getGreeting();
  const name = firstName(profile?.full_name ?? null);

  return (
    <>
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
        <FeedbackPopup 
          hasCompletedBooks={(completedAllTime ?? 0) > 0} 
          forceFeedback={profile?.force_feedback_request ?? false} 
        />
      </div>
    </>
  );
}
