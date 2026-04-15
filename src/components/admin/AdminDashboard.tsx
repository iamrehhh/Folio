'use client';

import { useState, useEffect } from 'react';
import {
  Users, BookOpen, Highlighter, BookMarked, Trophy,
  Activity, ChevronDown, ChevronUp, Loader2, AlertCircle,
  Upload, Clock, BarChart2, Shield, Library
} from 'lucide-react';
import AdminBookManager from './AdminBookManager';
import AdminNotificationsManager from './AdminNotificationsManager';
import AdminFeedbackViewer from './AdminFeedbackViewer';
import { Bell, MessageSquare } from 'lucide-react';

interface UserStat {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  joined_at: string;
  gamify_score: number;
  books_uploaded: number;
  uploaded_book_titles: { id: string; title: string; author: string; genre: string | null; created_at: string }[];
  books_completed: number;
  books_in_progress: number;
  last_read_at: string | null;
  total_reading_minutes: number;
  highlight_count: number;
  vocab_count: number;
  daily_quizzes_completed: number;
  avg_daily_quiz_score: number;
  chapter_quizzes_taken: number;
  avg_chapter_quiz_score: number;
}

interface Overview {
  total_users: number;
  users_who_uploaded: number;
  total_user_books: number;
  total_default_books: number;
  total_highlights: number;
  total_vocab_saved: number;
  total_quiz_attempts: number;
  total_reading_minutes: number;
}

interface AdminData {
  overview: Overview;
  users: UserStat[];
}

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatMinutes(mins: number) {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function StatCard({ icon: Icon, label, value, sub }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string;
}) {
  return (
    <div
      className="rounded-xl border p-5 flex flex-col gap-2"
      style={{ backgroundColor: 'var(--bg-card, #fff)', borderColor: 'var(--border)' }}
    >
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#8B691415' }}>
          <Icon className="w-4 h-4" style={{ color: '#8B6914' }} />
        </div>
        <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
          {label}
        </span>
      </div>
      <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'Lora, Georgia, serif' }}>
        {value}
      </p>
      {sub && <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{sub}</p>}
    </div>
  );
}

