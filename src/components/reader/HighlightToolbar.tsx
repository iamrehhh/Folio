'use client';

import { Trash2 } from 'lucide-react';

interface Props {
  x: number;
  y: number;
  onDelete: () => void;
  onClose: () => void;
}

export default function HighlightToolbar({ x, y, onDelete, onClose }: Props) {
  return (
    <div
      className="selection-toolbar fixed z-50 flex items-center gap-1 px-2 py-1.5 rounded-lg bg-[#1C1C1E] border border-[#333] shadow-popover"
      style={{
        left: x,
        top: y - 48,
        transform: 'translateX(-50%)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={() => { onDelete(); onClose(); }}
        className="flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium text-red-400 hover:bg-white/10 transition-colors"
        title="Remove highlight"
      >
        <Trash2 className="w-3.5 h-3.5" />
        Remove highlight
      </button>

      {/* Tooltip caret */}
      <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#1C1C1E] border-r border-b border-[#333] rotate-45" />
    </div>
  );
}
