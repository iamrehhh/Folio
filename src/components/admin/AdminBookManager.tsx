'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Search, BookOpen, Loader2, AlertCircle, Globe, Lock, UserCheck,
  Edit3, ChevronDown, Filter, Check, Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';
import BookAccessModal from './BookAccessModal';
import BulkBookAccessModal from './BulkBookAccessModal';
import BulkLanguageModal from './BulkLanguageModal';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import type { BookVisibility } from '@/types';

interface AdminBook {
  id: string;
  title: string;
  author: string;
  cover_url: string | null;
  genre: string | null;
  language: string | null;
  uploaded_by: string;
  visibility: BookVisibility;
  is_default: boolean;
  created_at: string;
  uploader_name: string;
  assigned_count: number;
}

type VisibilityFilter = 'all' | 'private' | 'public' | 'assigned';

const VISIBILITY_BADGE: Record<BookVisibility, {
  label: string;
  color: string;
  bg: string;
  icon: React.ElementType;
}> = {
  private: { label: 'Private', color: '#6B7280', bg: '#6B728015', icon: Lock },
  public: { label: 'Public', color: '#22C55E', bg: '#22C55E15', icon: Globe },
  assigned: { label: 'Assigned', color: '#3B82F6', bg: '#3B82F615', icon: UserCheck },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function AdminBookManager() {
  const [books, setBooks] = useState<AdminBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [visFilter, setVisFilter] = useState<VisibilityFilter>('all');
  const [accessModal, setAccessModal] = useState<{ bookId: string; title: string; visibility: BookVisibility } | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAccessModalOpen, setBulkAccessModalOpen] = useState(false);
  const [bulkLanguageModalOpen, setBulkLanguageModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadBooks();
  }, []);

  async function loadBooks() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/books');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setBooks(data.books ?? []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    return books.filter(b => {
      if (visFilter !== 'all' && b.visibility !== visFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q) ||
          b.uploader_name.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [books, search, visFilter]);

  const counts = useMemo(() => ({
    all: books.length,
    private: books.filter(b => b.visibility === 'private').length,
    public: books.filter(b => b.visibility === 'public').length,
    assigned: books.filter(b => b.visibility === 'assigned').length,
  }), [books]);

  function handleAccessSaved(bookId: string, visibility: BookVisibility, assignedCount: number) {
    setBooks(prev => prev.map(b =>
      b.id === bookId ? { ...b, visibility, assigned_count: assignedCount } : b
    ));
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelectedIds(new Set(filtered.map(b => b.id)));
  }

  function deselectAll() {
    setSelectedIds(new Set());
  }

  async function executeBulkDelete() {
    setDeleting(true);
    try {
      const res = await fetch('/api/admin/books', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookIds: Array.from(selectedIds) })
      });
      if (!res.ok) throw new Error('Failed to delete books');
      
      setBooks(prev => prev.filter(b => !selectedIds.has(b.id)));
      setSelectedIds(new Set());
      setDeleteModalOpen(false);
      toast.success('Books deleted successfully');
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20 gap-3">
      <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#8B6914' }} />
      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Loading books…</span>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center py-20 gap-3">
      <AlertCircle className="w-5 h-5 text-red-400" />
      <span className="text-sm text-red-500">{error}</span>
    </div>
  );

  const filterOptions: { value: VisibilityFilter; label: string }[] = [
    { value: 'all', label: `All (${counts.all})` },
    { value: 'public', label: `Public (${counts.public})` },
    { value: 'assigned', label: `Assigned (${counts.assigned})` },
    { value: 'private', label: `Private (${counts.private})` },
  ];

  return (
    <div>
      {/* Header + controls */}
      {selectedIds.size > 0 ? (
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between mb-5 px-4 py-3 rounded-xl"
          style={{ backgroundColor: '#8B691410', border: '1px solid #8B691430' }}
        >
          <div className="flex items-center gap-3">
            <button onClick={deselectAll} className="text-xs font-semibold uppercase tracking-wider hover:opacity-70 transition-opacity" style={{ color: '#8B6914' }}>
              Cancel
            </button>
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {selectedIds.size} Selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setBulkAccessModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border bg-white transition-all hover:shadow-sm"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            >
              <Edit3 className="w-3.5 h-3.5" />
              Manage Access
            </button>
            <button
              onClick={() => setBulkLanguageModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border bg-white transition-all hover:shadow-sm"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            >
              <Globe className="w-3.5 h-3.5" />
              Set Language
            </button>
            <button
              onClick={() => setDeleteModalOpen(true)}
              disabled={deleting}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border bg-white transition-all hover:shadow-sm"
              style={{ borderColor: 'var(--border)', color: '#EF4444' }}
            >
              {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              Delete
            </button>
          </div>
        </div>
      ) : (
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={selectAll}
            className="w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all hover:border-[#8B6914]"
            style={{ borderColor: 'var(--border)', backgroundColor: 'transparent' }}
          />
          <h2
            className="text-lg font-semibold"
            style={{ color: 'var(--text-primary)', fontFamily: 'Lora, Georgia, serif' }}
          >
            All Books ({filtered.length})
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
              style={{ color: 'var(--text-secondary)' }} />
            <input
              type="text"
              placeholder="Search books…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full sm:w-52 pl-9 pr-3 py-2 text-sm rounded-lg border outline-none"
              style={{ backgroundColor: 'var(--bg-card, #fff)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            />
          </div>

          {/* Filter dropdown */}
          <div className="relative">
            <button
              onClick={() => setFilterOpen(f => !f)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors"
              style={{
                borderColor: visFilter !== 'all' ? '#8B6914' : 'var(--border)',
                backgroundColor: visFilter !== 'all' ? '#8B691415' : 'var(--bg-card, #fff)',
                color: visFilter !== 'all' ? '#8B6914' : 'var(--text-secondary)',
              }}
            >
              <Filter className="w-3.5 h-3.5" />
              {visFilter === 'all' ? 'Filter' : visFilter.charAt(0).toUpperCase() + visFilter.slice(1)}
              <ChevronDown className="w-3 h-3" />
            </button>
            {filterOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setFilterOpen(false)} />
                <div
                  className="absolute right-0 top-10 w-44 rounded-lg border shadow-popover overflow-hidden z-20"
                  style={{ backgroundColor: 'var(--bg-card, #fff)', borderColor: 'var(--border)' }}
                >
                  {filterOptions.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => { setVisFilter(opt.value); setFilterOpen(false); }}
                      className="w-full text-left px-3 py-2.5 text-sm transition-colors hover:bg-[var(--border)]"
                      style={{
                        color: visFilter === opt.value ? '#8B6914' : 'var(--text-primary)',
                        fontWeight: visFilter === opt.value ? 600 : 400,
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      )}

      {/* Book list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 rounded-xl border" style={{ borderColor: 'var(--border)' }}>
          <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-20" style={{ color: 'var(--text-secondary)' }} />
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {books.length === 0 ? 'No books uploaded yet.' : 'No books match your filters.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(book => {
            const badge = VISIBILITY_BADGE[book.visibility];
            const BadgeIcon = badge.icon;

            return (
              <div
                key={book.id}
                className="flex items-center gap-4 p-4 rounded-xl border transition-shadow hover:shadow-soft"
                style={{
                  backgroundColor: selectedIds.has(book.id) ? '#8B691405' : 'var(--bg-card, #fff)',
                  borderColor: selectedIds.has(book.id) ? '#8B691450' : 'var(--border)'
                }}
              >
                {/* Checkbox */}
                <button
                  onClick={() => toggleSelect(book.id)}
                  className="w-5 h-5 rounded-md border-2 flex items-center justify-center flex-none transition-all duration-150"
                  style={{
                    borderColor: selectedIds.has(book.id) ? '#8B6914' : 'var(--border)',
                    backgroundColor: selectedIds.has(book.id) ? '#8B6914' : 'transparent',
                  }}
                >
                  {selectedIds.has(book.id) && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                </button>

                {/* Cover thumbnail */}
                <div className="w-11 h-16 rounded-lg overflow-hidden flex-none bg-[#E5E0D8] flex items-center justify-center">
                  {book.cover_url ? (
                    <img src={book.cover_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <BookOpen className="w-4 h-4 opacity-25" style={{ color: 'var(--text-secondary)' }} />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                      {book.title}
                    </h3>
                    {/* Visibility badge */}
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide flex-none"
                      style={{ backgroundColor: badge.bg, color: badge.color }}
                    >
                      <BadgeIcon className="w-3 h-3" />
                      {badge.label}
                      {book.visibility === 'assigned' && book.assigned_count > 0 && (
                        <span className="ml-0.5">· {book.assigned_count}</span>
                      )}
                    </span>
                  </div>
                  <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-secondary)' }}>
                    {book.author}
                    {book.genre && <span> · {book.genre}</span>}
                    {book.language && <span> · {book.language}</span>}
                    <span className="mx-1">·</span>
                    <span>by {book.uploader_name}</span>
                  </p>
                  <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted, var(--text-secondary))' }}>
                    Uploaded {formatDate(book.created_at)}
                  </p>
                </div>

                {/* Actions */}
                <button
                  onClick={() => setAccessModal({
                    bookId: book.id,
                    title: book.title,
                    visibility: book.visibility,
                  })}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-all hover:shadow-sm hover:border-[#8B6914] hover:text-[#8B6914]"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Manage Access</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Access modal */}
      {accessModal && (
        <BookAccessModal
          bookId={accessModal.bookId}
          bookTitle={accessModal.title}
          currentVisibility={accessModal.visibility}
          onClose={() => setAccessModal(null)}
          onSaved={(vis, count) => {
            handleAccessSaved(accessModal.bookId, vis, count);
            setAccessModal(null);
          }}
        />
      )}

      {/* Bulk access modal */}
      {bulkAccessModalOpen && (
        <BulkBookAccessModal
          bookIds={Array.from(selectedIds)}
          onClose={() => setBulkAccessModalOpen(false)}
          onSaved={() => {
            setBulkAccessModalOpen(false);
            setSelectedIds(new Set());
            loadBooks(); // Reload list to reflect new visibilities/assignments
          }}
        />
      )}

      {/* Bulk language modal */}
      {bulkLanguageModalOpen && (
        <BulkLanguageModal
          bookIds={Array.from(selectedIds)}
          onClose={() => setBulkLanguageModalOpen(false)}
          onSaved={() => {
            setBulkLanguageModalOpen(false);
            setSelectedIds(new Set());
            loadBooks(); // Reload list to reflect new languages
          }}
        />
      )}

      {/* Confirm delete modal */}
      {deleteModalOpen && (
        <ConfirmDeleteModal
          count={selectedIds.size}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={executeBulkDelete}
          isDeleting={deleting}
        />
      )}
    </div>
  );
}
