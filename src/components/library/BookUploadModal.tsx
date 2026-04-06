'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Upload, BookOpen, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface Props { onClose: () => void; }

const GENRES = ['Fiction', 'Non-Fiction', 'Science', 'History', 'Biography', 'Philosophy', 'Fantasy', 'Mystery', 'Romance', 'Other'];

function sanitize(name: string) {
  return name.replace(/[^a-zA-Z0-9.-]/g, '_');
}

/* ── Upload stages config ── */
const STAGES = [
  { key: 'epub',   label: 'Uploading EPUB',    pct: 45  },
  { key: 'cover',  label: 'Uploading Cover',   pct: 72  },
  { key: 'saving', label: 'Saving to Library', pct: 92  },
  { key: 'done',   label: 'Complete',          pct: 100 },
] as const;

function stageIndex(stage: string): number {
  if (stage.includes('EPUB'))    return 0;
  if (stage.includes('cover'))   return 1;
  if (stage.includes('Saving') || stage.includes('library')) return 2;
  return -1;
}

/* ── Confetti particles for the success screen ── */
function SuccessParticles() {
  const particles = Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * 360;
    const delay = Math.random() * 0.3;
    const size = 4 + Math.random() * 4;
    const distance = 40 + Math.random() * 30;
    const colors = ['#8B6914', '#C9972A', '#D4A843', '#A07D20', '#E8C54A', '#6B5210'];
    const color = colors[i % colors.length];

    return (
      <span
        key={i}
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: i % 3 === 0 ? '50%' : i % 3 === 1 ? '2px' : '1px',
          backgroundColor: color,
          top: '50%',
          left: '50%',
          transform: `rotate(${angle}deg) translateY(-${distance}px)`,
          animation: `confettiBurst 0.7s ${delay}s ease-out forwards`,
          opacity: 0,
        }}
      />
    );
  });
  return <div className="absolute inset-0 pointer-events-none">{particles}</div>;
}

