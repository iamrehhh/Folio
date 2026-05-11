import { requireUser } from '@/lib/cache';
import { createClient } from '@/lib/supabase/server';
import VaultClient from '@/components/vault/VaultClient';
import type { VaultEntry } from '@/types';

export const metadata = {
  title: 'Personal Vault | Folio',
};

export default async function VaultPage() {
  const user = await requireUser();
  const supabase = createClient();

  const { data: entries } = await supabase
    .from('vault_entries')
    .select('*')
    .eq('user_id', user.id)
    .order('is_pinned', { ascending: false })
    .order('updated_at', { ascending: false });

  return (
    <VaultClient
      initialEntries={(entries as VaultEntry[]) ?? []}
    />
  );
}
