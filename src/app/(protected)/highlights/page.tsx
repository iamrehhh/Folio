import { requireUser } from '@/lib/cache';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import HighlightsClient from '@/components/highlights/HighlightsClient';
import type { Highlight, Book } from '@/types';

export default async function HighlightsPage() {
  const supabase = createClient();

  const user = await requireUser();

  
  const { data: highlights } = await supabase
    .from('highlights')
    .select('*, book:books(id, title)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // Derive unique books from already-fetched highlights (no extra query needed)
  const uniqueBooks = Array.from(
    new Map(
      (highlights ?? [])
        .map((h: any) => h.book as { id: string; title: string } | null)
        .filter(Boolean)
        .map((b) => [b!.id, b!])
    ).values()
  );

  return (
    <>
      <HighlightsClient
        highlights={(highlights as Highlight[]) ?? []}
        books={uniqueBooks as Pick<Book, 'id' | 'title'>[]}
      />
    </>
  );
}
