'use client';

import { useState, useEffect, useRef } from 'react';
import type { BugReportMessage } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { Loader2, ArrowLeft, Image as ImageIcon, Send, X, FileText } from 'lucide-react';

interface Props {
  reportId: string;
  onBack: () => void;
  isAdmin: boolean;
  onResolve?: () => void;
}

export default function ReportChat({ reportId, onBack, isAdmin, onResolve }: Props) {
  const supabase = createClient();
  const [messages, setMessages] = useState<BugReportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [ocrText, setOcrText] = useState('');
  const [isProcessingOcr, setIsProcessingOcr] = useState(false);
  
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (inputText === '' && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [inputText]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 10000); // poor man's realtime
    return () => clearInterval(interval);
  }, [reportId]);

  useEffect(() => {
    // Mark as read when the user opens the chat
    if (!isAdmin) {
      fetch(`/api/reports/${reportId}/read`, { method: 'PATCH' }).catch(console.error);
    }
  }, [reportId, isAdmin]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function fetchMessages() {
    try {
      const r = await fetch(`/api/reports/${reportId}/messages`);
      const d = await r.json();
      if (!d.error) setMessages(d.messages || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadFile(file);
    setIsProcessingOcr(true);

    try {
      const Tesseract = (await import('tesseract.js')).default;
      const result = await Tesseract.recognize(file, 'eng');
      const text = result.data.text.trim();
      if (text) {
        setOcrText(text);
      }
    } catch (err) {
      console.error('OCR Error:', err);
    } finally {
      setIsProcessingOcr(false);
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!inputText.trim() && !uploadFile) return;

    setSending(true);
    try {
      let finalScreenshotUrl = null;

      // 1. Upload screenshot if exists
      if (uploadFile) {
        const fileExt = uploadFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const filePath = `${reportId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('bug_screenshots')
          .upload(filePath, uploadFile);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('bug_screenshots')
          .getPublicUrl(filePath);

        finalScreenshotUrl = publicUrlData.publicUrl;
      }

      // 2. Post to API
      const r = await fetch(`/api/reports/${reportId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: inputText.trim() || '[Screenshot Uploaded]',
          screenshotUrl: finalScreenshotUrl,
          ocrText: ocrText || null
        })
      });
      
      const d = await r.json();
      if (d.error) throw new Error(d.error);

      setInputText('');
      setUploadFile(null);
      setOcrText('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      fetchMessages();
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex-1 bg-white border rounded-2xl shadow-sm flex flex-col min-h-[60vh] h-[calc(100vh-150px)]">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between bg-slate-50 shrink-0">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        {isAdmin && onResolve && (
          <button 
            onClick={onResolve}
            className="px-3 py-1.5 rounded-lg text-sm font-medium bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
          >
            Mark as Resolved
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : (
          messages.map((m, i) => {
            // Assume user sending holds no email array constraint, but admin does, so sender difference
            // Actually, a simpler way is checking if 'admin' / sender_id
            // Just alternate styling slightly based on the index or sender
            // But we don't have current user ID here trivially. We can just highlight Admin or User based on sender details.
            return (
              <div key={m.id} className="flex flex-col mb-4">
                <div className="flex items-center gap-2 mb-1 pl-1">
                  <span className="text-xs font-semibold text-slate-700">
                    {m.sender?.full_name || 'System User'}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(m.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="bg-white border p-3 rounded-xl rounded-tl-none shadow-sm text-sm text-slate-800 w-fit max-w-[85%] whitespace-pre-wrap">
                  {m.message}
                  
                  {m.screenshot_url && (
                    <div className="mt-3 relative group">
                      <img 
                        src={m.screenshot_url} 
                        alt="Screenshot attachment" 
                        className="rounded-lg max-w-sm w-full border cursor-zoom-in group-hover:brightness-95 transition-all"
                        onClick={() => setEnlargedImage(m.screenshot_url as string)}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t shrink-0">
        {uploadFile && (
          <div className="mb-3 flex items-start gap-3 bg-red-50/50 border border-red-100 p-2.5 rounded-lg w-fit pr-10 relative">
            <button 
              onClick={() => { setUploadFile(null); setOcrText(''); if (fileInputRef.current) fileInputRef.current.value = ''; }}
              className="absolute top-2 right-2 text-red-400 hover:text-red-700 p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="w-10 h-10 bg-red-100 rounded flex items-center justify-center shrink-0">
              <ImageIcon className="w-5 h-5 text-red-600" />
            </div>
            <div className="text-xs text-slate-600">
              <span className="font-semibold text-slate-800 block truncate max-w-[200px]">{uploadFile.name}</span>
              {isProcessingOcr ? (
                <span className="flex items-center gap-1 mt-1 text-red-600">
                  <Loader2 className="w-3 h-3 animate-spin" /> Extracting text via OCR...
                </span>
              ) : ocrText ? (
                <span className="flex items-center gap-1 mt-1 text-emerald-600">
                  <FileText className="w-3 h-3" /> Text extracted successfully
                </span>
              ) : (
                <span className="mt-1 block">Image attached</span>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSend} className="flex gap-2 items-end">
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleFileSelect}
          />
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors shrink-0"
            title="Attach Screenshot"
          >
            <ImageIcon className="w-5 h-5" />
          </button>
          
          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (inputText.trim() || uploadFile) {
                  handleSend(e as unknown as React.FormEvent);
                }
              }
            }}
            placeholder="Type your message..."
            rows={1}
            className="flex-1 bg-slate-50 border border-slate-200 focus:border-red-400 focus:ring-1 focus:ring-red-400 p-3 rounded-xl text-sm outline-none transition-all resize-none appearance-none"
            style={{
              minHeight: '46px',
              maxHeight: '120px'
            }}
            disabled={sending}
          />
          
          <button
            type="submit"
            disabled={sending || (!inputText.trim() && !uploadFile)}
            className="p-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors shrink-0 disabled:opacity-50"
          >
            {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </form>
      </div>

      {enlargedImage && (
        <div 
          className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 md:p-8 backdrop-blur-sm cursor-zoom-out"
          onClick={() => setEnlargedImage(null)}
        >
          <img 
            src={enlargedImage} 
            alt="Enlarged view" 
            className="max-w-full max-h-full rounded-xl shadow-2xl object-contain border border-white/20"
            onClick={(e) => e.stopPropagation()}
          />
          <button 
            className="absolute top-4 right-4 md:top-8 md:right-8 p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-colors"
            onClick={() => setEnlargedImage(null)}
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  );
}
