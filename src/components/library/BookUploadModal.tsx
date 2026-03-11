'use client';

import { useState, useRef } from 'react';
import { X, Upload, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface Props {
  onClose: () => void;
}

const GENRES = ['Fiction', 'Non-Fiction', 'Science', 'History', 'Biography', 'Self-Help', 'Fantasy', 'Mystery', 'Romance', 'Other'];

export default function BookUploadModal({ onClose }: Props) {
  const router = useRouter();
  const epubRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);
  const [epubFile, setEpubFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [genre, setGenre] = useState('');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  async function handleSubmit() {
    if (!epubFile || !title || !author) {
      toast.error('Please provide an EPUB file, title, and author.');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('epub', epubFile);
      if (coverFile) formData.append('cover', coverFile);
      formData.append('title', title);
      formData.append('author', author);
      if (genre) formData.append('genre', genre);
      if (description) formData.append('description', description);

      const res = await fetch('/api/books', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? 'Upload failed');

      toast.success(`"${title}" added to your library!`);
      router.refresh();
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div
        className="relative z-10 w-full max-w-lg rounded-xl border shadow-popover overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-card, #fff)',
          borderColor: 'var(--border)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.15)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 className="font-semibold" style={{ color: 'var(--text-primary)', fontFamily: 'Lora, Georgia, serif' }}>
            Add Book to Library
          </h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-[var(--border)] transition-colors">
            <X className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* EPUB upload */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
              EPUB File <span style={{ color: '#8B6914' }}>*</span>
            </label>
            <button
              onClick={() => epubRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 px-4 py-8 rounded-lg border-2 border-dashed text-sm transition-colors hover:border-[#8B6914]"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            >
              {epubFile ? (
                <>
                  <BookOpen className="w-4 h-4" style={{ color: '#8B6914' }} />
                  <span style={{ color: 'var(--text-primary)' }}>{epubFile.name}</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Click to upload .epub file
                </>
              )}
            </button>
            <input
              ref={epubRef}
              type="file"
              accept=".epub"
              className="hidden"
              onChange={(e) => setEpubFile(e.target.files?.[0] ?? null)}
            />
          </div>

          {/* Title + Author */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                Title <span style={{ color: '#8B6914' }}>*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Book title"
                className="w-full px-3 py-2 text-sm rounded-lg border outline-none"
                style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                Author <span style={{ color: '#8B6914' }}>*</span>
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Author name"
                className="w-full px-3 py-2 text-sm rounded-lg border outline-none"
                style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          {/* Genre */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
              Genre
            </label>
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border outline-none"
              style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            >
              <option value="">Select genre…</option>
              {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          {/* Cover */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
              Cover Image (optional)
            </label>
            <button
              onClick={() => coverRef.current?.click()}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors hover:bg-[var(--bg)]"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            >
              <Upload className="w-4 h-4" />
              {coverFile ? coverFile.name : 'Upload cover image'}
            </button>
            <input
              ref={coverRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex gap-3 justify-end" style={{ borderColor: 'var(--border)' }}>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium border transition-colors hover:bg-[var(--bg)]"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isUploading || !epubFile || !title || !author}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#8B6914' }}
          >
            {isUploading ? 'Uploading…' : 'Add to Library'}
          </button>
        </div>
      </div>
    </div>
  );
}
