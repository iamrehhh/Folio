import AppShell from '@/components/layout/AppShell';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Gamepad2, ArrowLeft, BookMarked, Lightbulb } from 'lucide-react';

export default async function GamifyModePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();

  return (
    <AppShell user={profile}>
      <div className="max-w-2xl mx-auto px-4 py-12 flex flex-col items-center">
        <div className="w-full mb-8">
          <Link href="/quiz" className="inline-flex items-center text-sm font-medium transition-colors hover:text-[var(--text-primary)]" style={{ color: 'var(--text-secondary)' }}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Quiz
          </Link>
        </div>

        <div className="w-20 h-20 rounded-3xl mb-8 flex items-center justify-center bg-gradient-to-br from-[#8B6914] to-[#6a4f0f] text-white shadow-xl">
          <Gamepad2 className="w-10 h-10" />
        </div>

        <h1 className="text-4xl font-bold mb-4 text-center" style={{ fontFamily: 'Lora, Georgia, serif', color: 'var(--text-primary)' }}>
          Choose Your Arena
        </h1>
        <p className="text-center text-lg mb-12 max-w-lg" style={{ color: 'var(--text-secondary)' }}>
          Will you master the art of precise phrasing or dominate the world of colorful expressions?
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
          <Link href="/quiz/gamify/vocab"
            className="group relative flex flex-col items-center text-center p-8 rounded-3xl border-2 border-[var(--border)] transition-all hover:border-[#8B6914] hover:shadow-xl hover:-translate-y-2 overflow-hidden"
            style={{ backgroundColor: 'var(--bg-card,#fff)' }}>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#8B6914]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 bg-[#8B6914]/10 transition-transform group-hover:scale-110">
              <BookMarked className="w-8 h-8" style={{ color: '#8B6914' }} />
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Lora, Georgia, serif', color: 'var(--text-primary)' }}>Vocabulary</h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Adaptive MCQ set of 5 words.</p>
          </Link>

          <Link href="/quiz/gamify/idiom"
            className="group relative flex flex-col items-center text-center p-8 rounded-3xl border-2 border-[var(--border)] transition-all hover:border-[#8B6914] hover:shadow-xl hover:-translate-y-2 overflow-hidden"
            style={{ backgroundColor: 'var(--bg-card,#fff)' }}>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#8B6914]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 bg-[#8B6914]/10 transition-transform group-hover:scale-110">
              <Lightbulb className="w-8 h-8" style={{ color: '#8B6914' }} />
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Lora, Georgia, serif', color: 'var(--text-primary)' }}>Idioms</h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Adaptive MCQ set of 5 idioms.</p>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
