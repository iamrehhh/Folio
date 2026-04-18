import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import VocabClient from '@/components/vocab/VocabClient';
import type { VocabWord, Book } from '@/types';

export default async function VocabPage() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const { data: words } = await supabase
    .from('vocab_words')
    .select('*, book:books(id, title)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // Derive unique books from already-fetched words (no extra query needed)
  const uniqueBooks = Array.from(
    new Map(
      (words ?? [])
        .map((w: any) => w.book as { id: string; title: string } | null)
        .filter(Boolean)
        .map((b) => [b!.id, b!])
    ).values()
  );

  return (
    <AppShell user={profile}>
      <VocabClient
        words={(words as VocabWord[]) ?? []}
        books={uniqueBooks as Pick<Book, 'id' | 'title'>[]}
        userId={user.id}
      />
    </AppShell>
  );
}
