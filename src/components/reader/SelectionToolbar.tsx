'use client';

import { Copy, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import type { HighlightColor } from '@/types';

interface Props {
  x: number;
  y: number;
  text: string;
  cfiRange: string;
  onHighlight: (color: HighlightColor) => void;
  onAskAI: () => void;
  onClose: () => void;
}

const COLORS: { id: HighlightColor; hex: string }[] = [
  { id: 'yellow', hex: '#FFE066' },
  { id: 'blue',   hex: '#93C5FD' },
  { id: 'green',  hex: '#86EFAC' },
  { id: 'pink',   hex: '#F87171' },
];

export default function SelectionToolbar({ x, y, text, onHighlight, onAskAI, onClose }: Props) {
  function handleCopy() {
    navigator.clipboard.writeText(text).catch(() => {});
    toast.success('Copied to clipboard');
    onClose();
  }

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
      {/* Highlight colors */}
      {COLORS.map((c) => (
        <button
          key={c.id}
          onClick={() => onHighlight(c.id)}
          className="w-5 h-5 rounded-full border-2 border-transparent hover:border-white transition-all hover:scale-110"
          style={{ backgroundColor: c.hex }}
          title={`Highlight ${c.id}`}
        />
      ))}

      {/* Divider */}
      <div className="w-px h-4 bg-[#444] mx-0.5" />

      {/* Ask AI */}
      <button
        onClick={onAskAI}
        className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium text-[#E8E6E0] hover:bg-white/10 transition-colors"
        title="Ask AI about this"
      >
        <Sparkles className="w-3 h-3" style={{ color: '#C9972A' }} />
        Ask AI
      </button>

      {/* Copy */}
      <button
        onClick={handleCopy}
        className="p-1 rounded text-[#A0998C] hover:text-[#E8E6E0] hover:bg-white/10 transition-colors"
        title="Copy text"
      >
        <Copy className="w-3.5 h-3.5" />
      </button>

      {/* Tooltip caret */}
      <div
        className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#1C1C1E] border-r border-b border-[#333] rotate-45"
      />
    </div>
  );
}
