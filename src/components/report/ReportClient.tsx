'use client';

import { useState, useEffect, useRef } from 'react';
import type { Profile, BugReport } from '@/types';
import { Loader2, Plus, AlertCircle, CheckCircle2, ChevronRight, Inbox, ShieldAlert, Image as ImageIcon, X, FileText } from 'lucide-react';
import ReportChat from './ReportChat';
import { createClient } from '@/lib/supabase/client';
import Tesseract from 'tesseract.js';
import toast from 'react-hot-toast';

interface Props {
  user: Profile;
}

export default function ReportClient({ user }: Props) {
  const [activeTab, setActiveTab] = useState<'active' | 'resolved'>('active');
  const [reports, setReports] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  // New report form state
  const [isCreating, setIsCreating] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [ocrText, setOcrText] = useState('');
  const [isProcessingOcr, setIsProcessingOcr] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supabase = createClient();

  useEffect(() => {
    fetchReports(activeTab);
    setSelectedReportId(null);
  }, [activeTab]);

  async function fetchReports(status: string) {
    setLoading(true);
    try {
      const r = await fetch(`/api/reports?status=${status}`);
      const d = await r.json();
      setReports(d.reports || []);
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
      const result = await Tesseract.recognize(file, 'eng');
      const text = result.data.text.trim();
      if (text) {
        setOcrText(text);
      }
    } catch (err) {
      console.error('OCR Error:', err);
      toast.error('Failed to extract text from image');
    } finally {
      setIsProcessingOcr(false);
    }
  }

  async function handleCreateReport(e: React.FormEvent) {
    e.preventDefault();
    if (!newSubject.trim() || !newMessage.trim()) return;

    setSubmitting(true);
    try {
      let finalScreenshotUrl = null;

      if (uploadFile) {
        const fileExt = uploadFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('bug_screenshots')
          .upload(filePath, uploadFile);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('bug_screenshots')
          .getPublicUrl(filePath);

        finalScreenshotUrl = publicUrlData.publicUrl;
      }

      const r = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: newSubject,
          initialMessage: newMessage,
          screenshotUrl: finalScreenshotUrl,
          ocrText: ocrText || null
        })
      });
      const d = await r.json();
      if (d.error) throw new Error(d.error);

      setIsCreating(false);
      setNewSubject('');
      setNewMessage('');
      setUploadFile(null);
      setOcrText('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      setActiveTab('active');
      fetchReports('active');
      setSelectedReportId(d.report.id);
    } catch (err: any) {
      console.error(err);
      toast.error(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  }

  if (selectedReportId) {
    return (
      <ReportChat 
        reportId={selectedReportId} 
        onBack={() => setSelectedReportId(null)} 
        isAdmin={false}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto w-full p-4 md:p-8 flex flex-col min-h-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#EF444420' }}>
          <ShieldAlert className="w-5 h-5 text-red-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'Lora, Georgia, serif' }}>
            Report an Issue
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Tell us about any glitches or problems. We carefully read every report.
          </p>
        </div>
      </div>

      {!isCreating ? (
        <div className="flex bg-slate-100 rounded-lg p-1 w-full max-w-sm mb-6" style={{ backgroundColor: 'var(--bg-sidebar)' }}>
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'active' ? 'bg-white shadow' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Active Issues
          </button>
          <button
            onClick={() => setActiveTab('resolved')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'resolved' ? 'bg-white shadow' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Archive
          </button>
        </div>
      ) : null}

      {isCreating ? (
        <div className="flex-1 bg-white border rounded-2xl p-6 shadow-sm mb-6">
          <h2 className="text-lg font-bold mb-4 font-serif">Open a New Report</h2>
          <form onSubmit={handleCreateReport} className="space-y-4 max-w-2xl">
            <div>
              <label className="block text-sm font-medium mb-1">Subject</label>
              <input 
                type="text" 
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                placeholder="Briefly describe the issue..."
                className="w-full border rounded-lg p-3 text-sm outline-none focus:border-yellow-600 transition-colors"
                maxLength={100}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Detailed Description</label>
              <textarea 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="What exactly happened?"
                className="w-full border rounded-lg p-3 text-sm outline-none focus:border-yellow-600 transition-colors h-32 resize-none"
                maxLength={2000}
                required
              />
            </div>

            {/* Upload Area */}
            <div className="bg-slate-50 border rounded-xl p-4">
              <label className="block text-sm font-medium mb-3">Attach Screenshot</label>
              
              {uploadFile ? (
                <div className="flex items-start gap-3 bg-red-50/50 border border-red-100 p-3 rounded-lg relative">
                  <button 
                    type="button"
                    onClick={() => { setUploadFile(null); setOcrText(''); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                    className="absolute top-2 right-2 text-red-500 hover:text-red-700 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="w-10 h-10 bg-red-100 rounded flex items-center justify-center shrink-0">
                    <ImageIcon className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="text-sm text-slate-700">
                    <span className="font-semibold block truncate max-w-[250px] md:max-w-md">{uploadFile.name}</span>
                    {isProcessingOcr ? (
                      <span className="flex items-center gap-1.5 mt-1 text-red-600 font-medium">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Extracting text via OCR...
                      </span>
                    ) : ocrText ? (
                      <span className="flex items-center gap-1.5 mt-1 text-emerald-600 font-medium">
                        <FileText className="w-3.5 h-3.5" /> Text extracted successfully
                      </span>
                    ) : (
                      <span className="mt-1 block text-slate-500">Image attached ready for upload</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
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
                    className="flex items-center gap-2 px-4 py-2 border bg-white hover:bg-slate-50 rounded-lg text-sm font-medium text-slate-600 transition-colors"
                  >
                    <ImageIcon className="w-4 h-4" /> Upload Image
                  </button>
                  <span className="text-xs text-slate-500">Helps us squash the bug faster!</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pt-4">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-5 py-2.5 rounded-xl border text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-opacity flex items-center gap-2"
                style={{ backgroundColor: '#EF4444' }}
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Ticket'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="flex-1 bg-white border rounded-2xl shadow-sm overflow-hidden flex flex-col">
          {/* Header Action */}
          <div className="p-4 border-b flex justify-between items-center bg-slate-50">
            <h3 className="font-semibold text-sm">
              {activeTab === 'active' ? 'Your Ongoing Reports' : 'Resolved Archive'}
            </h3>
            {activeTab === 'active' && (
              <button 
                onClick={() => setIsCreating(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
              >
                <Plus className="w-4 h-4" /> New Report
              </button>
            )}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            ) : reports.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400">
                <Inbox className="w-12 h-12 mb-3" strokeWidth={1} />
                <p>No {activeTab} reports found.</p>
              </div>
            ) : (
              <ul className="divide-y">
                {reports.map((report) => (
                  <li key={report.id}>
                    <button
                      onClick={() => setSelectedReportId(report.id)}
                      className="w-full text-left px-6 py-4 hover:bg-slate-50 transition-colors flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {activeTab === 'active' ? (
                            <AlertCircle className="w-4 h-4 text-orange-500" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          )}
                          <span className="font-medium text-slate-900">{report.subject}</span>
                        </div>
                        <p className="text-xs text-slate-500">
                          Updated {new Date(report.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
