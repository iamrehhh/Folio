import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import Link from 'next/link';
import { BookMarked, Lightbulb, Gamepad2, Trophy } from 'lucide-react';

export default async function QuizPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();

  // Use admin client for leaderboard to bypass RLS (profiles RLS restricts SELECT to own row only)
  const adminSupabase = createAdminClient();
  const { data: leaderboard } = await adminSupabase
    .from('profiles')
    .select('id, full_name, gamify_score')
    .gt('gamify_score', 0)
    .order('gamify_score', { ascending: false })
    .limit(5);

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <AppShell user={profile}>
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-2"
            style={{ fontFamily: 'Lora, Georgia, serif', color: 'var(--text-primary)' }}>
            Daily Quiz
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{today}</p>
          <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
            One vocabulary set and one idioms set per day.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Link href="/quiz/vocabulary"
            className="group rounded-2xl border p-6 transition-all hover:shadow-soft-lg hover:-translate-y-0.5"
            style={{ backgroundColor: 'var(--bg-card,#fff)', borderColor: 'var(--border)' }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors"
              style={{ backgroundColor: '#8B691415' }}>
              <BookMarked className="w-6 h-6" style={{ color: '#8B6914' }} />
            </div>
            <h2 className="text-lg font-semibold mb-1"
              style={{ fontFamily: 'Lora, Georgia, serif', color: 'var(--text-primary)' }}>
              Vocabulary
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              5 advanced words — definitions, examples, synonyms, fill-in-the-blank quiz, and a reading passage.
            </p>
            <div className="mt-4 text-xs font-semibold" style={{ color: '#8B6914' }}>
              Start today's set →
            </div>
          </Link>

          <Link href="/quiz/idioms"
            className="group rounded-2xl border p-6 transition-all hover:shadow-soft-lg hover:-translate-y-0.5"
            style={{ backgroundColor: 'var(--bg-card,#fff)', borderColor: 'var(--border)' }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
              style={{ backgroundColor: '#8B691415' }}>
              <Lightbulb className="w-6 h-6" style={{ color: '#8B6914' }} />
            </div>
            <h2 className="text-lg font-semibold mb-1"
              style={{ fontFamily: 'Lora, Georgia, serif', color: 'var(--text-primary)' }}>
              Idioms
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              5 essential idioms — meanings, usage examples, similar expressions, quiz, and a reading passage.
            </p>
            <div className="mt-4 text-xs font-semibold" style={{ color: '#8B6914' }}>
              Start today's set →
            </div>
          </Link>
        </div>

        {/* Gamify Section */}
        <div className="mt-12 flex flex-col md:flex-row gap-6">
          {/* Main Gamify Card */}
          <div className="flex-1">
            <Link href="/quiz/gamify"
              className="group block rounded-2xl border p-8 transition-all hover:shadow-soft-xl hover:-translate-y-1 relative overflow-hidden h-full"
              style={{ backgroundColor: 'var(--bg-card,#fff)', borderColor: 'var(--border)' }}>
              
              {/* Vibrant Background Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#8B6914]/5 to-[#8B6914]/20 opacity-50 transition-opacity group-hover:opacity-100" />

              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl mb-6 flex items-center justify-center bg-gradient-to-br from-[#8B6914] to-[#6a4f0f] text-white shadow-md">
                  <Gamepad2 className="w-7 h-7" />
                </div>
                <h2 className="text-2xl font-bold mb-3"
                  style={{ fontFamily: 'Lora, Georgia, serif', color: 'var(--text-primary)' }}>
                  Let's Gamify
                </h2>
                <p className="text-base" style={{ color: 'var(--text-secondary)' }}>
                  Test your knowledge in our curated arena. Climb the leaderboard, master new vocabulary and idioms, and track your true understanding of the English language.
                </p>
                <div className="mt-6 inline-flex items-center gap-2 font-bold px-5 py-2.5 rounded-xl bg-[#8B6914] text-white transition-transform group-hover:scale-105">
                  Play Game Mode →
                </div>
              </div>
            </Link>
          </div>

          {/* Leaderboard */}
          <div className="w-full md:w-72 rounded-2xl border p-6 flex flex-col"
            style={{ backgroundColor: 'var(--bg-card,#fff)', borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-2 mb-5">
              <Trophy className="w-5 h-5" style={{ color: '#8B6914' }} />
              <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Top 5 Leaders</h3>
            </div>
            
            <div className="flex flex-col gap-3 flex-1">
              {leaderboard && leaderboard.length > 0 ? (
                leaderboard.map((user, idx) => (
                  <div key={user.id} className="flex justify-between items-center bg-[var(--bg-primary)] p-3 rounded-lg border border-[var(--border)]">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-bold opacity-50">#{idx + 1}</span>
                      <span className="font-medium text-sm truncate w-24">
                        {user.full_name || 'Anonymous'}
                      </span>
                    </div>
                    <span className="text-sm font-bold font-mono" style={{ color: '#8B6914' }}>
                      {user.gamify_score || 0}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-sm opacity-60 text-center py-4">No scores yet. Support the play!</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
