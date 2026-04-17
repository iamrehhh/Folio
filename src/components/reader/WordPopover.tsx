'use client';

import { useEffect, useState } from 'react';
import { X, BookMarked, Sparkles, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { DictionaryEntry } from '@/types';

interface Props {
  word: string;
  paragraph: string;
  x: number;
  y: number;
  bookId: string;
  chapterIndex: number;
  chapterTitle?: string;
  onClose: () => void;
  onAskAI: (word: string) => void;
}

export default function WordPopover({
  word, paragraph, x, y, bookId, chapterIndex, chapterTitle, onClose, onAskAI
}: Props) {
  const [isLoading, setIsLoading] = useState(true);
  const [dictionary, setDictionary] = useState<DictionaryEntry | null>(null);
  const [aiContext, setAIContext] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Position: keep within viewport horizontally
  const posX = Math.min(Math.max(10, x - 160), typeof window !== 'undefined' ? window.innerWidth - 340 : x);

  // Dynamic vertical positioning: flip to top if clicked in the lower half of viewport
  const isBottomHalf = typeof window !== 'undefined' && y > window.innerHeight / 2;
  const topPos = isBottomHalf ? 'auto' : `${y + 20}px`;
  const bottomPos = isBottomHalf ? `${window.innerHeight - y + 20}px` : 'auto';

  useEffect(() => {
    async function fetchDefinition() {
      try {
        const params = new URLSearchParams({
          word,
          paragraph: paragraph.slice(0, 500),
        });
        const res = await fetch(`/api/dictionary?${params}`);
        const data = await res.json();
        setDictionary(data.dictionary);
        setAIContext(data.aiContext);
      } catch {
        // silently fail
      } finally {
        setIsLoading(false);
      }
    }
    fetchDefinition();
  }, [word, paragraph]);

  async function handleSaveWord() {
    if (!dictionary) return;
    setIsSaving(true);
    try {
      const meaning = dictionary.meanings?.[0];
      const def = meaning?.definitions?.[0];
      const res = await fetch('/api/vocab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId,
          word,
          definition: def?.definition ?? 'No definition available',
          pronunciation: dictionary.phonetic ?? null,
          partOfSpeech: meaning?.partOfSpeech ?? null,
          aiContext: aiContext ?? null,
          sourceSentence: paragraph.slice(0, 300),
          chapterIndex,
          chapterTitle,
        }),
      });
      if (!res.ok) throw new Error();
      setIsSaved(true);
      toast.success(`"${word}" saved to vocabulary`);
    } catch {
      toast.error('Failed to save word');
    } finally {
      setIsSaving(false);
    }
  }

  const firstMeaning = dictionary?.meanings?.[0];
  const firstDef = firstMeaning?.definitions?.[0];

  return (
    <div
      className="word-popover fixed z-50 w-80 rounded-xl border shadow-popover overflow-hidden"
      style={{
        left: posX,
        top: topPos,
        bottom: bottomPos,
        backgroundColor: 'var(--bg-card, #fff)',
        borderColor: 'var(--border)',
        boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-start justify-between px-4 pt-4 pb-2">
        <div>
          <span
            className="text-lg font-semibold leading-none"
            style={{ fontFamily: 'Lora, Georgia, serif', color: 'var(--text-primary)' }}
          >
            {word}
          </span>
          {dictionary?.phonetic && (
            <span className="ml-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              {dictionary.phonetic}
            </span>
          )}
          {firstMeaning?.partOfSpeech && (
            <p className="text-xs italic mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              {firstMeaning.partOfSpeech}
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-[var(--border)] transition-colors"
        >
          <X className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
        </button>
      </div>

      {/* Body */}
      <div className="px-4 pb-4">
        {isLoading ? (
          <div className="flex items-center gap-2 py-3">
            <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#8B6914' }} />
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Looking up definition…</span>
          </div>
        ) : (
          <>
            {/* AI Contextual Meaning (Primary) */}
            {aiContext ? (
              <div className="mb-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <Sparkles className="w-3.5 h-3.5" style={{ color: '#8B6914' }} />
                  <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#8B6914' }}>
                    Contextual Meaning
                  </span>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                  {aiContext}
                </p>
              </div>
            ) : firstDef ? (
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                {firstDef.definition}
              </p>
            ) : (
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                No definition found.
              </p>
            )}

            {/* Standard Dictionary definition (Secondary) */}
            {aiContext && firstDef && (
              <div
                className="mt-2 pt-3 border-t"
                style={{ borderColor: 'var(--border)' }}
              >
                <div className="flex items-center gap-1 mb-1.5">
                  <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                    Standard Definition
                  </span>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {firstDef.definition}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleSaveWord}
                disabled={isSaving || isSaved || !dictionary}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: '#8B6914' }}
              >
                <BookMarked className="w-3.5 h-3.5" />
                {isSaved ? 'Saved ✓' : isSaving ? 'Saving…' : 'Save Word'}
              </button>
              <button
                onClick={() => onAskAI(word)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium border transition-colors hover:bg-[var(--bg)]"
                style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Ask AI more
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
