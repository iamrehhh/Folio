import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import HighlightsClient from '@/components/highlights/HighlightsClient';
import type { Highlight, Book } from '@/types';

export default async function HighlightsPage() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

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
    <AppShell user={profile}>
      <HighlightsClient
        highlights={(highlights as Highlight[]) ?? []}
        books={uniqueBooks as Pick<Book, 'id' | 'title'>[]}
      />
    </AppShell>
  );
}
