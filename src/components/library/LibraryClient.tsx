'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, BookOpen, Upload, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { cn, truncate } from '@/lib/utils';
import type { Book } from '@/types';
import BookUploadModal from './BookUploadModal';
import BookEditModal from './BookEditModal';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

type FilterTab = 'all' | 'unread' | 'reading' | 'completed';

interface ProgressInfo {
  progress_percent: number;
  last_read_at: string;
  chapter_title?: string;
}

interface Props {
  books: Book[];
  progressMap: Map<string, ProgressInfo>;
  userId: string;
}

const GENRES = ['All', 'Fiction', 'Non-Fiction', 'Science', 'History', 'Biography', 'Self-Help', 'Fantasy', 'Mystery', 'Romance', 'Other'];

export default function LibraryClient({ books: initialBooks, progressMap, userId }: Props) {
  const router = useRouter();
  const [books, setBooks] = useState(initialBooks);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return books.filter((book) => {
      const progress = progressMap.get(book.id);
      const pct = progress?.progress_percent ?? 0;
      if (activeTab === 'unread' && pct > 0) return false;
      if (activeTab === 'reading' && (pct === 0 || pct >= 100)) return false;
      if (activeTab === 'completed' && pct < 100) return false;
      if (selectedGenre !== 'All' && book.genre !== selectedGenre) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return book.title.toLowerCase().includes(q) || book.author.toLowerCase().includes(q);
      }
      return true;
    });
  }, [books, progressMap, activeTab, selectedGenre, searchQuery]);

  async function handleDelete(book: Book) {
    if (!confirm(`Delete "${book.title}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/books/${book.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setBooks((prev) => prev.filter((b) => b.id !== book.id));
      setOpenMenuId(null);
      toast.success(`"${book.title}" deleted`);
    } catch {
      toast.error('Failed to delete book');
    }
  }

  function handleBookUpdated(updated: Book) {
    setBooks((prev) => prev.map((b) => b.id === updated.id ? updated : b));
    setEditingBook(null);
  }

  const tabs: { id: FilterTab; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'reading', label: 'In Progress' },
    { id: 'unread', label: 'Unread' },
    { id: 'completed', label: 'Completed' },
  ];

  return (
    <div className="flex h-[calc(100vh-3.5rem)]" style={{ backgroundColor: 'var(--bg)' }}>
      {/* Genre Sidebar */}
      <aside
        className="w-48 flex-none border-r p-4 overflow-y-auto"
        style={{ backgroundColor: 'var(--bg-sidebar)', borderColor: 'var(--border)' }}
      >
        <p className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: 'var(--text-secondary)' }}>
          Genre
        </p>
        <div className="space-y-0.5">
          {GENRES.map((genre) => (
            <button
              key={genre}
              onClick={() => setSelectedGenre(genre)}
              className={cn('w-full text-left px-3 py-2 rounded text-sm transition-colors',
                selectedGenre === genre ? 'font-medium' : 'hover:bg-[var(--border)]'
              )}
              style={
                selectedGenre === genre
                  ? { backgroundColor: '#8B691420', color: '#8B6914' }
                  : { color: 'var(--text-secondary)' }
              }
            >
              {genre}
            </button>
          ))}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="px-8 py-4 border-b flex items-center justify-between gap-4"
          style={{ borderColor: 'var(--border)' }}>
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
              style={{ color: 'var(--text-secondary)' }} />
            <input
              type="text"
              placeholder="Search books…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border outline-none"
              style={{ backgroundColor: 'var(--bg-card,#fff)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            />
          </div>

          <div className="flex items-center gap-1">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={cn('px-3 py-1.5 rounded text-sm font-medium transition-colors',
                  activeTab === tab.id ? 'text-white' : 'hover:bg-[var(--border)]'
                )}
                style={activeTab === tab.id
                  ? { backgroundColor: '#8B6914', color: '#fff' }
                  : { color: 'var(--text-secondary)' }
                }
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#8B6914' }}
          >
            <Upload className="w-4 h-4" />
            Add Book
          </button>
        </div>

        {/* Book grid */}
        <div className="flex-1 overflow-y-auto p-8">
          {filtered.length === 0 ? (
            <div className="text-center py-20">
              <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-20" style={{ color: 'var(--text-secondary)' }} />
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>No books found</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                {books.length === 0 ? 'Upload your first EPUB to get started.' : 'Try adjusting your filters.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-6">
              {filtered.map((book) => {
                const progress = progressMap.get(book.id);
                const pct = Math.round(progress?.progress_percent ?? 0);
                const isUnread = pct === 0;
                const isCompleted = pct >= 100;
                const menuOpen = openMenuId === book.id;

                return (
                  <div
                    key={book.id}
                    className="group flex flex-col rounded-xl border overflow-hidden transition-shadow hover:shadow-soft-lg"
                    style={{ backgroundColor: 'var(--bg-card,#fff)', borderColor: 'var(--border)' }}
                  >
                    {/* Cover */}
                    <div className="w-full aspect-[2/3] bg-[#E5E0D8] flex items-center justify-center overflow-hidden relative">
                      {book.cover_url ? (
                        <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
                      ) : (
                        <BookOpen className="w-10 h-10 opacity-25" style={{ color: 'var(--text-secondary)' }} />
                      )}
                      {book.genre && (
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-xs font-medium"
                          style={{ backgroundColor: 'rgba(0,0,0,0.5)', color: '#fff' }}>
                          {book.genre}
                        </span>
                      )}

                      {/* ⋮ Menu button — appears on hover */}
                      <div className="absolute top-2 right-2">
                        <button
                          onClick={(e) => { e.preventDefault(); setOpenMenuId(menuOpen ? null : book.id); }}
                          className="w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
                        >
                          <MoreVertical className="w-4 h-4 text-white" />
                        </button>

                        {/* Dropdown menu */}
                        {menuOpen && (
                          <div
                            className="absolute right-0 top-8 w-36 rounded-lg border shadow-popover overflow-hidden z-20"
                            style={{ backgroundColor: 'var(--bg-card,#fff)', borderColor: 'var(--border)' }}
                          >
                            <button
                              onClick={(e) => { e.preventDefault(); setEditingBook(book); setOpenMenuId(null); }}
                              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-[var(--border)] transition-colors"
                              style={{ color: 'var(--text-primary)' }}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              Edit book
                            </button>
                            <button
                              onClick={(e) => { e.preventDefault(); handleDelete(book); }}
                              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-red-50 transition-colors text-red-500"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete book
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex flex-col flex-1 p-4">
                      <h3 className="font-medium text-sm leading-snug"
                        style={{ fontFamily: 'Lora, Georgia, serif', color: 'var(--text-primary)' }}
                        title={book.title}>
                        {truncate(book.title, 40)}
                      </h3>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                        {book.author}
                      </p>

                      {!isUnread && (
                        <div className="mt-3">
                          <div className="w-full h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border)' }}>
                            <div className="h-full rounded-full"
                              style={{ width: `${pct}%`, backgroundColor: isCompleted ? '#4CAF50' : '#8B6914' }} />
                          </div>
                          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                            {isCompleted ? '✓ Completed' : `${pct}%`}
                          </p>
                        </div>
                      )}

                      <div className="mt-auto pt-3">
                        <Link
                          href={`/read/${book.id}`}
                          className="block w-full text-center py-2 rounded text-sm font-medium text-white transition-opacity hover:opacity-90"
                          style={{ backgroundColor: '#8B6914' }}
                        >
                          {isUnread ? 'Start Reading' : isCompleted ? 'Read Again' : 'Continue'}
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close menu */}
      {openMenuId && (
        <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
      )}

      {showUploadModal && (
        <BookUploadModal onClose={() => { setShowUploadModal(false); router.refresh(); }} />
      )}

      {editingBook && (
        <BookEditModal
          book={editingBook}
          onClose={() => setEditingBook(null)}
          onSaved={handleBookUpdated}
        />
      )}
    </div>
  );
}
