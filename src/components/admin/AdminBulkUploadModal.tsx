'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { X, Upload, Check, Loader2, Trash2, Image as ImageIcon, ChevronDown, BookOpen, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';
import ePub from 'epubjs';
import { cn } from '@/lib/utils';

interface Props {
  onClose: () => void;
  onUploaded: () => void;
}

const GENRES = ['Fiction', 'Non-Fiction', 'Science', 'History', 'Biography', 'Philosophy', 'Fantasy', 'Mystery/Thriller', 'Romance', 'Comedy', 'Horror', 'Other'];
const LANGUAGES = ['English', 'Bengali', 'Hindi', 'Spanish', 'French', 'German', 'Other'];

function sanitize(name: string) {
  return name.replace(/[^a-zA-Z0-9.-]/g, '_');
}

interface UploadRow {
  id: string;
  epubFile: File;
  coverFile: File | null;
  coverUrlPreview: string | null;
  title: string;
  author: string;
  genres: string[];
  language: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  errorMsg?: string;
}

function GenreSelector({ selected, onChange, disabled }: { selected: string[], onChange: (g: string[]) => void, disabled: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative min-w-[120px]" ref={ref}>
      <button
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className="w-full px-2 py-1.5 rounded border text-left flex items-center justify-between min-h-[34px] bg-transparent outline-none focus:border-[#8B6914]"
        style={{ borderColor: 'var(--border)', color: selected.length ? 'var(--text-primary)' : 'var(--text-secondary)' }}
      >
        <span className="truncate pr-2 text-sm">{selected.length > 0 ? selected.join(', ') : 'Select...'}</span>
        <ChevronDown className="w-3 h-3 flex-none opacity-50" />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-48 rounded-lg shadow-popover border z-50 max-h-48 overflow-y-auto custom-scrollbar py-1" style={{ backgroundColor: 'var(--bg-card,#fff)', borderColor: 'var(--border)' }}>
          {GENRES.map(g => {
            const isSelected = selected.includes(g);
            return (
              <label key={g} className="flex items-center gap-2.5 px-3 py-1.5 hover:bg-[var(--bg)] cursor-pointer">
                <div className="w-4 h-4 rounded border flex flex-none items-center justify-center transition-colors"
                  style={{ borderColor: isSelected ? '#8B6914' : 'var(--border)', backgroundColor: isSelected ? '#8B6914' : 'transparent' }}>
                  {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                </div>
                <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{g}</span>
                <input type="checkbox" checked={isSelected} className="hidden" onChange={() => {
                  if (isSelected) onChange(selected.filter(x => x !== g));
                  else onChange([...selected, g]);
                }} />
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AdminBulkUploadModal({ onClose, onUploaded }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [rows, setRows] = useState<UploadRow[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [done, setDone] = useState(false);
  const [globalLanguage, setGlobalLanguage] = useState('');

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsDragActive(false);
  }, []);

  const parseFiles = async (files: File[]) => {
    setIsParsing(true);
    const newRows: UploadRow[] = [];

    for (const file of files) {
      if (!file.name.toLowerCase().endsWith('.epub')) continue;
      if (file.size > 9 * 1024 * 1024) {
        toast.error(`"${file.name}" exceeds 9MB limit.`);
        continue;
      }

      try {
        const arrayBuffer = await file.arrayBuffer();
        const book = ePub(arrayBuffer);
        const metadata = await book.loaded.metadata;
        let coverFile = null;
        let coverUrlPreview = null;

        try {
          const coverUrl = await book.coverUrl();
          if (coverUrl) {
            const res = await fetch(coverUrl);
            const blob = await res.blob();
            coverFile = new File([blob], 'cover.jpg', { type: blob.type });
            coverUrlPreview = URL.createObjectURL(blob);
          }
        } catch (e) {
          console.warn('Could not extract cover for ' + file.name, e);
        }

        newRows.push({
          id: crypto.randomUUID(),
          epubFile: file,
          coverFile,
          coverUrlPreview,
          title: metadata?.title || file.name.replace('.epub', ''),
          author: metadata?.creator || 'Unknown Author',
          genres: [],
          language: '',
          status: 'pending'
        });
      } catch (e) {
        console.warn('Failed to parse epub ' + file.name, e);
        newRows.push({
          id: crypto.randomUUID(),
          epubFile: file,
          coverFile: null,
          coverUrlPreview: null,
          title: file.name.replace('.epub', ''),
          author: 'Unknown Author',
          genres: [],
          language: '',
          status: 'pending'
        });
      }
    }

    setRows(prev => [...prev, ...newRows]);
    setIsParsing(false);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      parseFiles(Array.from(e.dataTransfer.files));
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      parseFiles(Array.from(e.target.files));
    }
    if (e.target) e.target.value = '';
  };

  const removeRow = (id: string) => {
    setRows(prev => prev.filter(r => r.id !== id));
  };

  const updateRow = (id: string, updates: Partial<UploadRow>) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  async function handleSubmit() {
    if (rows.length === 0) return;

    setIsUploading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let hasErrors = false;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (row.status === 'success') continue;

      setRows(prev => prev.map((r, idx) => idx === i ? { ...r, status: 'uploading' } : r));

      try {
        const checkRes = await fetch(`/api/books/check?title=${encodeURIComponent(row.title)}&author=${encodeURIComponent(row.author)}`);
        const checkData = await checkRes.json();
        if (checkData.exists) {
          throw new Error('Book already exists in the library');
        }

        const timestamp = Date.now();

        // Upload EPUB to storage
        const epubPath = `${user.id}/${timestamp}-${sanitize(row.epubFile.name)}`;
        const { error: epubError } = await supabase.storage.from('books').upload(epubPath, row.epubFile, { contentType: 'application/epub+zip', upsert: false });
        if (epubError) throw new Error(epubError.message);

        // Upload cover to storage
        let coverUrl = null;
        let coverPath = null;
        if (row.coverFile) {
          coverPath = `${user.id}/${timestamp}-${sanitize(row.coverFile.name)}`;
          const { error: coverError } = await supabase.storage.from('covers').upload(coverPath, row.coverFile, { contentType: row.coverFile.type, upsert: false });
          if (!coverError) {
            const { data } = supabase.storage.from('covers').getPublicUrl(coverPath);
            coverUrl = data.publicUrl;
          }
        }

        // Save book via admin upload API — sets uploaded_via='admin', no user_library entry
        const bookLang = row.language || globalLanguage || null;
        const res = await fetch('/api/admin/books/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: row.title,
            author: row.author,
            genre: row.genres.length > 0 ? row.genres.join(', ') : null,
            language: bookLang,
            epubPath,
            coverUrl,
            coverPath,
            visibility: 'private', // Default to private so admin can preview first
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Failed to save book');

        setRows(prev => prev.map((r, idx) => idx === i ? { ...r, status: 'success' } : r));
      } catch (e: any) {
        hasErrors = true;
        setRows(prev => prev.map((r, idx) => idx === i ? { ...r, status: 'error', errorMsg: e.message } : r));
      }
    }

    setIsUploading(false);
    if (!hasErrors) {
      setDone(true);
      toast.success('All books uploaded successfully!');
      onUploaded();
    } else {
      toast.error('Some books failed to upload.');
    }
  }

  if (done) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <div className="relative z-10 w-full max-w-md rounded-xl border shadow-popover p-8 text-center animate-float-up" style={{ backgroundColor: 'var(--bg-card,#fff)', borderColor: 'var(--border)' }}>
          <div className="w-16 h-16 mx-auto mb-5 rounded-full flex items-center justify-center animate-success-bounce" style={{ backgroundColor: '#8B6914' }}>
            <Check className="w-8 h-8 text-white" strokeWidth={3} />
          </div>
          <h2 className="text-xl font-semibold mb-1" style={{ fontFamily: 'Lora, Georgia, serif', color: 'var(--text-primary)' }}>Upload Complete!</h2>
          <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
            Successfully uploaded {rows.filter(r => r.status === 'success').length} books to the admin library.
          </p>
          <p className="text-xs mb-6 px-4" style={{ color: 'var(--text-secondary)' }}>
            Books are set to <strong>Private</strong> by default. Preview and make them Public when ready.
          </p>
          <button onClick={onClose} className="w-full py-2.5 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90 active:scale-[0.98]" style={{ backgroundColor: '#8B6914' }}>Done</button>
        </div>
      </div>
    );
  }

  const successCount = rows.filter(r => r.status === 'success').length;
  const uploadingCount = rows.filter(r => r.status === 'uploading').length;
  const errorCount = rows.filter(r => r.status === 'error').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={(!isUploading && !isParsing) ? onClose : undefined} />

      <div className="relative z-10 w-full max-w-5xl rounded-xl border shadow-popover flex flex-col max-h-[90vh]" style={{ backgroundColor: 'var(--bg-card,#fff)', borderColor: 'var(--border)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b flex-none" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#8B691415' }}>
              <Upload className="w-4 h-4" style={{ color: '#8B6914' }} />
            </div>
            <div>
              <h2 className="font-semibold" style={{ color: 'var(--text-primary)', fontFamily: 'Lora, Georgia, serif' }}>Admin Bulk Upload</h2>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Books uploaded here go to public library only — not your personal library</p>
            </div>
          </div>
          {(!isUploading && !isParsing) && (
            <button onClick={onClose} className="p-1 rounded hover:bg-[var(--border)] transition-colors">
              <X className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">

          {/* Dropzone */}
          {(!isUploading && rows.length === 0) && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn("w-full flex-col flex items-center justify-center gap-2 p-12 rounded-xl border-2 border-dashed cursor-pointer transition-colors",
                isDragActive ? "border-[#8B6914] bg-[#8B6914]/5" : "border-[var(--border)] hover:border-[#8B6914]/50")}
            >
              <input ref={fileInputRef} type="file" multiple accept=".epub" className="hidden" onChange={handleFileSelect} />
              {isParsing ? (
                <>
                  <Loader2 className="w-8 h-8 animate-spin text-[#8B6914]" />
                  <span className="font-medium mt-2" style={{ color: 'var(--text-primary)' }}>Parsing EPUBs...</span>
                </>
              ) : (
                <>
                  <Upload className={cn("w-8 h-8 mb-1 transition-colors", isDragActive ? "text-[#8B6914]" : "text-gray-400")} />
                  <span className="font-medium text-lg" style={{ color: isDragActive ? '#8B6914' : 'var(--text-primary)' }}>
                    Drop .epub files here for admin library
                  </span>
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>or click to browse files (max 9MB each)</span>
                  <span className="text-xs mt-2 px-4 py-1.5 rounded-full" style={{ backgroundColor: '#8B691412', color: '#8B6914' }}>
                    These books will NOT appear in your personal library
                  </span>
                </>
              )}
            </div>
          )}

          {/* Staging Area */}
          {rows.length > 0 && (
            <div className="flex flex-col gap-4">

              {/* Global Language Setting */}
              <div className="flex items-center gap-4 p-4 rounded-xl border" style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-2 text-sm flex-none" style={{ color: 'var(--text-secondary)' }}>
                  <BookOpen className="w-4 h-4" />
                  <span className="font-medium">Default Language:</span>
                </div>
                <select
                  value={globalLanguage}
                  onChange={e => setGlobalLanguage(e.target.value)}
                  disabled={isUploading}
                  className="px-3 py-1.5 rounded-lg border text-sm outline-none"
                  style={{ backgroundColor: 'var(--bg-card,#fff)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                >
                  <option value="">None (set per book)</option>
                  {LANGUAGES.map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
                <div className="flex-1" />
                <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full" style={{ backgroundColor: '#8B691410', color: '#8B6914' }}>
                  <Eye className="w-3.5 h-3.5" />
                  Uploads as Private — preview before publishing
                </div>
              </div>

              {/* Staging Table */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    {rows.length} files selected
                  </p>
                  {(!isUploading && !isParsing) && (
                    <button onClick={() => fileInputRef.current?.click()} className="text-sm font-medium text-[#8B6914] hover:underline">
                      + Add more files
                    </button>
                  )}
                  <input ref={fileInputRef} type="file" multiple accept=".epub" className="hidden" onChange={handleFileSelect} />
                </div>

                <div className="border rounded-lg overflow-x-auto" style={{ borderColor: 'var(--border)' }}>
                  <table className="w-full text-sm text-left">
                    <thead className="border-b" style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                      <tr>
                        <th className="px-4 py-3 font-medium w-16">Cover</th>
                        <th className="px-4 py-3 font-medium min-w-[200px]">Title</th>
                        <th className="px-4 py-3 font-medium min-w-[150px]">Author</th>
                        <th className="px-4 py-3 font-medium min-w-[120px]">Genre</th>
                        <th className="px-4 py-3 font-medium min-w-[100px]">Language</th>
                        <th className="px-4 py-3 font-medium w-32">Status</th>
                        <th className="px-4 py-3 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                      {rows.map(row => (
                        <tr key={row.id} className="transition-colors hover:bg-[var(--bg)]">
                          <td className="px-4 py-3">
                            {row.coverUrlPreview ? (
                              <img src={row.coverUrlPreview} alt="cover" className="w-10 h-14 object-cover rounded border" style={{ borderColor: 'var(--border)' }} />
                            ) : (
                              <div className="w-10 h-14 rounded border flex items-center justify-center bg-gray-50" style={{ borderColor: 'var(--border)' }}>
                                <ImageIcon className="w-4 h-4 text-gray-400" />
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <input
                              value={row.title}
                              onChange={e => updateRow(row.id, { title: e.target.value })}
                              disabled={isUploading || row.status === 'success'}
                              className="w-full px-2 py-1.5 rounded border outline-none bg-transparent"
                              style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              value={row.author}
                              onChange={e => updateRow(row.id, { author: e.target.value })}
                              disabled={isUploading || row.status === 'success'}
                              className="w-full px-2 py-1.5 rounded border outline-none bg-transparent"
                              style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <GenreSelector
                              selected={row.genres}
                              onChange={(genres) => updateRow(row.id, { genres })}
                              disabled={isUploading || row.status === 'success'}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={row.language}
                              onChange={e => updateRow(row.id, { language: e.target.value })}
                              disabled={isUploading || row.status === 'success'}
                              className="w-full px-2 py-1.5 rounded border outline-none bg-transparent text-sm"
                              style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                            >
                              <option value="">—</option>
                              {LANGUAGES.map(lang => (
                                <option key={lang} value={lang}>{lang}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3 text-xs font-medium">
                            {row.status === 'pending' && <span className="text-gray-500">Pending</span>}
                            {row.status === 'uploading' && <span className="text-[#8B6914] flex items-center gap-1.5"><Loader2 className="w-3 h-3 animate-spin" /> Uploading...</span>}
                            {row.status === 'success' && <span className="text-green-600 flex items-center gap-1"><Check className="w-3 h-3" /> Done</span>}
                            {row.status === 'error' && <span className="text-red-500" title={row.errorMsg}>Error</span>}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {(!isUploading && row.status !== 'success') && (
                              <button onClick={() => removeRow(row.id)} className="p-1.5 rounded-md hover:bg-red-50 text-red-500 transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {isParsing && (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin text-[#8B6914]" />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t flex-none" style={{ borderColor: 'var(--border)' }}>
          <div className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            {isUploading ? (
              <span>Uploading {successCount + uploadingCount + errorCount} of {rows.length}...</span>
            ) : (
              <span>{successCount > 0 ? `${successCount} uploaded successfully` : ''}</span>
            )}
          </div>

          <div className="flex gap-3">
            <button onClick={onClose} disabled={isUploading || isParsing} className="px-4 py-2 rounded-lg text-sm font-medium border transition-colors hover:bg-[var(--bg)] disabled:opacity-50" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
              {successCount > 0 ? 'Close' : 'Cancel'}
            </button>
            <button
              onClick={handleSubmit}
              disabled={isUploading || isParsing || rows.length === 0 || rows.every(r => r.status === 'success')}
              className="px-6 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#8B6914' }}
            >
              {isUploading ? 'Uploading...' : 'Upload All'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
