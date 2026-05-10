const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const sql = fs.readFileSync('./supabase/migrations/20260510103823_add_reading_stats_rpc.sql', 'utf8');
  const { data, error } = await supabase.rpc('run_sql', { sql });
  if (error) console.error('Error applying RPC:', error);
  else console.log('Successfully applied RPC:', data);
}
run();
