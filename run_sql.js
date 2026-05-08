const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase.rpc('run_sql', { sql: "SELECT policyname, cmd FROM pg_policies WHERE tablename = 'site_feedback';" });
  if (error) console.error(error);
  console.log(data);
}
run();
