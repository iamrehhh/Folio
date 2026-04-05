'use client';

import { useState, useRef } from 'react';
import { X, Upload, BookOpen, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface Props { onClose: () => void; }

const GENRES = ['Fiction', 'Non-Fiction', 'Science', 'History', 'Biography', 'Philosophy', 'Fantasy', 'Mystery', 'Romance', 'Other'];

function sanitize(name: string) {
  return name.replace(/[^a-zA-Z0-9.-]/g, '_');
}

export default function BookUploadModal({ onClose }: Props) {
  const router = useRouter();
  const epubRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  const [epubFile, setEpubFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [genre, setGenre] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStage, setUploadStage] = useState('');
  const [done, setDone] = useState(false);

  async function handleSubmit() {
    if (!epubFile || !title || !author) {
      toast.error('Please provide an EPUB file, title, and author.');
      return;
    }

    if (epubFile.size > 7 * 1024 * 1024) {
      toast.error('EPUB file exceeds the 7MB size limit.');
      return;
    }

    setIsUploading(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const timestamp = Date.now();

      // ── Step 1: Upload EPUB directly to Supabase Storage ──
      setUploadStage('Uploading EPUB…');
      const epubPath = `${user.id}/${timestamp}-${sanitize(epubFile.name)}`;
      const { error: epubError } = await supabase.storage
        .from('books')
        .upload(epubPath, epubFile, {
          contentType: 'application/epub+zip',
          upsert: false,
        });
      if (epubError) throw new Error(`EPUB upload failed: ${epubError.message}`);

      // ── Step 2: Upload cover directly to Supabase Storage ──
      let coverUrl: string | null = null;
      let coverPath: string | null = null;

      if (coverFile) {
        setUploadStage('Uploading cover…');
        coverPath = `${user.id}/${timestamp}-${sanitize(coverFile.name)}`;
        const { error: coverError } = await supabase.storage
          .from('covers')
          .upload(coverPath, coverFile, {
            contentType: coverFile.type,
            upsert: false,
          });
        if (!coverError) {
          const { data: urlData } = supabase.storage
            .from('covers')
            .getPublicUrl(coverPath);
          coverUrl = urlData.publicUrl;
        }
      }

      // ── Step 3: Save metadata to DB via API (tiny request — just strings) ──
      setUploadStage('Saving to library…');
      const res = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          author,
          genre: genre || null,
          epubPath,
          coverUrl,
          coverPath,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to save book');

      setDone(true);
      toast.success(`"${title}" added to your library!`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
      setIsUploading(false);
      setUploadStage('');
    }
  }

  // ── Done screen ──
  if (done) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <div className="relative z-10 w-full max-w-md rounded-xl border shadow-popover p-8 text-center"
          style={{ backgroundColor: 'var(--bg-card,#fff)', borderColor: 'var(--border)' }}>
          <CheckCircle2 className="w-12 h-12 mx-auto mb-4" style={{ color: '#8B6914' }} />
          <h2 className="text-lg font-semibold mb-1"
            style={{ fontFamily: 'Lora, Georgia, serif', color: 'var(--text-primary)' }}>
            Book Added!
          </h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
            "{title}" is ready to read.
          </p>
          <button onClick={onClose}
            className="w-full py-2.5 rounded-lg text-sm font-medium text-white"
            style={{ backgroundColor: '#8B6914' }}>
            Go to Library
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={!isUploading ? onClose : undefined} />

      <div className="relative z-10 w-full max-w-lg rounded-xl border shadow-popover overflow-hidden"
        style={{ backgroundColor: 'var(--bg-card,#fff)', borderColor: 'var(--border)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 className="font-semibold" style={{ color: 'var(--text-primary)', fontFamily: 'Lora, Georgia, serif' }}>
            Add Book to Library
          </h2>
          {!isUploading && (
            <button onClick={onClose} className="p-1 rounded hover:bg-[var(--border)] transition-colors">
              <X className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
            </button>
          )}
        </div>

        {/* Uploading state */}
        {isUploading && (
          <div className="px-6 py-10 flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center animate-pulse"
              style={{ backgroundColor: '#8B691420' }}>
              <Upload className="w-5 h-5" style={{ color: '#8B6914' }} />
            </div>
            <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
              {uploadStage || 'Uploading…'}
            </p>
            <div className="w-48 h-1 rounded-full overflow-hidden mt-1" style={{ backgroundColor: 'var(--border)' }}>
              <div className="h-full rounded-full animate-pulse"
                style={{ width: '80%', backgroundColor: '#8B6914' }} />
            </div>
            <p className="text-xs text-center" style={{ color: 'var(--text-secondary)' }}>
              Uploading directly to storage — maximum 7MB file size
            </p>
          </div>
        )}

        {/* Form */}
        {!isUploading && (
          <>
            <div className="px-6 py-5 space-y-4">
              {/* EPUB */}
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
                  EPUB File <span style={{ color: '#8B6914' }}>*</span>
                </label>
                <button onClick={() => epubRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-8 rounded-lg border-2 border-dashed text-sm transition-colors hover:border-[#8B6914]"
                  style={{ borderColor: epubFile ? '#8B6914' : 'var(--border)', color: 'var(--text-secondary)' }}>
                  {epubFile ? (
                    <>
                      <BookOpen className="w-4 h-4 flex-none" style={{ color: '#8B6914' }} />
                      <span style={{ color: 'var(--text-primary)' }}>{epubFile.name}</span>
                      <span className="text-xs ml-1" style={{ color: 'var(--text-secondary)' }}>
                        ({(epubFile.size / 1024).toFixed(0)} KB)
                      </span>
                    </>
                  ) : (
                    <><Upload className="w-4 h-4" /> Click to upload .epub file (Max 7MB)</>
                  )}
                </button>
                <input ref={epubRef} type="file" accept=".epub" className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file && file.size > 7 * 1024 * 1024) {
                      toast.error('File exceeds 7MB limit');
                      setEpubFile(null);
                    } else {
                      setEpubFile(file ?? null);
                    }
                  }} />
              </div>

              {/* Title + Author */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                    Title <span style={{ color: '#8B6914' }}>*</span>
                  </label>
                  <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                    placeholder="Book title"
                    className="w-full px-3 py-2 text-sm rounded-lg border outline-none"
                    style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                    Author <span style={{ color: '#8B6914' }}>*</span>
                  </label>
                  <input type="text" value={author} onChange={e => setAuthor(e.target.value)}
                    placeholder="Author name"
                    className="w-full px-3 py-2 text-sm rounded-lg border outline-none"
                    style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
                </div>
              </div>

              {/* Genre */}
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Genre</label>
                <select value={genre} onChange={e => setGenre(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border outline-none"
                  style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
                  <option value="">Select genre…</option>
                  {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>

              {/* Cover */}
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                  Cover Image (optional)
                </label>
                <button onClick={() => coverRef.current?.click()}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors hover:bg-[var(--bg)]"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                  <Upload className="w-4 h-4" />
                  {coverFile ? coverFile.name : 'Upload cover image'}
                </button>
                <input ref={coverRef} type="file" accept="image/*" className="hidden"
                  onChange={e => setCoverFile(e.target.files?.[0] ?? null)} />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t flex gap-3 justify-end" style={{ borderColor: 'var(--border)' }}>
              <button onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm font-medium border transition-colors hover:bg-[var(--bg)]"
                style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                Cancel
              </button>
              <button onClick={handleSubmit}
                disabled={!epubFile || !title || !author}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#8B6914' }}>
                Add to Library
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
