// One-time script to clear all reading_sessions data
// Usage: node scripts/reset-reading-sessions.mjs

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

async function main() {
  // Count existing sessions first
  const { count } = await supabase
    .from('reading_sessions')
    .select('*', { count: 'exact', head: true });

  console.log(`Found ${count} reading session records. Deleting all...`);

  // Delete all rows (neq filter on id to match everything)
  const { error } = await supabase
    .from('reading_sessions')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (error) {
    console.error('Error deleting sessions:', error.message);
    process.exit(1);
  }

  console.log(`✅ Successfully deleted all ${count} reading session records.`);
  console.log('Reading time will now start fresh for all users.');
}

main();
