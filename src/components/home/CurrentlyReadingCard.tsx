'use client';

import Link from 'next/link';
import { BookOpen, Clock } from 'lucide-react';
import type { ReadingProgress } from '@/types';
import { formatReadingDate } from '@/lib/utils';

interface Props {
  progress: ReadingProgress | null;
}

export default function CurrentlyReadingCard({ progress }: Props) {
  if (!progress || !progress.book) {
    return (
      <div
        className="rounded-xl border p-6 text-center"
        style={{ backgroundColor: 'var(--bg-card, #fff)', borderColor: 'var(--border)' }}
      >
        <BookOpen className="w-8 h-8 mx-auto mb-3 opacity-30" style={{ color: 'var(--text-secondary)' }} />
        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>No book in progress</p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
          Head to your library to start reading
        </p>
        <Link
          href="/library"
          className="inline-block mt-4 px-4 py-2 rounded text-sm font-medium text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#8B6914' }}
        >
          Browse Library
        </Link>
      </div>
    );
  }

  const book = progress.book as any;
  const progressPct = Math.round(progress.progress_percent);

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ backgroundColor: 'var(--bg-card, #fff)', borderColor: 'var(--border)' }}
    >
      <div className="p-6">
        <p className="text-xs font-medium uppercase tracking-wider mb-4" style={{ color: 'var(--text-secondary)' }}>
          Currently Reading
        </p>

        <div className="flex gap-4">
          {/* Book cover */}
          <div
            className="flex-none w-16 h-24 rounded overflow-hidden bg-[#E5E0D8] flex items-center justify-center"
            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
          >
            {book.cover_url ? (
              <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
            ) : (
              <BookOpen className="w-6 h-6 opacity-40" style={{ color: 'var(--text-secondary)' }} />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h2
              className="font-semibold text-base leading-snug truncate"
              style={{ fontFamily: 'Lora, Georgia, serif', color: 'var(--text-primary)' }}
            >
              {book.title}
            </h2>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>{book.author}</p>

            {progress.chapter_title && (
              <p className="text-xs mt-2 truncate" style={{ color: 'var(--text-muted, #9B9890)' }}>
                {progress.chapter_title}
              </p>
            )}

            {/* Progress bar */}
            <div className="mt-3">
              <div
                className="w-full h-1.5 rounded-full overflow-hidden"
                style={{ backgroundColor: 'var(--border)' }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%`, backgroundColor: '#8B6914' }}
                />
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {progressPct}% complete
                </span>
                <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted, #9B9890)' }}>
                  <Clock className="w-3 h-3" />
                  {formatReadingDate(progress.last_read_at)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer action */}
      <div className="px-6 pb-5">
        <Link
          href={`/read/${progress.book_id}`}
          className="block w-full text-center py-2.5 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#8B6914' }}
        >
          Continue Reading
        </Link>
      </div>
    </div>
  );
}
