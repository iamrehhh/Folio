'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { X, Upload, Check, Loader2, Trash2, Image as ImageIcon, Lock, Globe, UserCheck, Users, Search, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import ePub from 'epubjs';
import { cn } from '@/lib/utils';
import type { BookVisibility } from '@/types';

interface Props { onClose: () => void; }

const GENRES = ['Fiction', 'Non-Fiction', 'Science', 'History', 'Biography', 'Philosophy', 'Fantasy', 'Mystery', 'Romance', 'Other'];

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
  status: 'pending' | 'uploading' | 'success' | 'error';
  errorMsg?: string;
}

interface UserEntry {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  assigned: boolean;
}

const VISIBILITY_OPTIONS: {
  value: BookVisibility;
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}[] = [
  { value: 'private', label: 'Private', icon: Lock, color: '#6B7280', bgColor: '#6B728015' },
  { value: 'public', label: 'Public', icon: Globe, color: '#22C55E', bgColor: '#22C55E15' },
  { value: 'assigned', label: 'Assigned', icon: UserCheck, color: '#3B82F6', bgColor: '#3B82F615' },
];

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

export default function BulkUploadModal({ onClose }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [rows, setRows] = useState<UploadRow[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [done, setDone] = useState(false);

  const [globalVisibility, setGlobalVisibility] = useState<BookVisibility>('private');
  const [users, setUsers] = useState<UserEntry[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [userSearch, setUserSearch] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    if (globalVisibility === 'assigned' && users.length === 0) {
      setLoadingUsers(true);
      fetch(`/api/admin/books/new/access`)
        .then(r => r.json())
        .then(d => setUsers(d.users ?? []))
        .catch(() => toast.error('Failed to load users'))
        .finally(() => setLoadingUsers(false));
    }
  }, [globalVisibility, users.length]);

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
    if (e.target) {
      e.target.value = '';
    }
  };

  const removeRow = (id: string) => {
    setRows(prev => prev.filter(r => r.id !== id));
  };

  const updateRow = (id: string, updates: Partial<UploadRow>) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  function toggleUser(userId: string) {
    setSelectedUserIds(prev => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  function getFilteredUsers() {
    if (!userSearch) return users;
    const q = userSearch.toLowerCase();
    return users.filter(u =>
      (u.full_name ?? '').toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  }

  async function handleSubmit() {
    if (rows.length === 0) return;
    if (globalVisibility === 'assigned' && selectedUserIds.size === 0) {
      toast.error('Please select at least one user to assign the books to.');
      return;
    }

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
          throw new Error('Cannot be uploaded as the book already exists in the library');
        }

        const timestamp = Date.now();
        
        const epubPath = `${user.id}/${timestamp}-${sanitize(row.epubFile.name)}`;
        const { error: epubError } = await supabase.storage.from('books').upload(epubPath, row.epubFile, { contentType: 'application/epub+zip', upsert: false });
        if (epubError) throw new Error(epubError.message);
        
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
        
        const res = await fetch('/api/books', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: row.title,
            author: row.author,
            genre: row.genres.length > 0 ? row.genres.join(', ') : null,
            epubPath,
            coverUrl,
            coverPath,
            visibility: globalVisibility,
          }),
        });
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Failed to save book');
        
        // Handle assignment if assigned visibility
        if (globalVisibility === 'assigned' && selectedUserIds.size > 0) {
           const accessRes = await fetch(`/api/admin/books/${data.book.id}/access`, {
             method: 'PUT',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ userIds: Array.from(selectedUserIds) })
           });
           if (!accessRes.ok) throw new Error('Failed to update assignments');
        }

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
    } else {
      toast.error('Some books failed to upload.');
    }
  }

  if (done) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { onClose(); router.refresh(); }} />
        <div className="relative z-10 w-full max-w-md rounded-xl border shadow-popover p-8 text-center animate-float-up" style={{ backgroundColor: 'var(--bg-card,#fff)', borderColor: 'var(--border)' }}>
          <div className="w-16 h-16 mx-auto mb-5 rounded-full flex items-center justify-center animate-success-bounce" style={{ backgroundColor: '#8B6914' }}>
            <Check className="w-8 h-8 text-white" strokeWidth={3} />
          </div>
          <h2 className="text-xl font-semibold mb-1" style={{ fontFamily: 'Lora, Georgia, serif', color: 'var(--text-primary)' }}>Bulk Upload Complete!</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>Successfully added {rows.length} books to your library.</p>
          <button onClick={() => { onClose(); router.refresh(); }} className="w-full py-2.5 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90 active:scale-[0.98]" style={{ backgroundColor: '#8B6914' }}>Go to Library</button>
        </div>
      </div>
    );
  }

  const successCount = rows.filter(r => r.status === 'success').length;
  const uploadingCount = rows.filter(r => r.status === 'uploading').length;
  const errorCount = rows.filter(r => r.status === 'error').length;
  const filteredUsers = getFilteredUsers();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={(!isUploading && !isParsing) ? onClose : undefined} />
      
      <div className="relative z-10 w-full max-w-5xl rounded-xl border shadow-popover flex flex-col max-h-[90vh]" style={{ backgroundColor: 'var(--bg-card,#fff)', borderColor: 'var(--border)' }}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b flex-none" style={{ borderColor: 'var(--border)' }}>
          <h2 className="font-semibold" style={{ color: 'var(--text-primary)', fontFamily: 'Lora, Georgia, serif' }}>Bulk Upload Books</h2>
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
                      Drop multiple .epub files here
                    </span>
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>or click to browse files</span>
                  </>
                )}
             </div>
          )}

          {/* Staging Area */}
          {rows.length > 0 && (
             <div className="flex flex-col gap-6">
                
                {/* Global Settings Panel */}
                <div className="p-5 rounded-xl border flex flex-col md:flex-row gap-6" style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}>
                  {/* Visibility options */}
                  <div className="flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-secondary)' }}>
                      Batch Access Level
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {VISIBILITY_OPTIONS.map(opt => {
                        const active = globalVisibility === opt.value;
                        const Icon = opt.icon;
                        return (
                          <button
                            key={opt.value}
                            onClick={() => setGlobalVisibility(opt.value)}
                            disabled={isUploading}
                            className={cn("flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200", isUploading ? "opacity-50 cursor-not-allowed" : "")}
                            style={{
                              borderColor: active ? opt.color : 'var(--border)',
                              backgroundColor: active ? opt.bgColor : 'var(--bg-card,#fff)',
                            }}
                          >
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors" style={{ backgroundColor: active ? `${opt.color}20` : 'var(--border)' }}>
                              <Icon className="w-4 h-4" style={{ color: active ? opt.color : 'var(--text-secondary)' }} />
                            </div>
                            <span className="text-sm font-medium" style={{ color: active ? opt.color : 'var(--text-primary)' }}>{opt.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Users Selection List (Only if assigned) */}
                  {globalVisibility === 'assigned' && (
                    <div className="flex-1 flex flex-col border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-6" style={{ borderColor: 'var(--border)' }}>
                       <div className="flex items-center justify-between mb-2">
                         <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                           Assign Users {selectedUserIds.size > 0 && <span className="ml-1 text-[#3B82F6]">({selectedUserIds.size})</span>}
                         </p>
                       </div>
                       
                       <div className="relative mb-2 flex-none">
                         <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: 'var(--text-secondary)' }} />
                         <input
                           type="text"
                           placeholder="Search users…"
                           value={userSearch}
                           onChange={e => setUserSearch(e.target.value)}
                           disabled={isUploading}
                           className="w-full pl-8 pr-3 py-1.5 text-sm rounded border outline-none"
                           style={{ backgroundColor: 'var(--bg-card,#fff)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                         />
                       </div>

                       <div className="flex-1 overflow-y-auto max-h-40 pr-1 space-y-1 custom-scrollbar">
                         {loadingUsers ? (
                           <div className="flex items-center justify-center py-4">
                             <Loader2 className="w-5 h-5 animate-spin text-[#3B82F6]" />
                           </div>
                         ) : filteredUsers.length === 0 ? (
                           <div className="text-center py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>No users found.</div>
                         ) : (
                           filteredUsers.map(user => {
                             const selected = selectedUserIds.has(user.id);
                             return (
                               <button
                                 key={user.id}
                                 onClick={() => toggleUser(user.id)}
                                 disabled={isUploading}
                                 className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors text-left"
                                 style={{ backgroundColor: selected ? '#3B82F615' : 'transparent' }}
                               >
                                 <div className="w-4 h-4 rounded border flex flex-none items-center justify-center transition-colors"
                                   style={{ borderColor: selected ? '#3B82F6' : 'var(--border)', backgroundColor: selected ? '#3B82F6' : 'transparent' }}>
                                   {selected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                                 </div>
                                 <div className="min-w-0 flex-1">
                                   <p className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>{user.full_name || user.email}</p>
                                 </div>
                               </button>
                             );
                           })
                         )}
                       </div>
                    </div>
                  )}
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
             <button onClick={() => { onClose(); router.refresh(); }} disabled={isUploading || isParsing} className="px-4 py-2 rounded-lg text-sm font-medium border transition-colors hover:bg-[var(--bg)] disabled:opacity-50" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
               {successCount > 0 ? 'Close' : 'Cancel'}
             </button>
             <button 
               onClick={handleSubmit} 
               disabled={isUploading || isParsing || rows.length === 0 || rows.every(r => r.status === 'success') || (globalVisibility === 'assigned' && selectedUserIds.size === 0)} 
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
