'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Plus, Search, Pin, FileText,
  BookOpen, Languages, Zap, Lock
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { VaultEntry, VaultCategory } from '@/types';
import VaultEntryCard from './VaultEntryCard';
import VaultCreateModal from './VaultCreateModal';

interface VaultClientProps {
  initialEntries: VaultEntry[];
}

const CATEGORY_TABS: { key: VaultCategory | 'all'; label: string; icon: React.ElementType }[] = [
  { key: 'all', label: 'All', icon: Lock },
  { key: 'note', label: 'Notes', icon: FileText },
  { key: 'reading_list', label: 'Reading List', icon: BookOpen },
  { key: 'vocabulary', label: 'Vocabulary', icon: Languages },
  { key: 'quick_capture', label: 'Captures', icon: Zap },
];

const EMPTY_STATES: Record<string, { icon: React.ElementType; message: string }> = {
  all: { icon: Lock, message: 'Your vault is empty. Start adding notes, reading lists, and more.' },
  note: { icon: FileText, message: 'No notes yet. Write down your thoughts.' },
  reading_list: { icon: BookOpen, message: 'No books in your reading list yet.' },
  vocabulary: { icon: Languages, message: 'No vocabulary saved yet. Start building your word bank.' },
  quick_capture: { icon: Zap, message: 'No quick captures yet. Jot down anything on your mind.' },
};

export default function VaultClient({ initialEntries }: VaultClientProps) {
  const [entries, setEntries] = useState<VaultEntry[]>(initialEntries);
  const [activeTab, setActiveTab] = useState<VaultCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<VaultEntry | null>(null);

  // Category counts
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: entries.length };
    for (const e of entries) {
      c[e.category] = (c[e.category] || 0) + 1;
    }
    return c;
  }, [entries]);

  // Filtered entries
  const filteredEntries = useMemo(() => {
    let result = entries;

    if (activeTab !== 'all') {
      result = result.filter(e => e.category === activeTab);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(e =>
        (e.title?.toLowerCase().includes(q)) ||
        e.content.toLowerCase().includes(q)
      );
    }

    // Pinned first, then by updated_at
    return result.sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
  }, [entries, activeTab, searchQuery]);

  // --- CRUD Handlers ---

  const handleCreate = async (data: { category: VaultCategory; title?: string; content: string; color?: string }) => {
    try {
      const res = await fetch('/api/vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error('Failed to create entry');

      const { entry } = await res.json();
      setEntries(prev => [entry, ...prev]);
      toast.success('Entry added to vault');
      setShowCreateModal(false);
    } catch {
      toast.error('Failed to save entry');
    }
  };

  const handleUpdate = async (id: string, data: Partial<VaultEntry>) => {
    try {
      const res = await fetch(`/api/vault/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error('Failed to update entry');

      const { entry } = await res.json();
      setEntries(prev => prev.map(e => e.id === id ? entry : e));

      if (editingEntry?.id === id) setEditingEntry(null);
    } catch {
      toast.error('Failed to update entry');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/vault/${id}`, { method: 'DELETE' });

      if (!res.ok) throw new Error('Failed to delete entry');

      setEntries(prev => prev.filter(e => e.id !== id));
      toast.success('Entry removed');
    } catch {
      toast.error('Failed to delete entry');
    }
  };

  const handleTogglePin = async (entry: VaultEntry) => {
    await handleUpdate(entry.id, { is_pinned: !entry.is_pinned } as any);
  };

  const handleEdit = (entry: VaultEntry) => {
    setEditingEntry(entry);
    setShowCreateModal(true);
  };

  const handleSaveEdit = async (data: { category: VaultCategory; title?: string; content: string; color?: string }) => {
    if (!editingEntry) return;
    await handleUpdate(editingEntry.id, data as any);
    setShowCreateModal(false);
    setEditingEntry(null);
    toast.success('Entry updated');
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setEditingEntry(null);
  };

  const emptyState = EMPTY_STATES[activeTab] || EMPTY_STATES.all;
  const EmptyIcon = emptyState.icon;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 md:py-12 animate-page-enter">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/profile"
            className="p-2 rounded-lg transition-colors hover:bg-[var(--border)]"
            style={{ color: 'var(--text-secondary)' }}
            title="Back to Profile"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-serif tracking-tight" style={{ color: '#1C1C1E', fontFamily: 'Lora, Georgia, serif' }}>
              Personal Vault
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              Your private space for notes, ideas & more
            </p>
          </div>
        </div>
        <button
          onClick={() => { setEditingEntry(null); setShowCreateModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-white transition-all hover:opacity-90 hover:shadow-md active:scale-[0.97]"
          style={{ backgroundColor: '#8B6914' }}
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Entry</span>
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 mb-6 scrollbar-hide -mx-1 px-1">
        {CATEGORY_TABS.map(({ key, label, icon: Icon }) => {
          const isActive = activeTab === key;
          const count = counts[key] || 0;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`
                flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium whitespace-nowrap
                transition-all duration-200 shrink-0
                ${isActive
                  ? 'text-white shadow-sm'
                  : 'hover:bg-[var(--border)]'
                }
              `}
              style={isActive
                ? { backgroundColor: '#8B6914', color: '#fff' }
                : { color: 'var(--text-secondary)' }
              }
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
              {count > 0 && (
                <span
                  className={`
                    ml-0.5 text-xs px-1.5 py-0.5 rounded-full font-semibold
                    ${isActive ? 'bg-white/20 text-white' : 'bg-[var(--border)] text-[var(--text-secondary)]'}
                  `}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search entries..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm bg-white focus:outline-none focus:ring-2 transition-shadow"
          style={{
            borderColor: 'var(--border)',
            color: 'var(--text-primary)',
            '--tw-ring-color': 'rgba(139, 105, 20, 0.25)',
          } as any}
        />
      </div>

      {/* Entries Grid */}
      {filteredEntries.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEntries.map((entry, i) => (
            <div
              key={entry.id}
              className="animate-float-up"
              style={{ animationDelay: `${Math.min(i * 40, 300)}ms`, animationFillMode: 'both' }}
            >
              <VaultEntryCard
                entry={entry}
                onEdit={() => handleEdit(entry)}
                onDelete={() => handleDelete(entry.id)}
                onTogglePin={() => handleTogglePin(entry)}
                onColorChange={(color) => handleUpdate(entry.id, { color } as any)}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ backgroundColor: 'var(--bg-sidebar)' }}
          >
            <EmptyIcon className="w-7 h-7" style={{ color: 'var(--text-muted)' }} />
          </div>
          <p className="text-base font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
            {searchQuery ? 'No matching entries' : 'Nothing here yet'}
          </p>
          <p className="text-sm max-w-xs" style={{ color: 'var(--text-secondary)' }}>
            {searchQuery
              ? 'Try a different search term.'
              : emptyState.message
            }
          </p>
          {!searchQuery && (
            <button
              onClick={() => { setEditingEntry(null); setShowCreateModal(true); }}
              className="mt-6 flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-white transition-all hover:opacity-90"
              style={{ backgroundColor: '#8B6914' }}
            >
              <Plus className="w-4 h-4" />
              Add your first entry
            </button>
          )}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showCreateModal && (
        <VaultCreateModal
          onClose={handleCloseModal}
          onSave={editingEntry ? handleSaveEdit : handleCreate}
          editingEntry={editingEntry}
          defaultCategory={activeTab !== 'all' ? activeTab : undefined}
        />
      )}
    </div>
  );
}
