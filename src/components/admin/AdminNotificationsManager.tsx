'use client';

import { useState, useEffect } from 'react';
import { Loader2, AlertCircle, Send, CheckCircle2, XCircle, Clock } from 'lucide-react';
import type { SystemNotification } from '@/types';
import toast from 'react-hot-toast';

export default function AdminNotificationsManager() {
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function fetchNotifications() {
    try {
      setLoading(true);
      const r = await fetch('/api/admin/notifications');
      const d = await r.json();
      if (d.error) throw new Error(d.error);
      setNotifications(d.notifications || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      setSubmitting(true);
      const r = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newMessage }),
      });
      const d = await r.json();
      if (d.error) throw new Error(d.error);

      toast.success('Notification broadcasted successfully');
      setNewMessage('');
      fetchNotifications(); // refresh list
    } catch (err: any) {
      toast.error(`Failed to send: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleStatus(id: string, currentStatus: boolean) {
    try {
      const r = await fetch(`/api/admin/notifications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus }),
      });
      const d = await r.json();
      if (d.error) throw new Error(d.error);
      
      toast.success(currentStatus ? 'Notification deactivated' : 'Notification activated');
      fetchNotifications(); // refresh list
    } catch (err: any) {
      toast.error(`Failed to update: ${err.message}`);
    }
  }

  if (loading && notifications.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 gap-3">
        <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#8B6914' }} />
        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Loading notifications...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Compose Box */}
      <div className="rounded-xl border p-5" style={{ backgroundColor: 'var(--bg-card, #fff)', borderColor: 'var(--border)' }}>
        <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)', fontFamily: 'Lora, Georgia, serif' }}>
          Broadcast Announcement
        </h2>
        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
          Write a message to display to all users. Pushing a new notification automatically deactivates older ones.
        </p>

        <form onSubmit={handleCreate} className="space-y-4">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your announcement here..."
            className="w-full rounded-lg border p-3 text-sm outline-none resize-y min-h-[100px]"
            style={{ backgroundColor: 'var(--bg, #FAF8F4)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            disabled={submitting}
            required
            maxLength={500}
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting || !newMessage.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity disabled:opacity-50"
              style={{ backgroundColor: '#8B6914' }}
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Send Broadcast
            </button>
          </div>
        </form>
      </div>

      {/* History List */}
      <div>
        <h3 className="text-base font-semibold mb-3" style={{ color: 'var(--text-primary)', fontFamily: 'Lora, Georgia, serif' }}>
          Announcement History
        </h3>

        {error && (
          <div className="flex items-center gap-2 p-4 rounded-lg bg-red-50 text-red-600 text-sm mb-4">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {notifications.length === 0 && !error ? (
          <div className="text-center py-8 rounded-xl border border-dashed" style={{ borderColor: 'var(--border)' }}>
            <p className="text-sm italic" style={{ color: 'var(--text-secondary)' }}>No notifications have been created yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => (
              <div
                key={n.id}
                className="flex items-start justify-between rounded-xl border p-4 transition-colors"
                style={{ backgroundColor: 'var(--bg-card, #fff)', borderColor: 'var(--border)' }}
              >
                <div className="flex-1 min-w-0 pr-4">
                  <p className="text-sm mb-2 whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>
                    {n.message}
                  </p>
                  <div className="flex text-xs items-center gap-4" style={{ color: 'var(--text-secondary)' }}>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(n.created_at).toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1 font-medium" style={{ color: n.is_active ? '#10B981' : 'var(--text-secondary)' }}>
                      {n.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                <div className="flex-none">
                  <button
                    onClick={() => handleToggleStatus(n.id, n.is_active)}
                    className="px-3 py-1.5 rounded-md text-xs font-medium border transition-colors hover:bg-slate-50"
                    style={n.is_active 
                      ? { color: '#EF4444', borderColor: '#EF444430', backgroundColor: '#EF444410' }
                      : { color: '#10B981', borderColor: '#10B98130', backgroundColor: '#10B98110' }}
                  >
                    {n.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
