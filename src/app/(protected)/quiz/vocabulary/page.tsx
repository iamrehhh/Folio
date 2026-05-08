import { requireUser } from '@/lib/cache';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import QuizClient from '@/components/quiz/QuizClient';

export default async function VocabularyQuizPage() {
  const supabase = createClient();
  const user = await requireUser();
  
  return (
    <>
      <QuizClient type="vocabulary" />
    </>
  );
}
