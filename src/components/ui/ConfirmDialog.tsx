'use client';

import { Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({ title, message, confirmLabel = 'Delete', onConfirm, onCancel }: Props) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
        onClick={onCancel} 
      />

      {/* Dialog */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 15 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="relative z-10 w-full max-w-sm rounded-2xl border shadow-popover overflow-hidden"
        style={{ backgroundColor: 'var(--bg-card, #fff)', borderColor: 'var(--border)' }}
      >
        {/* Icon + Title */}
        <div className="px-6 pt-6 pb-4 flex flex-col items-center text-center">
          <motion.div 
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.05 }}
            className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
            style={{ backgroundColor: '#FEE2E2' }}>
            <Trash2 className="w-5 h-5 text-red-500" />
          </motion.div>
          <h3 className="font-semibold text-base mb-1"
            style={{ fontFamily: 'Lora, Georgia, serif', color: 'var(--text-primary)' }}>
            {title}
          </h3>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors hover:bg-[var(--border)] active:scale-[0.98]"
            style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ backgroundColor: '#DC2626', boxShadow: '0 4px 14px rgba(220, 38, 38, 0.3)' }}
          >
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
