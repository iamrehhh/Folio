'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  Home, BookOpen, Highlighter, BookMarked, LogOut, User, HelpCircle, Menu, X, GraduationCap, Shield, AlertCircle
} from 'lucide-react';
import GuideModal from './GuideModal';
import { cn } from '@/lib/utils';
import type { Profile } from '@/types';

interface AppShellProps {
  children: React.ReactNode;
  user: Profile | null;
}

const ADMIN_EMAILS = ['abdulrehanoffical@gmail.com', 'jesanequebal649@gmail.com'];

const NAV_ITEMS = [
  { href: '/home',       label: 'Home',       icon: Home },
  { href: '/library',   label: 'Library',    icon: BookOpen },
  { href: '/highlights',label: 'Highlights', icon: Highlighter },
  { href: '/vocab',     label: 'Vocabulary', icon: BookMarked },
  { href: '/quiz',      label: 'Quiz',       icon: GraduationCap },
  { href: '/report',    label: 'Report Error', icon: AlertCircle },
];

export default function AppShell({ children, user }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [showGuide, setShowGuide] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAdmin = ADMIN_EMAILS.includes(user?.email as string);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg, #FAF8F4)' }}>
      {/* Top navigation bar */}
      <header
        className="sticky top-0 z-40 border-b"
        style={{ backgroundColor: 'var(--bg-sidebar, #F2EFE9)', borderColor: 'var(--border, #E5E0D8)' }}
      >
        <div className="w-full px-4 md:px-8 h-14 flex items-center relative">
          {/* Logo */}
          <div className="flex-1 flex justify-start">
            <Link
              href="/home"
              className="flex items-center gap-2 text-xl font-semibold tracking-tight"
              style={{ color: '#1C1C1E', fontFamily: 'Lora, Georgia, serif' }}
            >
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-[10px]"
                style={{ backgroundColor: '#8B6914' }}>
                <BookOpen className="w-[18px] h-[18px] text-white" strokeWidth={2.5} />
              </div>
              Folio
            </Link>
          </div>

          {/* Desktop nav — hidden on mobile */}
          <nav className="hidden md:flex items-center gap-1 shrink-0">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link key={href} href={href}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors',
                    active ? 'text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border)]'
                  )}
                  style={active ? { backgroundColor: '#8B6914', color: '#fff' } : {}}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </Link>
              );
            })}

            {/* Admin link — only for admin email */}
            {isAdmin && (
              <Link
                href="/admin"
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors',
                  pathname === '/admin' ? 'text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border)]'
                )}
                style={pathname === '/admin' ? { backgroundColor: '#8B6914', color: '#fff' } : {}}
              >
                <Shield className="w-3.5 h-3.5" />
                Admin
              </Link>
            )}
          </nav>

          {/* Right side */}
          <div className="flex-1 flex items-center justify-end gap-2">
            {/* Help — desktop only */}
            <button onClick={() => setShowGuide(true)}
              className="hidden md:flex items-center justify-center p-1.5 rounded-full transition-colors hover:bg-[var(--border)]"
              style={{ color: 'var(--text-secondary)' }} title="Guide">
              <HelpCircle className="w-5 h-5" />
            </button>

            {/* Avatar */}
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt={user.full_name ?? 'User'}
                className="w-7 h-7 rounded-full object-cover" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-[#E5E0D8] flex items-center justify-center">
                <User className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
              </div>
            )}

            {/* Sign out — desktop only */}
            <button onClick={handleSignOut}
              className="hidden md:flex items-center gap-1 px-2 py-1.5 rounded text-sm transition-colors hover:bg-[var(--border)]"
              style={{ color: 'var(--text-secondary)' }} title="Sign out">
              <LogOut className="w-3.5 h-3.5" />
            </button>

            {/* Hamburger — mobile only */}
            <button onClick={() => setMobileMenuOpen(o => !o)}
              className="md:hidden p-1.5 rounded transition-colors hover:bg-[var(--border)]"
              style={{ color: 'var(--text-secondary)' }}>
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t px-4 py-3 space-y-1"
            style={{ backgroundColor: 'var(--bg-sidebar)', borderColor: 'var(--border)' }}>
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link key={href} href={href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    active ? 'text-white' : 'hover:bg-[var(--border)]'
                  )}
                  style={active ? { backgroundColor: '#8B6914' } : { color: 'var(--text-primary)' }}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              );
            })}

            {/* Admin link mobile */}
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  pathname === '/admin' ? 'text-white' : 'hover:bg-[var(--border)]'
                )}
                style={pathname === '/admin' ? { backgroundColor: '#8B6914' } : { color: 'var(--text-primary)' }}
              >
                <Shield className="w-4 h-4" />
                Admin
              </Link>
            )}

            <div className="pt-2 border-t flex items-center justify-between"
              style={{ borderColor: 'var(--border)' }}>
              <button onClick={() => { setShowGuide(true); setMobileMenuOpen(false); }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-[var(--border)]"
                style={{ color: 'var(--text-secondary)' }}>
                <HelpCircle className="w-4 h-4" /> Guide
              </button>
              <button onClick={handleSignOut}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-[var(--border)]"
                style={{ color: 'var(--text-secondary)' }}>
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      {showGuide && <GuideModal onClose={() => setShowGuide(false)} />}
    </div>
  );
}
