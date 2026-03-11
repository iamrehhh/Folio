'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import {
  Home, BookOpen, Highlighter, BookMarked, LogOut, User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Profile } from '@/types';

interface AppShellProps {
  children: React.ReactNode;
  user: Profile | null;
}

const NAV_ITEMS = [
  { href: '/home',       label: 'Home',       icon: Home },
  { href: '/library',   label: 'Library',    icon: BookOpen },
  { href: '/highlights',label: 'Highlights', icon: Highlighter },
  { href: '/vocab',     label: 'Vocabulary', icon: BookMarked },
];

export default function AppShell({ children, user }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg, #FAF8F4)' }}>
      {/* Top navigation bar */}
      <header
        className="sticky top-0 z-40 border-b"
        style={{
          backgroundColor: 'var(--bg-sidebar, #F2EFE9)',
          borderColor: 'var(--border, #E5E0D8)',
        }}
      >
        <div className="w-full px-8 h-14 flex items-center relative">
          {/* Logo (Left aligned, flex-1 to push center) */}
          <div className="flex-1 flex justify-start">
            <Link
              href="/home"
              className="flex items-center gap-2.5 text-xl font-semibold tracking-tight"
              style={{ color: '#1C1C1E', fontFamily: 'Lora, Georgia, serif' }}
            >
              <div 
                className="inline-flex items-center justify-center w-8 h-8 rounded-[10px]"
                style={{ backgroundColor: '#8B6914' }}
              >
                <BookOpen className="w-[18px] h-[18px] text-white" strokeWidth={2.5} />
              </div>
              Folio
            </Link>
          </div>

          {/* Nav links (Perfectly centered) */}
          <nav className="flex items-center gap-1 shrink-0">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors',
                    active
                      ? 'bg-accent text-white'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border)]'
                  )}
                  style={active ? { backgroundColor: '#8B6914', color: '#fff' } : {}}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* User menu (Right aligned, flex-1 to pull from center) */}
          <div className="flex-1 flex items-center justify-end gap-2">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.full_name ?? 'User'}
                className="w-7 h-7 rounded-full object-cover"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-[#E5E0D8] flex items-center justify-center">
                <User className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
              </div>
            )}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1 px-2 py-1.5 rounded text-sm transition-colors hover:bg-[var(--border)]"
              style={{ color: 'var(--text-secondary)' }}
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1">{children}</main>
    </div>
  );
}
