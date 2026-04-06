'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Search, BookOpen, Upload, MoreVertical, Pencil, Trash2, SlidersHorizontal, X, Calendar, Star } from 'lucide-react';
import { cn, truncate } from '@/lib/utils';
import type { Book, BookSchedule } from '@/types';
import BookUploadModal from './BookUploadModal';
import BookEditModal from './BookEditModal';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

type FilterTab = 'all' | 'unread' | 'reading' | 'completed' | 'scheduled';
interface ProgressInfo { progress_percent: number; last_read_at: string; chapter_title?: string; }
interface Props { books: Book[]; progressMap: Map<string, ProgressInfo>; scheduleMap: Map<string, BookSchedule>; ratingsMap?: Map<string, number>; userId: string; isAdmin: boolean; }

const GENRES = ['All', 'Fiction', 'Non-Fiction', 'Science', 'History', 'Biography', 'Philosophy', 'Fantasy', 'Mystery', 'Romance', 'Other'];

export default function LibraryClient({ books: initialBooks, progressMap, scheduleMap: initialScheduleMap, ratingsMap = new Map(), userId, isAdmin }: Props) {
  const router = useRouter();
  const [books, setBooks] = useState(initialBooks);
  const [scheduleMap, setScheduleMap] = useState<Map<string, BookSchedule>>(initialScheduleMap ?? new Map());
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [schedulingBook, setSchedulingBook] = useState<Book | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [confirmBook, setConfirmBook] = useState<Book | null>(null);

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

  const filtered = useMemo(() => books.filter((book) => {
    const pct = progressMap.get(book.id)?.progress_percent ?? 0;
    const isScheduled = scheduleMap.has(book.id);
    if (activeTab === 'unread' && pct > 0) return false;
    if (activeTab === 'reading' && (pct === 0 || pct >= 100)) return false;
    if (activeTab === 'completed' && pct < 100) return false;
    if (activeTab === 'scheduled' && !isScheduled) return false;
    if (selectedGenre !== 'All' && !(book.genre ?? '').split(',').map(g => g.trim()).includes(selectedGenre)) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return book.title.toLowerCase().includes(q) || book.author.toLowerCase().includes(q);
    }
    return true;
  }), [books, progressMap, scheduleMap, activeTab, selectedGenre, searchQuery]);

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

      {/* ── Genre Sidebar — desktop only ── */}
      <aside className="hidden md:block w-48 flex-none border-r p-4 overflow-y-auto"
        style={{ backgroundColor: 'var(--bg-sidebar)', borderColor: 'var(--border)' }}>
        <p className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: 'var(--text-secondary)' }}>
          Genre
        </p>
        <div className="space-y-0.5">
          {GENRES.map(genre => (
            <button key={genre} onClick={() => setSelectedGenre(genre)}
              className={cn('w-full text-left px-3 py-2 rounded text-sm transition-colors',
                selectedGenre === genre ? 'font-medium' : 'hover:bg-[var(--border)]')}
              style={selectedGenre === genre
                ? { backgroundColor: '#8B691420', color: '#8B6914' }
                : { color: 'var(--text-secondary)' }}>
              {genre}
            </button>
          ))}
        </div>
      </aside>

      {/* ── Mobile filter drawer ── */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowMobileFilters(false)} />
          <div className="absolute bottom-0 left-0 right-0 rounded-t-2xl p-5"
            style={{ backgroundColor: 'var(--bg-sidebar)' }}>
            <div className="flex items-center justify-between mb-4">
              <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Filter by Genre</p>
              <button onClick={() => setShowMobileFilters(false)}>
                <X className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {GENRES.map(genre => (
                <button key={genre} onClick={() => { setSelectedGenre(genre); setShowMobileFilters(false); }}
                  className="px-3 py-2 rounded-lg text-sm transition-colors text-center"
                  style={selectedGenre === genre
                    ? { backgroundColor: '#8B6914', color: '#fff' }
                    : { backgroundColor: 'var(--border)', color: 'var(--text-primary)' }}>
                  {genre}
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

          {/* Search */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
              style={{ color: 'var(--text-secondary)' }} />
            <input type="text" placeholder="Search books…" value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border outline-none"
              style={{ backgroundColor: 'var(--bg-card,#fff)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
          </div>

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

            {/* Add Book */}
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
          {filtered.length === 0 ? (
            <div className="text-center py-20">
              <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-20" style={{ color: 'var(--text-secondary)' }} />
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>No books found</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                {books.length === 0 ? 'Upload your first EPUB to get started.' : 'Try adjusting your filters.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-5 md:gap-8">
              {filtered.map(book => {
                const pct = Math.round(progressMap.get(book.id)?.progress_percent ?? 0);
                const isUnread = pct === 0;
                const isCompleted = pct >= 100;
                const menuOpen = openMenuId === book.id;

                return (
                  <div key={book.id}
                    className="group flex flex-col rounded-xl border overflow-hidden transition-all duration-200 hover:shadow-soft-lg"
                    style={{ backgroundColor: 'var(--bg-card,#fff)', borderColor: 'var(--border)' }}>

                    {/* Cover */}
                    <div className="w-full aspect-[2/3] bg-[#E5E0D8] flex items-center justify-center overflow-hidden relative">
                      {book.cover_url
                        ? <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover object-top" />
                        : <BookOpen className="w-8 h-8 opacity-25" style={{ color: 'var(--text-secondary)' }} />
                      }
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

                      {/* ⋮ menu */}
                      {book.uploaded_by === userId && (
                        <div className="absolute top-2 right-2">
                          <button
                            onClick={e => { e.preventDefault(); setOpenMenuId(menuOpen ? null : book.id); }}
                            className="w-7 h-7 rounded-full flex items-center justify-center transition-opacity md:opacity-0 md:group-hover:opacity-100 opacity-100"
                            style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}>
                            <MoreVertical className="w-4 h-4 text-white" />
                          </button>
                          {menuOpen && (
                            <div className="absolute right-0 top-8 w-36 rounded-lg border shadow-popover overflow-hidden z-20"
                              style={{ backgroundColor: 'var(--bg-card,#fff)', borderColor: 'var(--border)' }}>
                              <button
                                onClick={e => { e.preventDefault(); e.stopPropagation(); setEditingBook(book); setOpenMenuId(null); }}
                                className="w-full flex items-center gap-2 px-3 py-3 text-sm hover:bg-[var(--border)] transition-colors"
                                style={{ color: 'var(--text-primary)' }}>
                                <Pencil className="w-3.5 h-3.5" /> Edit book
                              </button>
                              <button
                                onClick={e => { e.preventDefault(); e.stopPropagation(); handleDelete(book); }}
                                className="w-full flex items-center gap-2 px-3 py-3 text-sm hover:bg-red-50 transition-colors text-red-500">
                                <Trash2 className="w-3.5 h-3.5" /> Delete book
                              </button>
                            </div>
                          )}
                        </div>
                      )}
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
                      {ratingsMap.has(book.id) && (
                        <div className="flex items-center gap-0.5 mt-1.5 pt-0.5">
                          {Array.from({ length: ratingsMap.get(book.id)! }).map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5" style={{ color: '#8B6914', fill: '#8B6914' }} />
                          ))}
                        </div>
                      )}
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
                      <div className="mt-auto pt-2 flex gap-2">
                        <Link href={`/read/${book.id}`}
                          className="flex-1 block text-center py-2.5 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
                          style={{ backgroundColor: '#8B6914' }}>
                          {isUnread ? 'Start' : isCompleted ? 'Again' : 'Continue'}
                        </Link>
                        <button 
                          onClick={() => setSchedulingBook(book)}
                          className="w-10 h-10 flex items-center justify-center rounded-lg border transition-colors hover:bg-[var(--border)]"
                          style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                          title="Schedule this book"
                        >
                          <Calendar className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {openMenuId && <div className="fixed inset-0 z-[5]" onClick={() => setOpenMenuId(null)} />}

      {confirmBook && (
        <ConfirmDialog
          title="Delete Book"
          message={`"${confirmBook.title}" will be permanently deleted and removed from all users' libraries.`}
          confirmLabel="Delete"
          onConfirm={confirmDelete}
          onCancel={() => setConfirmBook(null)}
        />
      )}
      {showUploadModal && <BookUploadModal onClose={() => { setShowUploadModal(false); router.refresh(); }} />}
      
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
              <input type="date" name="date" required 
                     defaultValue={scheduleMap.get(schedulingBook.id)?.scheduled_for || ''}
                     className="w-full px-3 py-2 rounded-lg border mb-5 outline-none" 
                     style={{ backgroundColor: 'transparent', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
              
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