function UserRow({ user }: { user: UserStat }) {
  const [expanded, setExpanded] = useState(false);

  const initials = user.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user.email[0].toUpperCase();

  return (
    <div
      className="rounded-xl border overflow-hidden transition-shadow hover:shadow-soft"
      style={{ backgroundColor: 'var(--bg-card, #fff)', borderColor: 'var(--border)' }}
    >
      {/* Main row */}
      <div
        className="flex items-center gap-4 p-4 cursor-pointer select-none"
        onClick={() => setExpanded(e => !e)}
      >
        {/* Avatar */}
        <div className="flex-none">
          {user.avatar_url ? (
            <img src={user.avatar_url} alt={user.full_name ?? user.email}
              className="w-9 h-9 rounded-full object-cover" />
          ) : (
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
              style={{ backgroundColor: '#8B6914' }}>
              {initials}
            </div>
          )}
        </div>

        {/* Name + email */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
            {user.full_name ?? '(no name)'}
          </p>
          <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
            {user.email}
          </p>
        </div>

        {/* Quick stats */}
        <div className="hidden sm:flex items-center gap-5 flex-none">
          <div className="text-center">
            <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{user.books_uploaded}</p>
            <p className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>Uploads</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{user.books_completed}</p>
            <p className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>Done</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{user.highlight_count}</p>
            <p className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>Highlights</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{user.gamify_score}</p>
            <p className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>Score</p>
          </div>
        </div>

        {/* Joined date */}
        <div className="hidden lg:block flex-none text-right">
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Joined</p>
          <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{formatDate(user.joined_at)}</p>
        </div>

        <div className="flex-none" style={{ color: 'var(--text-secondary)' }}>
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div
          className="border-t px-4 pb-4 pt-3"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg, #FAF8F4)' }}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
            <Detail label="Total Reading" value={formatMinutes(user.total_reading_minutes)} />
            <Detail label="Books In Progress" value={user.books_in_progress} />
            <Detail label="Vocab Saved" value={user.vocab_count} />
            <Detail label="Last Read" value={formatDate(user.last_read_at)} />
            <Detail label="Daily Quizzes" value={user.daily_quizzes_completed} />
            <Detail label="Avg Daily Score" value={user.avg_daily_quiz_score ? `${user.avg_daily_quiz_score}/5` : '—'} />
            <Detail label="Chapter Quizzes" value={user.chapter_quizzes_taken} />
            <Detail label="Avg Chapter Score" value={user.avg_chapter_quiz_score ? `${user.avg_chapter_quiz_score}%` : '—'} />
          </div>

          {user.uploaded_book_titles.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                Uploaded Books ({user.uploaded_book_titles.length})
              </p>
              <div className="space-y-1.5">
                {user.uploaded_book_titles.map(b => (
                  <div key={b.id}
                    className="flex items-center justify-between rounded-lg px-3 py-2 border"
                    style={{ backgroundColor: 'var(--bg-card, #fff)', borderColor: 'var(--border)' }}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{b.title}</p>
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{b.author}{b.genre ? ` · ${b.genre}` : ''}</p>
                    </div>
                    <p className="text-xs flex-none ml-3" style={{ color: 'var(--text-secondary)' }}>
                      {formatDate(b.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {user.uploaded_book_titles.length === 0 && (
            <p className="text-xs italic" style={{ color: 'var(--text-secondary)' }}>
              No personal books uploaded.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border px-3 py-2" style={{ backgroundColor: 'var(--bg-card,#fff)', borderColor: 'var(--border)' }}>
      <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-secondary)' }}>{label}</p>
      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{value}</p>
    </div>
  );
}

type SortKey = 'joined_at' | 'books_uploaded' | 'total_reading_minutes' | 'books_completed' | 'gamify_score' | 'highlight_count';

type AdminTab = 'overview' | 'books' | 'users' | 'notifications' | 'feedback';

export default function AdminDashboard() {
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('joined_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [filterUploaders, setFilterUploaders] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => r.json())
      .then(d => {
        if (d.error) throw new Error(d.error);
        setData(d);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-32 gap-3">
      <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#8B6914' }} />
      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Loading admin data…</span>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center py-32 gap-3">
      <AlertCircle className="w-6 h-6 text-red-400" />
      <span className="text-sm text-red-500">{error}</span>
    </div>
  );

  if (!data) return null;

  const { overview, users } = data;

  // Filter + sort
  const filtered = users
    .filter(u => {
      if (filterUploaders && u.books_uploaded === 0) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          u.email.toLowerCase().includes(q) ||
          (u.full_name ?? '').toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      const va = a[sortKey] as number | string;
      const vb = b[sortKey] as number | string;
      if (typeof va === 'number' && typeof vb === 'number') {
        return sortDir === 'desc' ? vb - va : va - vb;
      }
      return sortDir === 'desc'
        ? String(vb).localeCompare(String(va))
        : String(va).localeCompare(String(vb));
    });

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  const SortBtn = ({ k, label }: { k: SortKey; label: string }) => (
    <button
      onClick={() => toggleSort(k)}
      className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors"
      style={sortKey === k
        ? { backgroundColor: '#8B6914', color: '#fff', borderColor: '#8B6914' }
        : { backgroundColor: 'var(--bg-card,#fff)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }
      }
    >
      {label} {sortKey === k ? (sortDir === 'desc' ? '↓' : '↑') : ''}
    </button>
  );

  const TABS: { id: AdminTab; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview', icon: BarChart2 },
    { id: 'books', label: 'Books', icon: Library },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'notifications', label: 'Announcements', icon: Bell },
    { id: 'feedback', label: 'Feedback', icon: MessageSquare },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#8B691415' }}>
          <Shield className="w-5 h-5" style={{ color: '#8B6914' }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Lora, Georgia, serif', color: 'var(--text-primary)' }}>
            Admin Dashboard
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Folio platform overview
          </p>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex items-center gap-1 mb-8 border-b" style={{ borderColor: 'var(--border)' }}>
        {TABS.map(tab => {
          const active = activeTab === tab.id;
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative"
              style={{ color: active ? '#8B6914' : 'var(--text-secondary)' }}
            >
              <TabIcon className="w-4 h-4" />
              {tab.label}
              {active && (
                <span
                  className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full"
                  style={{ backgroundColor: '#8B6914' }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Overview Tab ── */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon={Users} label="Total Users" value={overview.total_users} />
          <StatCard icon={Clock} label="Total Time Read" value={formatMinutes(overview.total_reading_minutes)}
            sub="combined all users" />
          <StatCard icon={Upload} label="Users w/ Uploads" value={overview.users_who_uploaded}
            sub={`${overview.total_user_books} personal books`} />
          <StatCard icon={BookOpen} label="Public Books" value={overview.total_default_books}
            sub="in shared library" />
          <StatCard icon={Highlighter} label="Total Highlights" value={overview.total_highlights} />
          <StatCard icon={BookMarked} label="Vocab Saved" value={overview.total_vocab_saved} />
          <StatCard icon={Trophy} label="Quiz Attempts" value={overview.total_quiz_attempts}
            sub="daily quiz completions" />
          <StatCard icon={BarChart2} label="Total Books" value={overview.total_user_books + overview.total_default_books}
            sub={`${overview.total_user_books} user + ${overview.total_default_books} public`} />
        </div>
      )}

      {/* ── Books Tab ── */}
      {activeTab === 'books' && (
        <AdminBookManager />
      )}

      {/* ── Users Tab ── */}
      {activeTab === 'users' && (
        <>
          {/* Users section */}
          <div className="mb-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)', fontFamily: 'Lora, Georgia, serif' }}>
              Users ({filtered.length})
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              {/* Search */}
              <input
                type="text"
                placeholder="Search by name or email…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="px-3 py-1.5 text-sm rounded-lg border outline-none"
                style={{ backgroundColor: 'var(--bg-card,#fff)', borderColor: 'var(--border)', color: 'var(--text-primary)', minWidth: '200px' }}
              />
              {/* Filter uploaders */}
              <button
                onClick={() => setFilterUploaders(f => !f)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors"
                style={filterUploaders
                  ? { backgroundColor: '#8B6914', color: '#fff', borderColor: '#8B6914' }
                  : { backgroundColor: 'var(--bg-card,#fff)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }
                }
              >
                📤 Uploaders only
              </button>
            </div>
          </div>

          {/* Sort controls */}
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-xs self-center" style={{ color: 'var(--text-secondary)' }}>Sort by:</span>
            <SortBtn k="joined_at" label="Join Date" />
            <SortBtn k="books_uploaded" label="Uploads" />
            <SortBtn k="total_reading_minutes" label="Reading Time" />
            <SortBtn k="books_completed" label="Books Done" />
            <SortBtn k="gamify_score" label="Quiz Score" />
            <SortBtn k="highlight_count" label="Highlights" />
          </div>

          {/* User rows */}
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <div className="text-center py-12 rounded-xl border" style={{ borderColor: 'var(--border)' }}>
                <Users className="w-8 h-8 mx-auto mb-2 opacity-20" style={{ color: 'var(--text-secondary)' }} />
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No users match your filters.</p>
              </div>
            ) : (
              filtered.map(u => <UserRow key={u.id} user={u} />)
            )}
          </div>
        </>
      )}

      {/* ── Notifications Tab ── */}
      {activeTab === 'notifications' && (
        <AdminNotificationsManager />
      )}

      {/* ── Feedback Tab ── */}
      {activeTab === 'feedback' && (
        <AdminFeedbackViewer />
      )}
    </div>
  );
}
