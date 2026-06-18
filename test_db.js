const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function test() {
  const { data } = await supabase.from('books').select('title, uploaded_via').eq('uploaded_by', 'f01fcda8-e949-44fb-85fa-5b69f0e7bbc1').neq('uploaded_via', 'admin');
  console.log('Books NOT admin:', data);
}
test();
