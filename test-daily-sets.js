import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const today = new Date().toISOString().split('T')[0];
  console.log('Today is:', today);
  const { data, error } = await supabase
    .from('daily_quiz_sets')
    .select('id, type, date')
    .eq('date', today);
  
  if (error) console.error(error);
  else console.log('Sets for today:', data);
}

main();
