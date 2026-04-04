import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import Link from 'next/link';
import { BookMarked, Lightbulb } from 'lucide-react';

export default async function QuizPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();

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
      </div>
    </AppShell>
  );
}
