const fs = require('fs');
const path = require('path');

const protectedDir = path.join(__dirname, '../src/app/(protected)');

function findPageFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      findPageFiles(filePath, fileList);
    } else if (file === 'page.tsx') {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const pages = findPageFiles(protectedDir);

for (const page of pages) {
  if (page.includes('/home/') || page.includes('/library/')) {
    continue; // Already refactored
  }

  let content = fs.readFileSync(page, 'utf8');

  // Skip if it doesn't import AppShell
  if (!content.includes('AppShell')) continue;

  // Add requireUser import
  if (!content.includes("from '@/lib/cache'")) {
    content = content.replace(
      "import { createClient",
      "import { requireUser } from '@/lib/cache';\nimport { createClient"
    );
  }

  // Remove AppShell import
  content = content.replace(/import AppShell from '@\/components\/layout\/AppShell';\n?/g, '');
  content = content.replace(/import AppShell from '.*AppShell';\n?/g, '');

  // Replace getUser and redirect with requireUser
  content = content.replace(
    /const {\s*data:\s*{\s*user\s*}\s*}\s*=\s*await supabase\.auth\.getUser\(\);\n\s*if \(\!user\) redirect\('\/login'\);/g,
    "const user = await requireUser();"
  );

  // Remove profile fetching
  content = content.replace(
    /const {\s*data:\s*profile\s*}\s*=\s*await supabase\s*\n\s*\.from\('profiles'\)\s*\n\s*\.select\('\*'\)\s*\n\s*\.eq\('id',\s*user\.id\)\s*\n\s*\.single\(\);\n?/g,
    ''
  );
  content = content.replace(
    /const {\s*data:\s*profile\s*}\s*=\s*await supabase\.from\('profiles'\)\.select\('\*'\)\.eq\('id',\s*user\.id\)\.single\(\);\n?/g,
    ''
  );

  // Remove AppShell JSX tags
  content = content.replace(/<AppShell[^>]*>/g, '<>');
  content = content.replace(/<\/AppShell>/g, '</>');

  fs.writeFileSync(page, content, 'utf8');
  console.log(`Refactored ${page}`);
}
