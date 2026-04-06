'use client';

import { useState, useEffect } from 'react';
import { X, Search, Check, Loader2, Users, Globe, Lock, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import type { BookVisibility } from '@/types';

interface UserEntry {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  assigned: boolean;
}

interface Props {
  bookId: string;
  bookTitle: string;
  currentVisibility: BookVisibility;
  onClose: () => void;
  onSaved: (visibility: BookVisibility, assignedCount: number) => void;
}

const VISIBILITY_OPTIONS: {
  value: BookVisibility;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}[] = [
  {
    value: 'private',
    label: 'Private',
    description: 'Only you can see this book',
    icon: Lock,
    color: '#6B7280',
    bgColor: '#6B728015',
  },
  {
    value: 'public',
    label: 'Public',
    description: 'Visible to all users',
    icon: Globe,
    color: '#22C55E',
    bgColor: '#22C55E15',
  },
  {
    value: 'assigned',
    label: 'Assigned',
    description: 'Only selected users can see it',
    icon: UserCheck,
    color: '#3B82F6',
    bgColor: '#3B82F615',
  },
];

export default function BookAccessModal({ bookId, bookTitle, currentVisibility, onClose, onSaved }: Props) {
  const [visibility, setVisibility] = useState<BookVisibility>(currentVisibility);
  const [users, setUsers] = useState<UserEntry[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/books/${bookId}/access`)
      .then(r => r.json())
      .then(d => {
        setUsers(d.users ?? []);
        const assigned = (d.users ?? []).filter((u: UserEntry) => u.assigned).map((u: UserEntry) => u.id);
        setSelectedIds(new Set(assigned));
      })
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false));
  }, [bookId]);

  function toggleUser(userId: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  }

  function selectAll() {
    const filtered = getFilteredUsers();
    setSelectedIds(prev => {
      const next = new Set(prev);
      filtered.forEach(u => next.add(u.id));
      return next;
    });
  }

  function deselectAll() {
    const filtered = getFilteredUsers();
    setSelectedIds(prev => {
      const next = new Set(prev);
      filtered.forEach(u => next.delete(u.id));
      return next;
    });
  }

  function getFilteredUsers() {
    if (!search) return users;
    const q = search.toLowerCase();
    return users.filter(u =>
      (u.full_name ?? '').toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  }

  async function handleSave() {
    setSaving(true);
    try {
      // Update visibility
      const visRes = await fetch('/api/admin/books', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId, visibility }),
      });
      if (!visRes.ok) throw new Error('Failed to update visibility');

      // If assigned, update user list
      if (visibility === 'assigned') {
        const accessRes = await fetch(`/api/admin/books/${bookId}/access`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userIds: Array.from(selectedIds) }),
        });
        if (!accessRes.ok) throw new Error('Failed to update assignments');
      }

      toast.success('Access settings saved');
      onSaved(visibility, visibility === 'assigned' ? selectedIds.size : 0);
      onClose();
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  const filteredUsers = getFilteredUsers();
  const allFilteredSelected = filteredUsers.length > 0 && filteredUsers.every(u => selectedIds.has(u.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative z-10 w-full max-w-lg rounded-2xl border shadow-popover overflow-hidden"
        style={{ backgroundColor: 'var(--bg-card, #fff)', borderColor: 'var(--border)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="min-w-0">
            <h3 className="font-semibold text-base" style={{ color: 'var(--text-primary)', fontFamily: 'Lora, Georgia, serif' }}>
              Manage Access
            </h3>
            <p className="text-sm truncate mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              {bookTitle}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--border)] transition-colors flex-none">
            <X className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>

        {/* Visibility selector */}
        <div className="px-6 pt-5 pb-4">
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-secondary)' }}>
            Visibility
          </p>
          <div className="grid grid-cols-3 gap-2">
            {VISIBILITY_OPTIONS.map(opt => {
              const active = visibility === opt.value;
              const Icon = opt.icon;
              return (
                <button
                  key={opt.value}
                  onClick={() => setVisibility(opt.value)}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200"
                  style={{
                    borderColor: active ? opt.color : 'var(--border)',
                    backgroundColor: active ? opt.bgColor : 'transparent',
                    transform: active ? 'scale(1.02)' : 'scale(1)',
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
                    style={{ backgroundColor: active ? `${opt.color}20` : 'var(--border)' }}
                  >
                    <Icon className="w-4.5 h-4.5" style={{ color: active ? opt.color : 'var(--text-secondary)' }} />
                  </div>
                  <span
                    className="text-sm font-medium"
                    style={{ color: active ? opt.color : 'var(--text-primary)' }}
                  >
                    {opt.label}
                  </span>
                  <span className="text-[10px] text-center leading-tight" style={{ color: 'var(--text-secondary)' }}>
                    {opt.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* User assignment — only for 'assigned' */}
        {visibility === 'assigned' && (
          <div className="px-6 pb-4">
            <div className="border-t pt-4" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Assign to Users
                  {selectedIds.size > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: '#3B82F6' }}>
                      {selectedIds.size}
                    </span>
                  )}
                </p>
                <button
                  onClick={allFilteredSelected ? deselectAll : selectAll}
                  className="text-xs font-medium px-2 py-1 rounded-md hover:bg-[var(--border)] transition-colors"
                  style={{ color: '#3B82F6' }}
                >
                  {allFilteredSelected ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              {/* Search */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
                  style={{ color: 'var(--text-secondary)' }} />
                <input
                  type="text"
                  placeholder="Search users…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border outline-none"
                  style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                />
              </div>

              {/* User list */}
              <div className="max-h-56 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#3B82F6' }} />
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-6">
                    <Users className="w-6 h-6 mx-auto mb-2 opacity-20" style={{ color: 'var(--text-secondary)' }} />
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {search ? 'No users match your search.' : 'No users found.'}
                    </p>
                  </div>
                ) : (
                  filteredUsers.map(user => {
                    const selected = selectedIds.has(user.id);
                    const initials = user.full_name
                      ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                      : user.email[0].toUpperCase();

                    return (
                      <button
                        key={user.id}
                        onClick={() => toggleUser(user.id)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 text-left"
                        style={{
                          backgroundColor: selected ? '#3B82F610' : 'transparent',
                        }}
                      >
                        {/* Checkbox */}
                        <div
                          className="w-5 h-5 rounded-md border-2 flex items-center justify-center flex-none transition-all duration-150"
                          style={{
                            borderColor: selected ? '#3B82F6' : 'var(--border)',
                            backgroundColor: selected ? '#3B82F6' : 'transparent',
                          }}
                        >
                          {selected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                        </div>

                        {/* Avatar */}
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover flex-none" />
                        ) : (
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-none"
                            style={{ backgroundColor: '#8B6914' }}>
                            {initials}
                          </div>
                        )}

                        {/* Name + email */}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                            {user.full_name ?? '(no name)'}
                          </p>
                          <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                            {user.email}
                          </p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t flex gap-3 justify-end" style={{ borderColor: 'var(--border)' }}>
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors hover:bg-[var(--border)]"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || (visibility === 'assigned' && selectedIds.size === 0)}
            className="px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            style={{ backgroundColor: '#8B6914' }}
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
