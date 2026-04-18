import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: sets } = await supabase.from('daily_quiz_sets').select('id, type, date');
  console.log('sets:', sets);
  const { data: attempts } = await supabase.from('quiz_attempts').select('quiz_set_id, user_id, answers');
  console.log('attempts:', attempts);
}
check();
