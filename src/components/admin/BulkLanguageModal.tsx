'use client';

import { useState } from 'react';
import { X, Globe, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  bookIds: string[];
  onClose: () => void;
  onSaved: () => void;
}

const LANGUAGES = ['English', 'Bengali', 'Hindi', 'Spanish', 'French', 'German', 'Other'];

export default function BulkLanguageModal({ bookIds, onClose, onSaved }: Props) {
  const [language, setLanguage] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/books', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookIds, language: language || null })
      });
      if (!res.ok) throw new Error('Failed to update language');
      toast.success('Language updated successfully');
      onSaved();
    } catch (err: any) {
      toast.error(err.message ?? 'Update failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative z-10 w-full max-w-sm rounded-2xl shadow-popover overflow-hidden"
        style={{ backgroundColor: 'var(--bg-card,#fff)' }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 className="font-semibold text-base flex items-center gap-2" style={{ fontFamily: 'Lora, Georgia, serif', color: 'var(--text-primary)' }}>
            <Globe className="w-4 h-4" style={{ color: '#8B6914' }} />
            Set Language
          </h2>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-[var(--border)] transition-colors">
            <X className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            You are setting the language for <strong>{bookIds.length}</strong> selected {bookIds.length === 1 ? 'book' : 'books'}.
          </p>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-[#8B6914]/30 appearance-none"
              style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            >
              <option value="">No language (Clear)</option>
              {LANGUAGES.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>
        </div>

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
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: '#8B6914' }}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
