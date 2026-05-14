const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'public' } }
);

async function run() {
  // Test if column already exists by trying to query it
  const { data, error } = await supabase
    .from('bug_reports')
    .select('id, has_unread_user_message')
    .limit(1);
  
  if (error) {
    if (error.message.includes('has_unread_user_message')) {
      console.log('❌ Column does not exist yet. You need to run this SQL in Supabase Dashboard SQL editor:');
      console.log('');
      console.log('ALTER TABLE public.bug_reports');
      console.log('ADD COLUMN IF NOT EXISTS has_unread_user_message BOOLEAN DEFAULT false NOT NULL;');
      console.log('');
      console.log('CREATE INDEX IF NOT EXISTS idx_bug_reports_admin_unread');
      console.log('ON public.bug_reports(has_unread_user_message)');
      console.log('WHERE has_unread_user_message = true;');
    } else {
      console.error('Error:', error);
    }
  } else {
    console.log('✅ Column has_unread_user_message already exists!');
    console.log('Sample data:', data);
  }
}
run();
