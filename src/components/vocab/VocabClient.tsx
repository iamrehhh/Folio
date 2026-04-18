'use client';

import { useState, useMemo } from 'react';
import { Search, BookMarked, Trash2, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { formatReadingDate, downloadPDF, truncate } from '@/lib/utils';
import type { VocabWord, Book } from '@/types';

type SortBy = 'date' | 'alpha' | 'book';

interface Props {
  words: VocabWord[];
  books: Pick<Book, 'id' | 'title'>[];
  userId: string;
}

export default function VocabClient({ words: initialWords, books }: Props) {
  const router = useRouter();
  const [words, setWords] = useState(initialWords);
  const [search, setSearch] = useState('');
  const [filterBook, setFilterBook] = useState('all');
  const [sortBy, setSortBy] = useState<SortBy>('date');

  const filtered = useMemo(() => {
    let result = words.filter((w) => {
      if (filterBook !== 'all' && w.book_id !== filterBook) return false;
      if (search) {
        const q = search.toLowerCase();
        return w.word.includes(q) || w.definition.toLowerCase().includes(q);
      }
      return true;
    });

    if (sortBy === 'alpha') result = [...result].sort((a, b) => a.word.localeCompare(b.word));
    if (sortBy === 'book') result = [...result].sort((a, b) => a.book_id.localeCompare(b.book_id));
    return result;
  }, [words, search, filterBook, sortBy]);

  async function handleDelete(id: string) {
    try {
      const res = await fetch('/api/vocab', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error();
      setWords((prev) => prev.filter((w) => w.id !== id));
      toast.success('Word removed');
    } catch {
      toast.error('Failed to delete word');
    }
  }

  async function handleExport() {
    await downloadPDF(filtered, 'vocabulary.pdf');
  }

  return (
    <div className="max-w-4xl mx-auto px-8 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1
            className="text-2xl font-semibold"
            style={{ fontFamily: 'Lora, Georgia, serif', color: 'var(--text-primary)' }}
          >
            Vocabulary
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {words.length} word{words.length !== 1 ? 's' : ''} saved
          </p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-colors hover:bg-[var(--border)]"
          style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
        >
          <Download className="w-4 h-4" />
          Download PDF
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--text-secondary)' }} />
          <input
            type="text"
            placeholder="Search words…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border outline-none"
            style={{ backgroundColor: 'var(--bg-card, #fff)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          />
        </div>

        <select
          value={filterBook}
          onChange={(e) => setFilterBook(e.target.value)}
          className="px-3 py-2 text-sm rounded-lg border outline-none"
          style={{ backgroundColor: 'var(--bg-card, #fff)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
        >
          <option value="all">All Books</option>
          {books.map((b) => (
            <option key={b.id} value={b.id}>{b.title}</option>
          ))}
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortBy)}
          className="px-3 py-2 text-sm rounded-lg border outline-none"
          style={{ backgroundColor: 'var(--bg-card, #fff)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
        >
          <option value="date">Date Saved</option>
          <option value="alpha">A–Z</option>
          <option value="book">By Book</option>
        </select>
      </div>

      {/* Words list */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <BookMarked className="w-10 h-10 mx-auto mb-3 opacity-20" style={{ color: 'var(--text-secondary)' }} />
          <p className="font-medium" style={{ color: 'var(--text-primary)' }}>No words yet</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Click any word while reading to look it up and save it here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((word) => (
            <div
              key={word.id}
              className="rounded-xl border p-5 group"
              style={{ backgroundColor: 'var(--bg-card, #fff)', borderColor: 'var(--border)' }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-3 flex-wrap">
                    <span
                      className="text-xl font-semibold"
                      style={{ fontFamily: 'Lora, Georgia, serif', color: 'var(--text-primary)' }}
                    >
                      {word.word}
                    </span>
                    {word.pronunciation && (
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {word.pronunciation}
                      </span>
                    )}
                    {word.part_of_speech && (
                      <span
                        className="px-2 py-0.5 rounded text-xs border italic"
                        style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                      >
                        {word.part_of_speech}
                      </span>
                    )}
                  </div>

                  <p className="text-sm leading-relaxed mt-2" style={{ color: 'var(--text-primary)' }}>
                    {word.definition}
                  </p>

                  {word.ai_context && (
                    <p className="text-sm mt-2 italic" style={{ color: 'var(--text-secondary)' }}>
                      {word.ai_context}
                    </p>
                  )}

                  <div className="flex items-center gap-3 mt-3">
                    <span className="text-xs" style={{ color: 'var(--text-muted, #9B9890)' }}>
                      {(word.book as any)?.title ?? 'Unknown book'}
                      {word.chapter_title ? ` · ${truncate(word.chapter_title, 40)}` : ''}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--text-muted, #9B9890)' }}>
                      {formatReadingDate(word.created_at)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(word.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-red-50 transition-all"
                  title="Remove word"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
