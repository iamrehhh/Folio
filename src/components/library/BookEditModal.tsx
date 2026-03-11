'use client';

import { useState, useRef } from 'react';
import { X, Upload, BookOpen } from 'lucide-react';
import type { Book } from '@/types';
import toast from 'react-hot-toast';

const GENRES = ['Fiction', 'Non-Fiction', 'Science', 'History', 'Biography', 'Self-Help', 'Fantasy', 'Mystery', 'Other'];

interface Props {
  book: Book;
  onClose: () => void;
  onSaved: (updated: Book) => void;
}

export default function BookEditModal({ book, onClose, onSaved }: Props) {
  const [title, setTitle]   = useState(book.title);
  const [author, setAuthor] = useState(book.author);
  const [genre, setGenre]   = useState(book.genre ?? 'Fiction');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(book.cover_url ?? null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function onCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  }

  async function handleSave() {
    if (!title.trim() || !author.trim()) {
      toast.error('Title and author are required');
      return;
    }
    setSaving(true);
    try {
      const body = new FormData();
      body.append('title', title.trim());
      body.append('author', author.trim());
      body.append('genre', genre);
      if (coverFile) body.append('cover', coverFile);

      const res = await fetch(`/api/books/${book.id}`, { method: 'PATCH', body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Save failed');
      toast.success('Book updated!');
      onSaved(data.book);
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="w-full max-w-md rounded-2xl shadow-popover overflow-hidden" style={{ backgroundColor: 'var(--bg-card,#fff)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 className="font-semibold text-base" style={{ fontFamily: 'Lora, Georgia, serif', color: 'var(--text-primary)' }}>
            Edit Book
          </h2>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-[var(--border)] transition-colors">
            <X className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Cover upload */}
          <div className="flex gap-4 items-start">
            <div
              className="w-24 h-36 rounded-lg overflow-hidden flex-none flex items-center justify-center cursor-pointer border-2 border-dashed transition-colors hover:border-[#8B6914]"
              style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}
              onClick={() => fileRef.current?.click()}
            >
              {coverPreview ? (
                <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <BookOpen className="w-6 h-6 opacity-30" style={{ color: 'var(--text-secondary)' }} />
                  <span className="text-xs text-center px-1 opacity-50" style={{ color: 'var(--text-secondary)' }}>Add cover</span>
                </div>
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Cover Image</p>
              <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>JPG, PNG or WEBP. Recommended 2:3 ratio.</p>
              <button
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors hover:bg-[var(--border)]"
                style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              >
                <Upload className="w-3 h-3" />
                {coverPreview ? 'Change cover' : 'Upload cover'}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onCoverChange} />
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-[#8B6914]/30"
              style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            />
          </div>

          {/* Author */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Author</label>
            <input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-[#8B6914]/30"
              style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            />
          </div>

          {/* Genre */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Genre</label>
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none"
              style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            >
              {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border text-sm font-medium transition-colors hover:bg-[var(--border)]"
            style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: '#8B6914' }}
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
