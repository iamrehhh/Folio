'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Pin, PinOff, Pencil, Trash2, MoreHorizontal,
  FileText, BookOpen, Languages, Zap,
  X, Maximize2
} from 'lucide-react';
import type { VaultEntry, VaultCategory, VaultColor } from '@/types';

interface VaultEntryCardProps {
  entry: VaultEntry;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
  onColorChange: (color: VaultColor) => void;
}

const CATEGORY_META: Record<VaultCategory, { label: string; icon: React.ElementType; badgeColor: string }> = {
  note: { label: 'Note', icon: FileText, badgeColor: '#8B6914' },
  reading_list: { label: 'Reading List', icon: BookOpen, badgeColor: '#059669' },
  vocabulary: { label: 'Vocabulary', icon: Languages, badgeColor: '#7C3AED' },
  quick_capture: { label: 'Capture', icon: Zap, badgeColor: '#D97706' },
};

const COLOR_MAP: Record<VaultColor, { bg: string; border: string }> = {
  default: { bg: '#FFFFFF', border: 'var(--border)' },
  amber: { bg: '#FFFBEB', border: '#F59E0B' },
  sage: { bg: '#F0FDF4', border: '#22C55E' },
  sky: { bg: '#EFF6FF', border: '#3B82F6' },
  rose: { bg: '#FFF1F2', border: '#F43F5E' },
  lavender: { bg: '#F5F3FF', border: '#8B5CF6' },
};

const COLOR_OPTIONS: VaultColor[] = ['default', 'amber', 'sage', 'sky', 'rose', 'lavender'];

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHrs / 24);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatFullDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

