const fs = require('fs');

const files = [
  'src/middleware.ts',
  'src/app/api/admin/feedback/route.ts',
  'src/app/api/admin/books/route.ts',
  'src/app/api/admin/stats/route.ts',
  'src/app/api/admin/notifications/route.ts',
  'src/app/api/admin/notifications/[id]/route.ts',
  'src/app/api/admin/books/[bookId]/access/route.ts',
  'src/app/library/page.tsx',
  'src/app/admin/page.tsx',
  'src/components/layout/AppShell.tsx',
  'src/app/read/[bookId]/page.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf-8');
  
  // Replace the constant declaration
  content = content.replace(
    /const ADMIN_EMAIL = 'abdulrehanoffical@gmail\.com';/g, 
    "const ADMIN_EMAILS = ['abdulrehanoffical@gmail.com', 'jesanequebal649@gmail.com'];"
  );
  
  // Replace condition checks
  content = content.replace(
    /user\.email !== ADMIN_EMAIL/g,
    "!ADMIN_EMAILS.includes(user.email as string)"
  );
  
  content = content.replace(
    /user\.email === ADMIN_EMAIL/g,
    "ADMIN_EMAILS.includes(user.email as string)"
  );

  content = content.replace(
    /user\?\.email === 'abdulrehanoffical@gmail\.com'/g,
    "['abdulrehanoffical@gmail.com', 'jesanequebal649@gmail.com'].includes(user?.email as string)"
  );

  content = content.replace(
    /!user \|\| user\.email !== 'abdulrehanoffical@gmail\.com'/g,
    "!user || !['abdulrehanoffical@gmail.com', 'jesanequebal649@gmail.com'].includes(user.email as string)"
  );
  
  // AppShell edge case or any other unhandled 'abdulrehanoffical@gmail.com'
  content = content.replace(
    /user\?\.email !== 'abdulrehanoffical@gmail\.com'/g,
    "!['abdulrehanoffical@gmail.com', 'jesanequebal649@gmail.com'].includes(user?.email as string)"
  );
  
  fs.writeFileSync(file, content);
  console.log(`Updated ${file}`);
}
