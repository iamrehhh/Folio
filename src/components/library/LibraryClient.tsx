'use client';

import { useState, useMemo, useEffect, useLayoutEffect, useRef } from 'react';
import Link from 'next/link';
import { Search, BookOpen, Upload, MoreVertical, Pencil, Trash2, SlidersHorizontal, X, Calendar, Star, ArrowUpDown, Check, Download, Globe, PanelLeftClose, PanelLeftOpen, Users, ChevronDown, Plus, BookMarked, Library } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, truncate } from '@/lib/utils';
import type { Book, BookSchedule } from '@/types';
import BookUploadModal from './BookUploadModal';
import BulkUploadModal from './BulkUploadModal';
import BookEditModal from './BookEditModal';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { DatePicker } from '@/components/ui/DatePicker';

type FilterTab = 'all' | 'unread' | 'reading' | 'completed' | 'scheduled';
type SortOption = 'newest' | 'oldest' | 'title_az' | 'author_az';
type LibraryMode = 'my_library' | 'public';

const SORT_OPTIONS: { id: SortOption; label: string }[] = [
  { id: 'newest', label: 'Recently Added' },
  { id: 'oldest', label: 'Oldest First' },
  { id: 'title_az', label: 'Title (A-Z)' },
  { id: 'author_az', label: 'Author (A-Z)' },
];
interface ProgressInfo { progress_percent: number; last_read_at: string; chapter_title?: string; }
interface Props { books: Book[]; progressMap: Map<string, ProgressInfo>; scheduleMap: Map<string, BookSchedule>; userLibraryBookIds: string[]; userId: string; isAdmin: boolean; }

const GENRES = ['All', 'Fiction', 'Non-Fiction', 'Science', 'History', 'Biography', 'Philosophy', 'Fantasy', 'Mystery/Thriller', 'Romance', 'Comedy', 'Horror', 'Other'];
const LANGUAGES = ['All', 'English', 'Bengali', 'Hindi', 'Spanish', 'French', 'German', 'Other'];

