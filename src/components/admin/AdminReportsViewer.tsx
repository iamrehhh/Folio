'use client';

import { useState, useEffect } from 'react';
import type { BugReport } from '@/types';
import { Loader2, AlertCircle, CheckCircle2, ChevronRight, Inbox, Trash2 } from 'lucide-react';
import ReportChat from '../report/ReportChat';
import toast from 'react-hot-toast';

export default function AdminReportsViewer() {
  const [activeTab, setActiveTab] = useState<'active' | 'resolved'>('active');
  const [reports, setReports] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [resolveConfirmId, setResolveConfirmId] = useState<string | null>(null);

  useEffect(() => {
    fetchReports(activeTab);
    setSelectedReportId(null);
    setSelectedIds(new Set());
  }, [activeTab]);

  function toggleSelect(id: string) {
    const s = new Set(selectedIds);
    if (s.has(id)) s.delete(id);
    else s.add(id);
    setSelectedIds(s);
  }

  function selectAll() {
    if (selectedIds.size === reports.length && reports.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(reports.map(r => r.id)));
    }
  }

  function handleBulkDeleteClick() {
    if (selectedIds.size === 0) return;
    setShowBulkDeleteModal(true);
  }

  async function confirmBulkDelete() {
    if (selectedIds.size === 0) return;
    
    setDeleting(true);
    try {
      const r = await fetch('/api/admin/reports', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) })
      });
      const d = await r.json();
      if (d.error) throw new Error(d.error);
      
      toast.success(`Deleted ${selectedIds.size} reports`);
      setSelectedIds(new Set());
      setShowBulkDeleteModal(false);
      fetchReports(activeTab);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  }

  async function fetchReports(status: string) {
    setLoading(true);
    try {
      const r = await fetch(`/api/admin/reports?status=${status}`);
      const d = await r.json();
      setReports(d.reports || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function confirmResolve() {
    if (!resolveConfirmId) return;
    try {
      const r = await fetch(`/api/admin/reports/${resolveConfirmId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'resolved' })
      });
      const d = await r.json();
      if (d.error) throw new Error(d.error);
      
      toast.success('Report resolved successfully');
      setSelectedReportId(null);
      setResolveConfirmId(null);
      fetchReports(activeTab);
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  if (selectedReportId) {
    return (
      <div className="bg-slate-50 p-4 border rounded-2xl h-[80vh] relative">
        <ReportChat 
          reportId={selectedReportId} 
          onBack={() => { setSelectedReportId(null); fetchReports(activeTab); }} 
          isAdmin={true}
          onResolve={activeTab === 'active' ? () => setResolveConfirmId(selectedReportId) : undefined}
        />

        {resolveConfirmId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl border shadow-2xl p-6 transition-all" style={{ backgroundColor: 'var(--bg-card, #fff)', borderColor: 'var(--border)', animation: 'popIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)', fontFamily: 'Lora, Georgia, serif' }}>Resolve Issue</h3>
                <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                  Mark this report as resolved? It will be moved to the archive and locked for both you and the user.
                </p>
                
                <div className="flex w-full gap-3">
                  <button
                    onClick={() => setResolveConfirmId(null)}
                    className="flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors hover:bg-black/5"
                    style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmResolve}
                    className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90 flex items-center justify-center gap-2"
                    style={{ backgroundColor: '#10B981' }}
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </div>
            <style jsx>{`@keyframes popIn { from { opacity: 0; transform: scale(0.9) translateY(15px); } to { opacity: 1; transform: scale(1) translateY(0); } }`}</style>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border p-5" style={{ backgroundColor: 'var(--bg-card, #fff)', borderColor: 'var(--border)' }}>
        <h2 className="text-lg font-semibold mb-6" style={{ color: 'var(--text-primary)', fontFamily: 'Lora, Georgia, serif' }}>
          User Bug Reports
        </h2>

        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div className="flex bg-slate-100 rounded-lg p-1 w-full max-w-sm" style={{ backgroundColor: 'var(--bg-sidebar)' }}>
            <button
              onClick={() => setActiveTab('active')}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'active' ? 'bg-white shadow text-red-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Active Issues
            </button>
            <button
              onClick={() => setActiveTab('resolved')}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'resolved' ? 'bg-white shadow text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Resolved Archive
            </button>
          </div>

          {reports.length > 0 && (
            <div className="flex items-center gap-4 bg-slate-50 border px-3 py-1.5 rounded-lg shadow-sm">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={selectedIds.size === reports.length && reports.length > 0}
                  onChange={selectAll}
                  className="w-4 h-4 rounded text-red-600 outline-none cursor-pointer"
                />
                Select All
              </label>
              
              {selectedIds.size > 0 && (
                <button 
                  onClick={handleBulkDeleteClick}
                  disabled={deleting}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded-md text-sm font-bold transition-colors shadow-sm"
                >
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Delete ({selectedIds.size})
                </button>
              )}
            </div>
          )}
        </div>

        {/* List */}
        <div className="border rounded-xl overflow-hidden">
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400">
              <Inbox className="w-12 h-12 mb-3" strokeWidth={1.5} />
              <p>No {activeTab} reports found.</p>
            </div>
          ) : (
            <ul className="divide-y bg-white">
              {reports.map((report) => (
                <li key={report.id} className="flex items-center hover:bg-slate-50 transition-colors">
                  <div className="pl-6 pr-2 py-4">
                    <input 
                      type="checkbox" 
                      checked={selectedIds.has(report.id)}
                      onChange={() => toggleSelect(report.id)}
                      className="w-4 h-4 rounded text-red-600 outline-none cursor-pointer"
                    />
                  </div>
                  <button
                    onClick={() => setSelectedReportId(report.id)}
                    className="flex-1 text-left px-4 py-4 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {activeTab === 'active' ? (
                          <AlertCircle className="w-4 h-4 text-red-500" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        )}
                        <span className="font-semibold text-slate-900">{report.subject}</span>
                      </div>
                      <p className="text-xs text-slate-500 flex items-center gap-2">
                        <span>Reported by: <strong>{report.user?.full_name || report.user?.email || 'Unknown User'}</strong></span>
                        <span>•</span>
                        <span>Updated: {new Date(report.updated_at).toLocaleString()}</span>
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

      {/* Bulk Delete Confirm Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border shadow-2xl p-6 transition-all" style={{ backgroundColor: 'var(--bg-card, #fff)', borderColor: 'var(--border)', animation: 'popIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)', fontFamily: 'Lora, Georgia, serif' }}>Delete Reports</h3>
              <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                Are you sure you want to permanently delete {selectedIds.size} selected {selectedIds.size === 1 ? 'report' : 'reports'}? This removes them for the users as well.
              </p>
              
              <div className="flex w-full gap-3">
                <button
                  onClick={() => setShowBulkDeleteModal(false)}
                  disabled={deleting}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors hover:bg-black/5"
                  style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmBulkDelete}
                  disabled={deleting}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ backgroundColor: '#EF4444' }}
                >
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete Permanently'}
                </button>
              </div>
            </div>
          </div>
          <style jsx>{`@keyframes popIn { from { opacity: 0; transform: scale(0.9) translateY(15px); } to { opacity: 1; transform: scale(1) translateY(0); } }`}</style>
        </div>
      )}
    </div>
  );
}
