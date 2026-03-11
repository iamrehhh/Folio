'use client';

import Link from 'next/link';
import { Highlighter, BookMarked, ArrowRight } from 'lucide-react';
import { highlightColorClass, truncate } from '@/lib/utils';
import type { Highlight, VocabWord } from '@/types';

// ─── Recent Highlights ───────────────────────────────────────────

interface RecentHighlightsProps {
  highlights: Highlight[];
}

export function RecentHighlights({ highlights }: RecentHighlightsProps) {
  return (
    <div
      className="rounded-xl border p-5"
      style={{ backgroundColor: 'var(--bg-card, #fff)', borderColor: 'var(--border)' }}
    >
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
          Recent Highlights
        </p>
        <Link
          href="/highlights"
          className="flex items-center gap-1 text-xs hover:underline"
          style={{ color: '#8B6914' }}
        >
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {highlights.length === 0 ? (
        <div className="text-center py-6">
          <Highlighter className="w-6 h-6 mx-auto mb-2 opacity-30" style={{ color: 'var(--text-secondary)' }} />
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>No highlights yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {highlights.map((h) => (
            <div key={h.id} className="flex gap-3">
              <div
                className={`flex-none w-1 rounded-full self-stretch ${highlightColorClass(h.color)}`}
                style={{ minHeight: '2rem' }}
              />
              <div className="min-w-0">
                <p
                  className="text-sm leading-relaxed"
                  style={{ fontFamily: 'Lora, Georgia, serif', color: 'var(--text-primary)' }}
                >
                  &ldquo;{truncate(h.text, 120)}&rdquo;
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  {(h.book as any)?.title ?? 'Unknown book'}
                  {h.chapter_title ? ` · ${truncate(h.chapter_title, 30)}` : ''}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Recent Vocab ───────────────────────────────────────────────

interface RecentVocabProps {
  words: VocabWord[];
}

export function RecentVocab({ words }: RecentVocabProps) {
  return (
    <div
      className="rounded-xl border p-5"
      style={{ backgroundColor: 'var(--bg-card, #fff)', borderColor: 'var(--border)' }}
    >
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
          Saved Vocabulary
        </p>
        <Link
          href="/vocab"
          className="flex items-center gap-1 text-xs hover:underline"
          style={{ color: '#8B6914' }}
        >
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {words.length === 0 ? (
        <div className="text-center py-4">
          <BookMarked className="w-6 h-6 mx-auto mb-2 opacity-30" style={{ color: 'var(--text-secondary)' }} />
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>No words saved yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {words.map((w) => (
            <div key={w.id}>
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {w.word}
                </span>
                {w.part_of_speech && (
                  <span className="text-xs italic" style={{ color: 'var(--text-secondary)' }}>
                    {w.part_of_speech}
                  </span>
                )}
              </div>
              <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {truncate(w.definition, 80)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Default exports for named use
export default RecentHighlights;
