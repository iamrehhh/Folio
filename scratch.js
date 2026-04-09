import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
  const { data: users } = await admin.from('profiles').select('*').limit(2);
  const { data: books } = await admin.from('books').select('*').limit(1);
  if (users.length === 0 || books.length === 0) {
    console.log("No data");
    return;
  }
  
  const bookId = books[0].id;
  const userId = users[0].id;
  
  console.log('Inserting into book_access: book_id=', bookId, ' user_id=', userId);
  
  const { data, error } = await admin.from('book_access').insert([{
    book_id: bookId,
    user_id: userId,
    granted_by: userId
  }]);
  
  console.log('Error:', error);
  console.log('Data:', data);
}

test();
