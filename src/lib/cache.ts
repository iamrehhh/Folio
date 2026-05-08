import { createClient } from '@/lib/supabase/server';
import { cache } from 'react';
import { redirect } from 'next/navigation';

// Memoize the user fetching for a single request lifecycle
export const getCachedUser = cache(async () => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
});

// Require user, redirects to login if none
export const requireUser = cache(async () => {
  const user = await getCachedUser();
  if (!user) redirect('/login');
  return user;
});

// Memoize the profile fetching for a single request lifecycle
export const getCachedProfile = cache(async () => {
  const user = await getCachedUser();
  if (!user) return null;
  const supabase = createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  return profile;
});
