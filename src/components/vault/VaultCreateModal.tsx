'use client';

import { useState, useEffect, useRef } from 'react';
import {
  X, FileText, BookOpen, Languages, Zap
} from 'lucide-react';
import type { VaultEntry, VaultCategory, VaultColor } from '@/types';

interface VaultCreateModalProps {
  onClose: () => void;
  onSave: (data: { category: VaultCategory; title?: string; content: string; color?: string }) => Promise<void>;
  editingEntry: VaultEntry | null;
}

const CATEGORY_OPTIONS: { key: VaultCategory; label: string; icon: React.ElementType }[] = [
  { key: 'note', label: 'Note', icon: FileText },
  { key: 'reading_list', label: 'Reading List', icon: BookOpen },
  { key: 'vocabulary', label: 'Vocabulary', icon: Languages },
  { key: 'quick_capture', label: 'Quick Capture', icon: Zap },
];

const COLOR_OPTIONS: { key: VaultColor; color: string; label: string }[] = [
  { key: 'default', color: '#E5E0D8', label: 'Default' },
  { key: 'amber', color: '#F59E0B', label: 'Amber' },
  { key: 'sage', color: '#22C55E', label: 'Sage' },
  { key: 'sky', color: '#3B82F6', label: 'Sky' },
  { key: 'rose', color: '#F43F5E', label: 'Rose' },
  { key: 'lavender', color: '#8B5CF6', label: 'Lavender' },
];

const PLACEHOLDERS: Record<VaultCategory, string> = {
  note: 'Write your thoughts...',
  reading_list: 'e.g. Sapiens by Yuval Noah Harari — A book about human history that changed my perspective...',
  vocabulary: 'e.g. Ephemeral — lasting for a very short time. "The ephemeral beauty of cherry blossoms."',
  quick_capture: 'Jot something down...',
};

export default function VaultCreateModal({ onClose, onSave, editingEntry }: VaultCreateModalProps) {
  const [category, setCategory] = useState<VaultCategory>(editingEntry?.category || 'note');
  const [title, setTitle] = useState(editingEntry?.title || '');
  const [content, setContent] = useState(editingEntry?.content || '');
  const [color, setColor] = useState<VaultColor>(editingEntry?.color || 'default');
  const [isSaving, setIsSaving] = useState(false);

  const contentRef = useRef<HTMLTextAreaElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Auto-focus content area
  useEffect(() => {
    setTimeout(() => contentRef.current?.focus(), 100);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Auto-resize textarea
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.style.height = 'auto';
      contentRef.current.style.height = Math.max(contentRef.current.scrollHeight, 120) + 'px';
    }
  }, [content]);

  const handleSubmit = async () => {
    if (!content.trim()) return;

    setIsSaving(true);
    try {
      await onSave({
        category,
        title: title.trim() || undefined,
        content: content.trim(),
        color,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Ctrl+Enter / Cmd+Enter to save
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isEditing = !!editingEntry;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div
        ref={modalRef}
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl animate-float-up overflow-hidden"
        style={{ maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            {isEditing ? 'Edit Entry' : 'New Entry'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors hover:bg-[var(--border)]"
            style={{ color: 'var(--text-secondary)' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 pb-6 space-y-5 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 80px)' }}>
          {/* Category Selector */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: 'var(--text-muted)' }}>
              Category
            </label>
            <div className="flex gap-2 flex-wrap">
              {CATEGORY_OPTIONS.map(({ key, label, icon: Icon }) => {
                const isActive = category === key;
                return (
                  <button
                    key={key}
                    onClick={() => setCategory(key)}
                    className={`
                      flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium
                      transition-all duration-150 border
                      ${isActive ? 'shadow-sm' : 'hover:bg-[var(--bg-sidebar)]'}
                    `}
                    style={isActive
                      ? { backgroundColor: '#8B6914', color: '#fff', borderColor: '#8B6914' }
                      : { color: 'var(--text-secondary)', borderColor: 'var(--border)' }
                    }
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title Input */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: 'var(--text-muted)' }}>
              Title <span className="font-normal normal-case tracking-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give it a title..."
              className="w-full px-3.5 py-2.5 rounded-xl border text-sm bg-white focus:outline-none focus:ring-2 transition-shadow"
              style={{
                borderColor: 'var(--border)',
                color: 'var(--text-primary)',
                '--tw-ring-color': 'rgba(139, 105, 20, 0.25)',
              } as any}
              onKeyDown={handleKeyDown}
            />
          </div>

          {/* Content Textarea */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: 'var(--text-muted)' }}>
              Content
            </label>
            <textarea
              ref={contentRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={PLACEHOLDERS[category]}
              className="w-full px-3.5 py-3 rounded-xl border text-sm bg-white resize-none focus:outline-none focus:ring-2 transition-shadow leading-relaxed"
              style={{
                borderColor: 'var(--border)',
                color: 'var(--text-primary)',
                '--tw-ring-color': 'rgba(139, 105, 20, 0.25)',
                minHeight: '120px',
              } as any}
              onKeyDown={handleKeyDown}
            />
          </div>

          {/* Color Picker */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider mb-2.5 block" style={{ color: 'var(--text-muted)' }}>
              Color
            </label>
            <div className="flex gap-2.5">
              {COLOR_OPTIONS.map(({ key, color: c, label }) => (
                <button
                  key={key}
                  onClick={() => setColor(key)}
                  className={`
                    w-7 h-7 rounded-full transition-all duration-150
                    ${color === key ? 'ring-2 ring-offset-2 scale-110' : 'hover:scale-110'}
                  `}
                  style={{
                    backgroundColor: c,
                    '--tw-ring-color': '#8B6914',
                  } as any}
                  title={label}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              {content.length > 0 ? `${content.length} characters` : ''}
            </span>
            <div className="flex gap-2.5">
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-[var(--bg-sidebar)]"
                style={{ color: 'var(--text-secondary)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!content.trim() || isSaving}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#8B6914' }}
              >
                {isSaving ? 'Saving...' : isEditing ? 'Save Changes' : 'Add to Vault'}
              </button>
            </div>
          </div>

          {/* Keyboard shortcut hint */}
          <p className="text-center text-[11px]" style={{ color: 'var(--text-muted)' }}>
            Press <kbd className="px-1.5 py-0.5 rounded border text-[10px] font-mono" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-sidebar)' }}>⌘ Enter</kbd> to save
          </p>
        </div>
      </div>
    </div>
  );
}