export default function LibraryClient({ books: initialBooks, progressMap, scheduleMap: initialScheduleMap, userLibraryBookIds: initialLibraryIds, userId, isAdmin }: Props) {
  const router = useRouter();
  const [books, setBooks] = useState(initialBooks);
  const [scheduleMap, setScheduleMap] = useState<Map<string, BookSchedule>>(initialScheduleMap ?? new Map());
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [selectedLanguage, setSelectedLanguage] = useState('All');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [schedulingBook, setSchedulingBook] = useState<Book | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [confirmBook, setConfirmBook] = useState<Book | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const sidebarAnimReady = useRef(false);

  // New state: Library mode, Author filter, Sidebar sections
  const [libraryMode, setLibraryMode] = useState<LibraryMode>('my_library');
  const [myLibraryIds, setMyLibraryIds] = useState<Set<string>>(new Set(initialLibraryIds));
  const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null);
  const [authorSearch, setAuthorSearch] = useState('');
  const [genreSectionOpen, setGenreSectionOpen] = useState(true);
  const [authorSectionOpen, setAuthorSectionOpen] = useState(false);
  const [addingToLibrary, setAddingToLibrary] = useState<string | null>(null);

  // Read persisted state before browser paints (prevents flash on client-side navigation)
  useLayoutEffect(() => {
    const saved = localStorage.getItem('folio-sidebar-open');
    if (saved !== null) {
      setIsSidebarOpen(saved === 'true');
    }
    // Remove the pre-hydration CSS hint so React/Framer takes full control
    document.documentElement.removeAttribute('data-sidebar-closed');
    // Enable animations only after the initial state correction renders
    requestAnimationFrame(() => { sidebarAnimReady.current = true; });
  }, []);

  // Persist changes (skip the initial correction write)
  useEffect(() => {
    if (sidebarAnimReady.current) {
      localStorage.setItem('folio-sidebar-open', String(isSidebarOpen));
    }
  }, [isSidebarOpen]);

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('library-books')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'books' }, (payload) => {
        const newBook = payload.new as Book;
        if (newBook.uploaded_by === userId || newBook.visibility === 'public') {
          setBooks(prev => prev.some(b => b.id === newBook.id) ? prev : [newBook, ...prev]);
          if (newBook.uploaded_by !== userId) toast(`📚 New book: "${newBook.title}"`, { duration: 3000 });
        }
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'books' }, (payload) => {
        setBooks(prev => prev.filter(b => b.id !== payload.old.id));
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'books' }, (payload) => {
        setBooks(prev => prev.map(b => b.id === (payload.new as Book).id ? payload.new as Book : b));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  // Schedule notification toast
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    let notifiedCount = 0;
    
    books.forEach(book => {
      const schedule = scheduleMap.get(book.id);
      const isUnread = (progressMap.get(book.id)?.progress_percent ?? 0) === 0;
      
      if (schedule && schedule.scheduled_for === today && isUnread && notifiedCount < 2) {
        setTimeout(() => {
          toast((t) => (
            <div className="flex flex-col gap-1">
              <span className="font-semibold text-sm">Reminder!</span>
              <span className="text-sm">Today is the day! Ready to start reading "{book.title}"?</span>
            </div>
          ), {
            duration: 6000,
            icon: '📅',
            id: `schedule-toast-${book.id}` // Prevent duplicates if component remounts
          });
        }, notifiedCount * 1000); // stagger them slightly
        notifiedCount++;
      }
    });
  }, [books, scheduleMap, progressMap]);

  // Derive unique authors with book counts from current book set
  const authorStats = useMemo(() => {
    const map = new Map<string, number>();
    books.forEach(b => {
      const name = b.author.trim();
      if (name) map.set(name, (map.get(name) ?? 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [books]);

  // Filtered author list for sidebar search
  const filteredAuthors = useMemo(() => {
    if (!authorSearch) return authorStats;
    const q = authorSearch.toLowerCase();
    return authorStats.filter(([name]) => name.toLowerCase().includes(q));
  }, [authorStats, authorSearch]);

  // Count books in each mode for badges
  const myLibraryCount = useMemo(() => books.filter(b => myLibraryIds.has(b.id) || b.uploaded_by === userId).length, [books, myLibraryIds, userId]);
  const publicCount = useMemo(() => books.length, [books]);

  // Add a book to user's personal library
  async function handleAddToLibrary(bookId: string) {
    setAddingToLibrary(bookId);
    try {
      const res = await fetch('/api/library', { method: 'POST', body: JSON.stringify({ book_id: bookId }) });
      if (!res.ok) throw new Error();
      setMyLibraryIds(prev => { const next = new Set(Array.from(prev)); next.add(bookId); return next; });
      toast.success('Added to My Library');
    } catch { toast.error('Failed to add to library'); }
    finally { setAddingToLibrary(null); }
  }

  // Remove a book from user's personal library
  async function handleRemoveFromLibrary(bookId: string) {
    try {
      const res = await fetch(`/api/library?book_id=${bookId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setMyLibraryIds(prev => { const next = new Set(prev); next.delete(bookId); return next; });
      toast.success('Removed from My Library');
    } catch { toast.error('Failed to remove from library'); }
  }

  const filteredAndSorted = useMemo(() => {
    const filtered = books.filter((book) => {
      // Library mode filter
      if (libraryMode === 'my_library' && !(myLibraryIds.has(book.id) || book.uploaded_by === userId)) return false;

      const pct = progressMap.get(book.id)?.progress_percent ?? 0;
      const isScheduled = scheduleMap.has(book.id);
      if (activeTab === 'unread' && pct > 0) return false;
      if (activeTab === 'reading' && (pct === 0 || pct >= 100)) return false;
      if (activeTab === 'completed' && pct < 100) return false;
      if (activeTab === 'scheduled' && !isScheduled) return false;
      if (selectedGenre !== 'All' && !(book.genre ?? '').split(',').map(g => g.trim()).includes(selectedGenre)) return false;
      if (selectedLanguage !== 'All' && book.language !== selectedLanguage) return false;
      if (selectedAuthor && book.author.trim() !== selectedAuthor) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return book.title.toLowerCase().includes(q) || book.author.toLowerCase().includes(q);
      }
      return true;
    });

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title_az':
          return a.title.localeCompare(b.title);
        case 'author_az':
          return a.author.localeCompare(b.author);
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'newest':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
  }, [books, progressMap, scheduleMap, activeTab, selectedGenre, selectedLanguage, searchQuery, sortBy, libraryMode, myLibraryIds, userId, selectedAuthor]);


  async function handleDelete(book: Book) {
    setConfirmBook(book);
    setOpenMenuId(null);
  }

  async function confirmDelete() {
    if (!confirmBook) return;
    try {
      const res = await fetch(`/api/books/${confirmBook.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setBooks(prev => prev.filter(b => b.id !== confirmBook.id));
      toast.success(`"${confirmBook.title}" deleted`);
    } catch {
      toast.error('Failed to delete book');
    } finally {
      setConfirmBook(null);
    }
  }

  const tabs: { id: FilterTab; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'reading', label: 'In Progress' },
    { id: 'unread', label: 'Unread' },
    { id: 'scheduled', label: 'Scheduled' },
    { id: 'completed', label: 'Completed' },
  ];

  return (
    <div className="flex h-[calc(100vh-3.5rem)]" style={{ backgroundColor: 'var(--bg)' }}>

      {/* ── Sidebar — desktop only ── */}
      <motion.aside 
        data-genre-sidebar
        animate={{ width: isSidebarOpen ? 220 : 0, opacity: isSidebarOpen ? 1 : 0 }}
        transition={{ duration: sidebarAnimReady.current ? 0.3 : 0, ease: [0.25, 0.1, 0.25, 1] }}
        className="hidden md:flex flex-col flex-none overflow-hidden"
        style={{ 
          backgroundColor: 'var(--bg-sidebar)', 
          borderRight: isSidebarOpen ? '1px solid var(--border)' : 'none',
        }}
      >
        <div className="flex flex-col h-full" style={{ width: 220 }}>
          {/* ── Library Mode Toggle ── */}
          <div className="p-3 pb-0">
            <div className="flex flex-col gap-1">
              <button
                onClick={() => setLibraryMode('my_library')}
                className={cn('w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                  libraryMode === 'my_library' ? '' : 'hover:bg-[var(--border)]')}
                style={libraryMode === 'my_library'
                  ? { backgroundColor: '#8B691418', color: '#8B6914', borderLeft: '3px solid #8B6914' }
                  : { color: 'var(--text-secondary)', borderLeft: '3px solid transparent' }}
              >
                <BookMarked className="w-4 h-4" />
                <span className="flex-1 text-left">My Library</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: libraryMode === 'my_library' ? '#8B691425' : 'var(--border)' }}>
                  {myLibraryCount}
                </span>
              </button>
              <button
                onClick={() => setLibraryMode('public')}
                className={cn('w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                  libraryMode === 'public' ? '' : 'hover:bg-[var(--border)]')}
                style={libraryMode === 'public'
                  ? { backgroundColor: '#8B691418', color: '#8B6914', borderLeft: '3px solid #8B6914' }
                  : { color: 'var(--text-secondary)', borderLeft: '3px solid transparent' }}
              >
                <Library className="w-4 h-4" />
                <span className="flex-1 text-left">Public Library</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: libraryMode === 'public' ? '#8B691425' : 'var(--border)' }}>
                  {publicCount}
                </span>
              </button>
            </div>
          </div>

          {/* ── Divider ── */}
          <div className="mx-3 my-2 border-t" style={{ borderColor: 'var(--border)' }} />

          <div className="p-3 pt-0 overflow-y-auto flex-1">

            {/* ── Genre Section ── */}
            <button
              onClick={() => setGenreSectionOpen(prev => !prev)}
              className="w-full flex items-center justify-between px-2 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors hover:bg-[var(--border)]"
              style={{ color: 'var(--text-secondary)' }}
            >
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                Genre
              </span>
              <ChevronDown className={cn('w-3.5 h-3.5 transition-transform duration-200', genreSectionOpen ? '' : '-rotate-90')} />
            </button>
            <AnimatePresence initial={false}>
              {genreSectionOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="space-y-0.5 pt-1 pb-2">
                    {GENRES.map(genre => (
                      <button key={genre} onClick={() => { setSelectedGenre(genre); setSelectedAuthor(null); }}
                        className={cn('w-full text-left px-3 py-1.5 rounded text-sm transition-colors',
                          selectedGenre === genre && !selectedAuthor ? 'font-medium' : 'hover:bg-[var(--border)]')}
                        style={selectedGenre === genre && !selectedAuthor
                          ? { backgroundColor: '#8B691420', color: '#8B6914' }
                          : { color: 'var(--text-secondary)' }}>
                        {genre}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Divider ── */}
            <div className="my-2 border-t" style={{ borderColor: 'var(--border)' }} />

            {/* ── Authors Section ── */}
            <button
              onClick={() => setAuthorSectionOpen(prev => !prev)}
              className="w-full flex items-center justify-between px-2 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors hover:bg-[var(--border)]"
              style={{ color: 'var(--text-secondary)' }}
            >
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                Authors
                <span className="text-[10px] font-normal normal-case px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                  {authorStats.length}
                </span>
              </span>
              <ChevronDown className={cn('w-3.5 h-3.5 transition-transform duration-200', authorSectionOpen ? '' : '-rotate-90')} />
            </button>
            <AnimatePresence initial={false}>
              {authorSectionOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="pt-1 pb-2">
                    {/* Author search */}
                    {authorStats.length > 5 && (
                      <div className="relative mb-2 px-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none" style={{ color: 'var(--text-secondary)' }} />
                        <input
                          type="text"
                          placeholder="Search authors…"
                          value={authorSearch}
                          onChange={e => setAuthorSearch(e.target.value)}
                          className="w-full pl-7 pr-2 py-1.5 text-xs rounded-md border outline-none"
                          style={{ backgroundColor: 'var(--bg-card,#fff)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                        />
                      </div>
                    )}
                    {/* "All Authors" reset */}
                    <button
                      onClick={() => setSelectedAuthor(null)}
                      className={cn('w-full text-left px-3 py-1.5 rounded text-sm transition-colors',
                        !selectedAuthor ? 'font-medium' : 'hover:bg-[var(--border)]')}
                      style={!selectedAuthor
                        ? { backgroundColor: '#8B691420', color: '#8B6914' }
                        : { color: 'var(--text-secondary)' }}
                    >
                      All Authors
                    </button>
                    {/* Author list */}
                    <div className="space-y-0.5 mt-0.5">
                      {filteredAuthors.map(([author, count]) => (
                        <button key={author} onClick={() => { setSelectedAuthor(author); setSelectedGenre('All'); }}
                          className={cn('w-full text-left px-3 py-1.5 rounded text-sm transition-colors flex items-center justify-between gap-1',
                            selectedAuthor === author ? 'font-medium' : 'hover:bg-[var(--border)]')}
                          style={selectedAuthor === author
                            ? { backgroundColor: '#8B691420', color: '#8B6914' }
                            : { color: 'var(--text-secondary)' }}
                        >
                          <span className="truncate">{author}</span>
                          <span className="text-[10px] flex-shrink-0 px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'var(--border)' }}>{count}</span>
                        </button>
                      ))}
                      {filteredAuthors.length === 0 && (
                        <p className="text-xs px-3 py-2" style={{ color: 'var(--text-secondary)' }}>No authors found</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="p-3 mt-auto border-t" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0" style={{ backgroundColor: '#8B691420' }}>
                <BookOpen className="w-4 h-4" style={{ color: '#8B6914' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold leading-none truncate" style={{ color: 'var(--text-primary)' }}>
                  {filteredAndSorted.length}
                </p>
                <p className="text-[10px] font-medium uppercase tracking-wider mt-1 truncate" style={{ color: 'var(--text-secondary)' }}>
                  {libraryMode === 'my_library' ? 'In My Library' : 'Total Books'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* ── Mobile filter drawer ── */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowMobileFilters(false)} />
          <div className="absolute bottom-0 left-0 right-0 rounded-t-2xl p-5 max-h-[70vh] overflow-y-auto"
            style={{ backgroundColor: 'var(--bg-sidebar)' }}>
            <div className="flex items-center justify-between mb-4">
              <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Filters</p>
              <button onClick={() => setShowMobileFilters(false)}>
                <X className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
              </button>
            </div>
            {/* Genre */}
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Genre</p>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {GENRES.map(genre => (
                <button key={genre} onClick={() => { setSelectedGenre(genre); setSelectedAuthor(null); setShowMobileFilters(false); }}
                  className="px-3 py-2 rounded-lg text-sm transition-colors text-center"
                  style={selectedGenre === genre && !selectedAuthor
                    ? { backgroundColor: '#8B6914', color: '#fff' }
                    : { backgroundColor: 'var(--border)', color: 'var(--text-primary)' }}>
                  {genre}
                </button>
              ))}
            </div>
            {/* Authors */}
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Authors</p>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => { setSelectedAuthor(null); setShowMobileFilters(false); }}
                className="px-3 py-1.5 rounded-full text-sm transition-colors"
                style={!selectedAuthor
                  ? { backgroundColor: '#8B6914', color: '#fff' }
                  : { backgroundColor: 'var(--border)', color: 'var(--text-primary)' }}>
                All
              </button>
              {authorStats.map(([author, count]) => (
                <button key={author} onClick={() => { setSelectedAuthor(author); setSelectedGenre('All'); setShowMobileFilters(false); }}
                  className="px-3 py-1.5 rounded-full text-sm transition-colors"
                  style={selectedAuthor === author
                    ? { backgroundColor: '#8B6914', color: '#fff' }
                    : { backgroundColor: 'var(--border)', color: 'var(--text-primary)' }}>
                  {author} <span className="opacity-60">({count})</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <div className="px-4 md:px-8 py-3 border-b flex flex-wrap items-center gap-3"
          style={{ borderColor: 'var(--border)' }}>

          {/* Toggle Sidebar Button */}
          <button 
            onClick={() => setIsSidebarOpen(prev => !prev)}
            className="hidden md:flex items-center justify-center w-9 h-9 rounded-lg border transition-colors hover:bg-[var(--border)]"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            title={isSidebarOpen ? "Close Sidebar" : "Open Sidebar"}
          >
            {isSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
          </button>

          {/* Search */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
              style={{ color: 'var(--text-secondary)' }} />
            <input type="text" placeholder="Search books…" value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border outline-none"
              style={{ backgroundColor: 'var(--bg-card,#fff)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
          </div>

          {selectedAuthor && (
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium" style={{ backgroundColor: '#8B691420', color: '#8B6914' }}>
              <Users className="w-3 h-3" />
              {selectedAuthor}
              <button onClick={() => setSelectedAuthor(null)} className="ml-0.5 hover:opacity-70"><X className="w-3 h-3" /></button>
            </div>
          )}

          {/* Filter tabs — scrollable on mobile */}
          <div className="flex items-center gap-1 overflow-x-auto">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={cn('px-3 py-1.5 rounded text-sm font-medium transition-colors whitespace-nowrap',
                  activeTab === tab.id ? 'text-white' : 'hover:bg-[var(--border)]')}
                style={activeTab === tab.id
                  ? { backgroundColor: '#8B6914', color: '#fff' }
                  : { color: 'var(--text-secondary)' }}>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* Genre filter button — mobile only */}
            <button onClick={() => setShowMobileFilters(true)}
              className="md:hidden flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm"
              style={{
                borderColor: 'var(--border)',
                backgroundColor: selectedGenre !== 'All' ? '#8B691420' : undefined,
                color: selectedGenre !== 'All' ? '#8B6914' : 'var(--text-secondary)',
              }}>
              <SlidersHorizontal className="w-4 h-4" />
              {selectedGenre !== 'All' ? selectedGenre : 'Genre'}
            </button>

            {/* Language Menu */}
            <div className="relative hidden sm:block">
              <button onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm transition-colors hover:bg-[var(--border)]"
                style={{ 
                  borderColor: 'var(--border)', 
                  color: selectedLanguage !== 'All' ? '#8B6914' : 'var(--text-secondary)',
                  backgroundColor: selectedLanguage !== 'All' ? '#8B691420' : undefined
                }}>
                <Globe className="w-4 h-4" />
                <span>{selectedLanguage !== 'All' ? selectedLanguage : 'Language'}</span>
              </button>

              {showLangMenu && (
                <>
                  <div className="fixed inset-0 z-[15]" onClick={() => setShowLangMenu(false)} />
                  <div className="absolute right-0 top-full mt-2 w-40 rounded-xl border shadow-popover overflow-hidden z-20 max-h-60 overflow-y-auto"
                    style={{ backgroundColor: 'var(--bg-card,#fff)', borderColor: 'var(--border)' }}>
                    {LANGUAGES.map(lang => (
                      <button key={lang}
                        onClick={() => { setSelectedLanguage(lang); setShowLangMenu(false); }}
                        className="w-full flex items-center justify-between px-3 py-2.5 text-sm transition-colors hover:bg-[var(--border)]"
                        style={{ color: selectedLanguage === lang ? '#8B6914' : 'var(--text-primary)' }}>
                        <span className={selectedLanguage === lang ? "font-semibold" : ""}>{lang}</span>
                        {selectedLanguage === lang && <Check className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Sort Menu */}
            <div className="relative">
              <button onClick={() => setShowSortMenu(!showSortMenu)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm transition-colors hover:bg-[var(--border)]"
                style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                <ArrowUpDown className="w-4 h-4" />
                <span className="hidden sm:inline">Sort</span>
              </button>

              {showSortMenu && (
                <>
                  <div className="fixed inset-0 z-[15]" onClick={() => setShowSortMenu(false)} />
                  <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border shadow-popover overflow-hidden z-20"
                    style={{ backgroundColor: 'var(--bg-card,#fff)', borderColor: 'var(--border)' }}>
                    {SORT_OPTIONS.map(opt => (
                      <button key={opt.id}
                        onClick={() => { setSortBy(opt.id); setShowSortMenu(false); }}
                        className="w-full flex items-center justify-between px-3 py-2.5 text-sm transition-colors hover:bg-[var(--border)]"
                        style={{ color: sortBy === opt.id ? '#8B6914' : 'var(--text-primary)' }}>
                        <span className={sortBy === opt.id ? "font-semibold" : ""}>{opt.label}</span>
                        {sortBy === opt.id && <Check className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Add Book */}
            {isAdmin && (
              <button onClick={() => setShowBulkUploadModal(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors hover:bg-[var(--border)] whitespace-nowrap"
                style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">Bulk Upload</span>
              </button>
            )}
            <button onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90 whitespace-nowrap"
              style={{ backgroundColor: '#8B6914' }}>
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Add Book</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </div>

        {/* Book grid */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {filteredAndSorted.length === 0 ? (
            <div className="text-center py-20">
              <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-20" style={{ color: 'var(--text-secondary)' }} />
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                {libraryMode === 'my_library' ? 'Your library is empty' : 'No books found'}
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                {libraryMode === 'my_library' && myLibraryCount === 0
                  ? 'Browse the Public Library to add books to your collection.'
                  : books.length === 0
                    ? 'Upload your first EPUB to get started.'
                    : 'Try adjusting your filters.'}
              </p>
              {libraryMode === 'my_library' && myLibraryCount === 0 && (
                <button
                  onClick={() => setLibraryMode('public')}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-90 text-white"
                  style={{ backgroundColor: '#8B6914' }}
                >
                  <Library className="w-4 h-4" /> Browse Public Library
                </button>
              )}
            </div>
          ) : (
            <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 xl:gap-5">
            <AnimatePresence mode="popLayout">
              {filteredAndSorted.map(book => {
                const pct = Math.round(progressMap.get(book.id)?.progress_percent ?? 0);
                const isUnread = pct === 0;
                const isCompleted = pct >= 100;
                const menuOpen = openMenuId === book.id;

                return (
                  <motion.div 
                    key={book.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, filter: 'blur(2px)' }}
                    transition={{ duration: 0.2, layout: { type: "spring", stiffness: 350, damping: 30 } }}
                    className="group flex flex-col rounded-xl border overflow-hidden transition-shadow duration-200 hover:shadow-soft-lg"
                    style={{ backgroundColor: 'var(--bg-card,#fff)', borderColor: 'var(--border)' }}>

                    {/* Cover — clickable → Read Book */}
                    <div className="relative">
                      <Link href={`/read/${book.id}`} className="block w-full aspect-[2/3] bg-[#E5E0D8] flex items-center justify-center overflow-hidden relative group/cover cursor-pointer">
                        {book.cover_url
                          ? <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover/cover:scale-105" />
                          : <BookOpen className="w-8 h-8 opacity-25 transition-transform duration-700 ease-out group-hover/cover:scale-110" style={{ color: 'var(--text-secondary)' }} />
                        }
                        
                        <div className="absolute inset-0 bg-black/0 group-hover/cover:bg-black/5 transition-colors duration-300" />
                        {book.genre && (
                          <div className="absolute top-2 left-2 flex flex-wrap gap-1 max-w-[calc(100%-3rem)]">
                            {book.genre.split(',').map(g => g.trim()).filter(Boolean).map((g, i) => (
                              <span key={i} className="px-2 py-0.5 rounded text-[10px] font-medium leading-tight"
                                style={{ backgroundColor: 'rgba(0,0,0,0.55)', color: '#fff', backdropFilter: 'blur(4px)' }}>
                                {g}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        {scheduleMap.has(book.id) && (
                          <span className="absolute bottom-2 left-2 px-2 py-1 rounded text-xs font-medium flex items-center gap-1.5 shadow-sm"
                            style={{ backgroundColor: '#8B6914', color: '#fff' }}>
                            <Calendar className="w-3 h-3" />
                            {new Date(scheduleMap.get(book.id)!.scheduled_for).toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' })}
                          </span>
                        )}
                      </Link>

                      {/* ⋮ menu — outside Link to prevent navigation/loading bar */}
                      <div className="absolute top-2 right-2 z-10">
                          <button
                            onClick={() => setOpenMenuId(menuOpen ? null : book.id)}
                            className="w-7 h-7 rounded-full flex items-center justify-center transition-opacity md:opacity-0 md:group-hover:opacity-100 opacity-100"
                            style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}>
                            <MoreVertical className="w-4 h-4 text-white" />
                          </button>
                          {menuOpen && (
                            <div className="absolute right-0 top-9 w-48 rounded-xl border shadow-lg overflow-hidden z-20 backdrop-blur-sm"
                              style={{ backgroundColor: 'var(--bg-card,#fff)', borderColor: 'var(--border)' }}>
                              {book.uploaded_by === userId && (
                                <>
                                  <button
                                    onClick={() => { setEditingBook(book); setOpenMenuId(null); }}
                                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm hover:bg-[var(--border)] transition-colors"
                                    style={{ color: 'var(--text-primary)' }}>
                                    <Pencil className="w-3.5 h-3.5 opacity-60" /> Edit book
                                  </button>
                                  <button
                                    onClick={() => handleDelete(book)}
                                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm hover:bg-red-50 transition-colors text-red-500">
                                    <Trash2 className="w-3.5 h-3.5 opacity-70" /> Delete book
                                  </button>
                                </>
                              )}
                              {myLibraryIds.has(book.id) && book.uploaded_by !== userId && (
                                <button
                                  onClick={() => { handleRemoveFromLibrary(book.id); setOpenMenuId(null); }}
                                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm hover:bg-red-50 transition-colors"
                                  style={{ color: 'var(--text-secondary)' }}>
                                  <BookMarked className="w-3.5 h-3.5 opacity-60" /> Remove from library
                                </button>
                              )}
                              {!myLibraryIds.has(book.id) && book.uploaded_by !== userId && (
                                <button
                                  onClick={() => { handleAddToLibrary(book.id); setOpenMenuId(null); }}
                                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm hover:bg-[var(--border)] transition-colors"
                                  style={{ color: '#8B6914' }}>
                                  <Plus className="w-3.5 h-3.5" /> Add to My Library
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                    </div>

                    {/* Info */}
                    <div className="flex flex-col flex-1 p-4 md:p-5">
                      <h3 className="font-medium text-sm md:text-base leading-snug"
                        style={{ fontFamily: 'Lora, Georgia, serif', color: 'var(--text-primary)' }}
                        title={book.title}>
                        {truncate(book.title, 35)}
                      </h3>
                      <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                        {truncate(book.author, 25)}
                      </p>

                      {!isUnread && (
                        <div className="mt-2">
                          <div className="w-full h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border)' }}>
                            <div className="h-full rounded-full"
                              style={{ width: `${pct}%`, backgroundColor: isCompleted ? '#4CAF50' : '#8B6914' }} />
                          </div>
                          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                            {isCompleted ? '✓ Done' : `${pct}%`}
                          </p>
                        </div>
                      )}
                      <div className="mt-auto pt-2">
                        {!myLibraryIds.has(book.id) && book.uploaded_by !== userId ? (
                          <button
                            onClick={() => handleAddToLibrary(book.id)}
                            disabled={addingToLibrary === book.id}
                            className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all hover:opacity-90 text-white"
                            style={{ backgroundColor: '#8B6914' }}>
                            {addingToLibrary === book.id ? (
                              <span className="animate-pulse">Adding…</span>
                            ) : (
                              <><Plus className="w-3.5 h-3.5" /> Add to My Library</>
                            )}
                          </button>
                        ) : (
                          <div className="flex gap-2">
                            <button 
                              onClick={() => setSchedulingBook(book)}
                              className="flex-1 h-9 flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all active:scale-95 hover:opacity-80"
                              style={{ backgroundColor: '#8B691412', color: '#8B6914' }}
                              title="Schedule this book"
                            >
                              <Calendar className="w-3.5 h-3.5" />
                              Schedule
                            </button>
                            <button
                              onClick={async (e) => {
                                e.preventDefault();
                                try {
                                  const res = await fetch(`/api/books/${book.id}/download`);
                                  if (!res.ok) throw new Error();
                                  const { url } = await res.json();
                                  const a = document.createElement('a');
                                  a.href = url;
                                  a.download = `${book.title}.epub`;
                                  document.body.appendChild(a);
                                  a.click();
                                  a.remove();
                                } catch {
                                  toast.error('Failed to download book');
                                }
                              }}
                              className="flex-1 h-9 flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all active:scale-95 hover:opacity-80"
                              style={{ backgroundColor: '#8B691412', color: '#8B6914' }}
                              title="Download EPUB"
                            >
                              <Download className="w-3.5 h-3.5" />
                              Download
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
          )}
        </div>
      </div>

      {openMenuId && <div className="fixed inset-0 z-[5]" onClick={() => setOpenMenuId(null)} />}

      <AnimatePresence>
        {confirmBook && (
          <ConfirmDialog
            title="Delete Book"
            message={`"${confirmBook.title}" will be permanently deleted and removed from all users' libraries.`}
            confirmLabel="Delete"
            onConfirm={confirmDelete}
            onCancel={() => setConfirmBook(null)}
          />
        )}
      </AnimatePresence>
      {showUploadModal && <BookUploadModal onClose={() => { setShowUploadModal(false); router.refresh(); }} />}
      {showBulkUploadModal && <BulkUploadModal onClose={() => { setShowBulkUploadModal(false); router.refresh(); }} />}
      
      {schedulingBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSchedulingBook(null)} />
          <div className="relative z-10 w-full max-w-sm rounded-2xl border shadow-popover p-6"
            style={{ backgroundColor: 'var(--bg-card,#fff)', borderColor: 'var(--border)' }}>
            <h3 className="font-semibold text-lg mb-4 leading-snug" style={{ color: 'var(--text-primary)', fontFamily: 'Lora, Georgia, serif' }}>
              Schedule <br/><span className="text-[#8B6914]">{truncate(schedulingBook.title, 35)}</span>
            </h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const dateStr = (e.target as any).date.value;
              if (!dateStr) return;
              try {
                const res = await fetch('/api/schedules', { method: 'POST', body: JSON.stringify({ book_id: schedulingBook.id, scheduled_for: dateStr }) });
                if (res.ok) {
                  const newSchedule = await res.json();
                  const nextMap = new Map(scheduleMap);
                  nextMap.set(schedulingBook.id, newSchedule);
                  setScheduleMap(nextMap);
                  toast.success('Book scheduled!');
                  setSchedulingBook(null);
                } else throw new Error();
              } catch { toast.error('Failed to schedule book'); }
            }}>
              <label className="block text-sm mb-2 font-medium" style={{ color: 'var(--text-secondary)' }}>Select a date to start reading:</label>
              <DatePicker 
                name="date" 
                required 
                value={scheduleMap.get(schedulingBook.id)?.scheduled_for ? new Date(scheduleMap.get(schedulingBook.id)!.scheduled_for) : undefined}
                className="mb-5"
              />
              
              <div className="flex gap-3">
                {scheduleMap.has(schedulingBook.id) && (
                  <button type="button" onClick={async () => {
                      try {
                        const res = await fetch(`/api/schedules?book_id=${schedulingBook.id}`, { method: 'DELETE' });
                        if (!res.ok) throw new Error();
                        const nextMap = new Map(scheduleMap);
                        nextMap.delete(schedulingBook.id);
                        setScheduleMap(nextMap);
                        toast.success('Schedule removed');
                        setSchedulingBook(null);
                      } catch { toast.error('Failed to remove schedule'); }
                  }}
                    className="flex-1 py-2.5 rounded-lg text-sm border font-medium text-red-500 hover:bg-red-50 transition-colors"
                    style={{ borderColor: 'var(--border)' }}>
                    Remove
                  </button>
                )}
                <button type="button" onClick={() => setSchedulingBook(null)}
                  className={cn("flex-1 py-2.5 rounded-lg text-sm border font-medium transition-colors hover:bg-[var(--border)]", scheduleMap.has(schedulingBook.id) ? 'hidden' : 'block')}
                  style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                  Cancel
                </button>
                <button type="submit"
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90 shadow-sm"
                  style={{ backgroundColor: '#8B6914' }}>
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingBook && <BookEditModal book={editingBook} onClose={() => setEditingBook(null)} onSaved={updated => { setBooks(prev => prev.map(b => b.id === updated.id ? updated : b)); setEditingBook(null); }} />}
    </div>
  );
}
