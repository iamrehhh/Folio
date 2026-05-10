'use client';

import { X, AlertTriangle, Loader2 } from 'lucide-react';

interface Props {
  count: number;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

export default function ConfirmDeleteModal({ count, onClose, onConfirm, isDeleting }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative z-10 w-full max-w-sm rounded-2xl border shadow-popover overflow-hidden"
        style={{ backgroundColor: 'var(--bg-card, #fff)', borderColor: 'var(--border)' }}
      >
        <div className="p-6">
          <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4 mx-auto" style={{ backgroundColor: '#EF444415' }}>
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          
          <h3 className="text-lg font-semibold text-center mb-2" style={{ color: 'var(--text-primary)', fontFamily: 'Lora, Georgia, serif' }}>
            Delete {count} {count === 1 ? 'Book' : 'Books'}?
          </h3>
          
          <p className="text-sm text-center mb-6" style={{ color: 'var(--text-secondary)' }}>
            Are you sure you want to delete {count === 1 ? 'this book' : `these ${count} books`}? This action cannot be undone and will permanently remove {count === 1 ? 'it' : 'them'} from the library.
          </p>
          
          <div className="flex flex-col gap-2">
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: '#EF4444' }}
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {isDeleting ? 'Deleting...' : 'Yes, delete'}
            </button>
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="w-full py-2.5 rounded-xl text-sm font-semibold transition-colors hover:bg-[var(--border)] disabled:opacity-50"
              style={{ color: 'var(--text-secondary)' }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
