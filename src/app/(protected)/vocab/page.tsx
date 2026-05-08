import { requireUser } from '@/lib/cache';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import VocabClient from '@/components/vocab/VocabClient';
import type { VocabWord, Book } from '@/types';

export default async function VocabPage() {
  const supabase = createClient();

  const user = await requireUser();

  
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
    <>
      <VocabClient
        words={(words as VocabWord[]) ?? []}
        books={uniqueBooks as Pick<Book, 'id' | 'title'>[]}
        userId={user.id}
      />
    </>
  );
}