export default function BookUploadModal({ onClose }: Props) {
  const router = useRouter();
  const epubRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  const [epubFile, setEpubFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [genres, setGenres] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStage, setUploadStage] = useState('');
  const [done, setDone] = useState(false);

  /* Derived progress state */
  const activeIdx = stageIndex(uploadStage);
  const prevPct = useRef(0);
  const currentPct = activeIdx >= 0 ? STAGES[activeIdx].pct : 0;

  useEffect(() => {
    /* tiny delay so the CSS transition picks up changes */
    const t = setTimeout(() => { prevPct.current = currentPct; }, 50);
    return () => clearTimeout(t);
  }, [currentPct]);

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

      // ── Step 3: Save metadata to DB via API ──
      setUploadStage('Saving to library…');
      const res = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          author,
          genre: genres.length > 0 ? genres.join(', ') : null,
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
        <div
          className="relative z-10 w-full max-w-md rounded-xl border shadow-popover p-8 text-center animate-float-up"
          style={{ backgroundColor: 'var(--bg-card,#fff)', borderColor: 'var(--border)' }}
        >
          {/* Animated checkmark with particles */}
          <div className="relative w-16 h-16 mx-auto mb-5">
            <SuccessParticles />
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center animate-success-bounce"
              style={{ backgroundColor: '#8B6914' }}
            >
              <Check className="w-8 h-8 text-white" strokeWidth={3} />
            </div>
          </div>

          <h2
            className="text-xl font-semibold mb-1"
            style={{ fontFamily: 'Lora, Georgia, serif', color: 'var(--text-primary)' }}
          >
            Book Added!
          </h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
            &ldquo;{title}&rdquo; is ready to read.
          </p>
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ backgroundColor: '#8B6914' }}
          >
            Go to Library
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={!isUploading ? onClose : undefined}
      />

      <div
        className="relative z-10 w-full max-w-lg rounded-xl border shadow-popover overflow-hidden"
        style={{ backgroundColor: 'var(--bg-card,#fff)', borderColor: 'var(--border)' }}
      >
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

        {/* ──────── UPLOADING STATE ──────── */}
        {isUploading && (
          <div className="px-6 py-8 flex flex-col items-center">
            {/* Floating book icon with glow */}
            <div className="relative mb-5">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center animate-book-float animate-glow-pulse"
                style={{ backgroundColor: '#8B691418' }}
              >
                <BookOpen
                  className="w-7 h-7"
                  style={{ color: '#8B6914' }}
                />
              </div>
            </div>

            {/* Stage text with fade animation */}
            <p
              key={uploadStage}
              className="font-medium text-sm mb-5 animate-stage-fade"
              style={{ color: 'var(--text-primary)' }}
            >
              {uploadStage || 'Preparing upload…'}
            </p>

            {/* ── Multi-step stepper ── */}
            <div className="w-full max-w-xs mb-5">
              <div className="flex items-center justify-between mb-2">
                {STAGES.slice(0, 3).map((s, i) => {
                  const isActive = activeIdx === i;
                  const isComplete = activeIdx > i || done;
                  return (
                    <div key={s.key} className="flex flex-col items-center" style={{ flex: 1 }}>
                      {/* dot */}
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-500"
                        style={{
                          backgroundColor: isComplete
                            ? '#8B6914'
                            : isActive
                            ? '#8B691430'
                            : 'var(--border)',
                          color: isComplete
                            ? '#fff'
                            : isActive
                            ? '#8B6914'
                            : 'var(--text-muted)',
                          transform: isActive ? 'scale(1.15)' : 'scale(1)',
                          boxShadow: isActive ? '0 0 12px rgba(139, 105, 20, 0.3)' : 'none',
                        }}
                      >
                        {isComplete ? (
                          <Check className="w-3.5 h-3.5" strokeWidth={3} />
                        ) : (
                          i + 1
                        )}
                      </div>
                      {/* label */}
                      <span
                        className="text-[10px] mt-1.5 text-center leading-tight transition-colors duration-300"
                        style={{
                          color: isActive || isComplete ? '#8B6914' : 'var(--text-muted)',
                          fontWeight: isActive ? 600 : 400,
                        }}
                      >
                        {s.label.replace('Uploading ', '').replace('Saving to ', '')}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Connecting line under steppers */}
              <div className="flex items-center gap-0 px-3 -mt-[26px] mb-5">
                {[0, 1].map((i) => (
                  <div
                    key={i}
                    className="h-[2px] flex-1 rounded-full transition-colors duration-500"
                    style={{
                      backgroundColor: activeIdx > i ? '#8B6914' : 'var(--border)',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* ── Animated progress bar ── */}
            <div className="w-full max-w-xs">
              <div
                className="w-full h-1.5 rounded-full overflow-hidden relative"
                style={{ backgroundColor: 'var(--border)' }}
              >
                {/* Real progress fill */}
                <div
                  className="h-full rounded-full relative overflow-hidden"
                  style={{
                    width: `${currentPct}%`,
                    backgroundColor: '#8B6914',
                    transition: 'width 0.8s cubic-bezier(0.65, 0, 0.35, 1)',
                  }}
                >
                  {/* Shimmer overlay */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)',
                      animation: 'uploadShimmer 1.5s ease-in-out infinite',
                    }}
                  />
                </div>
              </div>

              {/* Percentage label */}
              <div className="flex justify-between items-center mt-2">
                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  Uploading to storage
                </p>
                <span
                  className="text-[11px] font-medium tabular-nums"
                  style={{ color: '#8B6914' }}
                >
                  {currentPct}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ──────── FORM ──────── */}
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

              {/* Genre — multi-select pills */}
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Genre {genres.length > 0 && <span className="text-xs font-normal" style={{ color: 'var(--text-secondary)' }}>({genres.length} selected)</span>}</label>
                <div className="flex flex-wrap gap-1.5">
                  {GENRES.map(g => {
                    const selected = genres.includes(g);
                    return (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setGenres(prev => selected ? prev.filter(x => x !== g) : [...prev, g])}
                        className="px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200"
                        style={{
                          backgroundColor: selected ? '#8B6914' : 'transparent',
                          color: selected ? '#fff' : 'var(--text-secondary)',
                          border: `1.5px solid ${selected ? '#8B6914' : 'var(--border)'}`,
                          transform: selected ? 'scale(1.04)' : 'scale(1)',
                          boxShadow: selected ? '0 2px 8px rgba(139, 105, 20, 0.25)' : 'none',
                        }}
                      >
                        {selected && <span style={{ marginRight: 4 }}>✓</span>}{g}
                      </button>
                    );
                  })}
                </div>
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
