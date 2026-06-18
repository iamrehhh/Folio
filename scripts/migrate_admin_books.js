/**
 * Migration Script: Transfer existing admin-uploaded books
 * 
 * This script:
 * 1. Looks up the user ID for abdulrehanoffical@gmail.com
 * 2. Sets uploaded_via = 'admin' for all books uploaded by that user
 * 3. Removes those books from the user_library table for that user
 * 4. Ensures all those books remain visible in public library
 * 
 * Usage: node scripts/migrate_admin_books.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const ADMIN_EMAIL = 'abdulrehanoffical@gmail.com';

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('🔍 Looking up admin user...');

  // 1. Find the admin user
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('email', ADMIN_EMAIL)
    .single();

  if (profileError || !profile) {
    console.error('❌ Could not find admin user:', profileError?.message);
    process.exit(1);
  }

  console.log(`✅ Found admin: ${profile.email} (${profile.id})`);

  // 2. Get all books uploaded by this admin
  const { data: adminBooks, error: booksError } = await supabase
    .from('books')
    .select('id, title, visibility, uploaded_via')
    .eq('uploaded_by', profile.id);

  if (booksError) {
    console.error('❌ Error fetching books:', booksError.message);
    process.exit(1);
  }

  console.log(`📚 Found ${adminBooks.length} books uploaded by admin`);

  if (adminBooks.length === 0) {
    console.log('✅ No books to migrate. Done.');
    process.exit(0);
  }

  const bookIds = adminBooks.map(b => b.id);

  // 3. Set uploaded_via = 'admin' for all these books
  const { error: updateError } = await supabase
    .from('books')
    .update({ uploaded_via: 'admin' })
    .in('id', bookIds);

  if (updateError) {
    console.error('❌ Error updating uploaded_via:', updateError.message);
    process.exit(1);
  }

  console.log(`✅ Set uploaded_via = 'admin' for ${bookIds.length} books`);

  // 4. Remove these books from user_library for this admin
  const { data: removedEntries, error: removeError } = await supabase
    .from('user_library')
    .delete()
    .eq('user_id', profile.id)
    .in('book_id', bookIds)
    .select('book_id');

  if (removeError) {
    console.error('❌ Error removing from user_library:', removeError.message);
    process.exit(1);
  }

  console.log(`✅ Removed ${(removedEntries || []).length} entries from user_library`);

  // 5. Log summary
  console.log('\n── Migration Summary ──');
  console.log(`Admin user: ${ADMIN_EMAIL}`);
  console.log(`Books migrated: ${bookIds.length}`);
  console.log(`Personal library entries removed: ${(removedEntries || []).length}`);
  console.log('');
  adminBooks.forEach(b => {
    console.log(`  📖 "${b.title}" — visibility: ${b.visibility}`);
  });
  console.log('\n✅ Migration complete!');
}

main().catch(err => {
  console.error('❌ Unhandled error:', err);
  process.exit(1);
});
