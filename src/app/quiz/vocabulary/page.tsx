import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import QuizClient from '@/components/quiz/QuizClient';

export default async function VocabularyQuizPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();

  return (
    <AppShell user={profile}>
      <QuizClient type="vocabulary" />
    </AppShell>
  );
}