export default function VaultEntryCard({
  entry,
  onEdit,
  onDelete,
  onTogglePin,
  onColorChange,
}: VaultEntryCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const cat = CATEGORY_META[entry.category];
  const colors = COLOR_MAP[entry.color] || COLOR_MAP.default;
  const CatIcon = cat.icon;

  // Always truncate on card — 3 lines max
  const isLong = entry.content.length > 150 || entry.content.split('\n').length > 3;
  const previewContent = entry.content.length > 150
    ? entry.content.slice(0, 150) + '…'
    : entry.content.split('\n').length > 3
      ? entry.content.split('\n').slice(0, 3).join('\n') + '…'
      : entry.content;

  // Close menu on outside click
  useEffect(() => {
    if (!showMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
        setShowColorPicker(false);
        setConfirmDelete(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMenu]);

  // Lock body scroll when detail is open
  useEffect(() => {
    if (isDetailOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [isDetailOpen]);

  // Close detail on Escape
  useEffect(() => {
    if (!isDetailOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsDetailOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isDetailOpen]);

  return (
    <>
      {/* ── Card (compact preview) ── */}
      <div
        className="group relative rounded-xl border overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
        style={{
          backgroundColor: colors.bg,
          borderColor: colors.border === 'var(--border)' ? 'var(--border)' : `${colors.border}30`,
        }}
        onClick={() => setIsDetailOpen(true)}
      >
        {/* Color accent stripe */}
        <div
          className="absolute top-0 left-0 w-1 h-full rounded-l-xl"
          style={{ backgroundColor: colors.border === 'var(--border)' ? 'transparent' : colors.border }}
        />

        <div className="p-4 pl-5">
          {/* Top row: Category badge + pin + actions */}
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <span
                className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md"
                style={{
                  backgroundColor: `${cat.badgeColor}12`,
                  color: cat.badgeColor,
                }}
              >
                <CatIcon className="w-3 h-3" />
                {cat.label}
              </span>

              {entry.is_pinned && (
                <Pin className="w-3 h-3 fill-current" style={{ color: '#8B6914' }} />
              )}
            </div>

            {/* Expand icon — visible on hover */}
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={(e) => { e.stopPropagation(); onTogglePin(); }}
                className="p-1.5 rounded-lg transition-colors hover:bg-black/5"
                title={entry.is_pinned ? 'Unpin' : 'Pin to top'}
                style={{ color: 'var(--text-muted)' }}
              >
                {entry.is_pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => setIsDetailOpen(true)}
                className="p-1.5 rounded-lg transition-colors hover:bg-black/5"
                title="View full entry"
                style={{ color: 'var(--text-muted)' }}
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Title */}
          {entry.title && (
            <h3
              className="text-[15px] font-semibold leading-snug mb-1.5"
              style={{ color: 'var(--text-primary)' }}
            >
              {entry.title}
            </h3>
          )}

          {/* Content preview */}
          <div
            className="text-sm leading-relaxed whitespace-pre-wrap break-words"
            style={{ color: 'var(--text-secondary)' }}
          >
            {previewContent}
          </div>

          {/* Timestamp */}
          <p className="mt-3 text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
            {formatRelativeDate(entry.updated_at)}
          </p>
        </div>
      </div>

      {/* ── Detail Overlay (full-screen reader) ── */}
      {isDetailOpen && createPortal(
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsDetailOpen(false)}
          />

          {/* Full-screen detail panel */}
          <div
            className="absolute inset-3 md:inset-6 lg:inset-y-8 lg:inset-x-[10%] rounded-2xl shadow-2xl overflow-hidden animate-float-up flex flex-col"
            style={{
              backgroundColor: colors.bg === '#FFFFFF' ? '#FEFEFE' : colors.bg,
            }}
          >
            {/* Color accent bar at top */}
            {colors.border !== 'var(--border)' && (
              <div className="h-1.5 w-full shrink-0" style={{ backgroundColor: colors.border }} />
            )}

            {/* Header toolbar */}
            <div className="flex items-center justify-between px-6 md:px-10 py-4 shrink-0 border-b" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-3">
                <span
                  className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded-lg"
                  style={{
                    backgroundColor: `${cat.badgeColor}12`,
                    color: cat.badgeColor,
                  }}
                >
                  <CatIcon className="w-4 h-4" />
                  {cat.label}
                </span>

                {entry.is_pinned && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg" style={{ color: '#8B6914', backgroundColor: '#8B691410' }}>
                    <Pin className="w-3.5 h-3.5 fill-current" />
                    Pinned
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                {/* Pin toggle */}
                <button
                  onClick={onTogglePin}
                  className="p-2.5 rounded-xl transition-colors hover:bg-black/5"
                  title={entry.is_pinned ? 'Unpin' : 'Pin to top'}
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {entry.is_pinned ? <PinOff className="w-[18px] h-[18px]" /> : <Pin className="w-[18px] h-[18px]" />}
                </button>

                {/* Edit */}
                <button
                  onClick={() => { setIsDetailOpen(false); onEdit(); }}
                  className="p-2.5 rounded-xl transition-colors hover:bg-black/5"
                  title="Edit"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <Pencil className="w-[18px] h-[18px]" />
                </button>

                {/* More menu */}
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => { setShowMenu(!showMenu); setConfirmDelete(false); setShowColorPicker(false); }}
                    className="p-2.5 rounded-xl transition-colors hover:bg-black/5"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <MoreHorizontal className="w-[18px] h-[18px]" />
                  </button>

                  {showMenu && (
                    <div
                      className="absolute right-0 top-full mt-1 w-48 rounded-xl border shadow-lg py-1.5 z-20 animate-float-up"
                      style={{ backgroundColor: '#FFFFFF', borderColor: 'var(--border)' }}
                    >
                      <button
                        onClick={() => setShowColorPicker(!showColorPicker)}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors hover:bg-[var(--bg-sidebar)]"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: colors.border === 'var(--border)' ? '#E5E0D8' : colors.border, borderColor: 'var(--border)' }} />
                        Color
                      </button>

                      {showColorPicker && (
                        <div className="px-4 py-2.5 flex gap-2">
                          {COLOR_OPTIONS.map(c => (
                            <button
                              key={c}
                              onClick={() => { onColorChange(c); setShowColorPicker(false); setShowMenu(false); }}
                              className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                                entry.color === c ? 'ring-2 ring-offset-1' : ''
                              }`}
                              style={{
                                backgroundColor: COLOR_MAP[c].border === 'var(--border)' ? '#E5E0D8' : COLOR_MAP[c].border,
                                borderColor: entry.color === c ? '#8B6914' : 'transparent',
                                '--tw-ring-color': '#8B6914',
                              } as any}
                              title={c}
                            />
                          ))}
                        </div>
                      )}

                      <div className="my-1 border-t" style={{ borderColor: 'var(--border)' }} />

                      {confirmDelete ? (
                        <div className="px-4 py-2.5 flex items-center gap-2">
                          <span className="text-xs font-medium text-red-600">Delete?</span>
                          <button
                            onClick={() => { onDelete(); setShowMenu(false); setIsDetailOpen(false); }}
                            className="px-3 py-1 text-xs font-medium rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setConfirmDelete(false)}
                            className="px-3 py-1 text-xs font-medium rounded-lg border hover:bg-gray-50 transition-colors"
                            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(true)}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors hover:bg-red-50 text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className="w-px h-6 mx-1" style={{ backgroundColor: 'var(--border)' }} />

                {/* Close */}
                <button
                  onClick={() => setIsDetailOpen(false)}
                  className="p-2.5 rounded-xl transition-colors hover:bg-black/5"
                  title="Close"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable content body */}
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-3xl mx-auto px-6 md:px-10 lg:px-16 py-8 md:py-10">
                {/* Title */}
                {entry.title && (
                  <h2
                    className="text-2xl md:text-[28px] font-semibold leading-snug mb-6"
                    style={{ color: 'var(--text-primary)', fontFamily: 'Lora, Georgia, serif' }}
                  >
                    {entry.title}
                  </h2>
                )}

                {/* Full content — large readable text */}
                <div
                  className="text-base md:text-[17px] leading-[1.9] whitespace-pre-wrap break-words"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {entry.content}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="shrink-0 border-t px-6 md:px-10 py-3 flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Last updated {formatFullDate(entry.updated_at)}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {entry.content.length} characters
              </p>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
