'use client';

import { useState, useEffect } from 'react';
import { Loader2, AlertCircle, Star, MessageSquare, Filter, User, Eye, EyeOff } from 'lucide-react';

interface FeedbackItem {
  id: string;
  user_id: string;
  rating: number;
  feedback: string | null;
  show_on_homepage?: boolean;
  created_at: string;
  user: {
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  };
}

interface FeedbackStats {
  total_feedbacks: number;
  average_rating: number;
  distribution: Record<number, number>;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function StarDisplay({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className="transition-colors"
          style={{ width: size, height: size }}
          fill={star <= rating ? '#D4A017' : 'transparent'}
          stroke={star <= rating ? '#D4A017' : 'var(--border)'}
          strokeWidth={1.5}
        />
      ))}
    </div>
  );
}

function RatingBar({ stars, count, total }: { stars: number; count: number; total: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium w-4 text-right" style={{ color: 'var(--text-secondary)' }}>
        {stars}
      </span>
      <Star className="w-3 h-3 flex-none" fill="#D4A017" stroke="#D4A017" strokeWidth={1.5} />
      <div
        className="flex-1 h-2 rounded-full overflow-hidden"
        style={{ backgroundColor: 'var(--border)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: 'linear-gradient(90deg, #8B6914, #D4A017)',
          }}
        />
      </div>
      <span className="text-xs w-6 text-right" style={{ color: 'var(--text-secondary)' }}>
        {count}
      </span>
    </div>
  );
}

export default function AdminFeedbackViewer() {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterRating, setFilterRating] = useState<number | null>(null);

  useEffect(() => {
    fetchFeedback();
  }, []);

  async function fetchFeedback() {
    try {
      setLoading(true);
      const r = await fetch('/api/admin/feedback');
      const d = await r.json();
      if (d.error) throw new Error(d.error);
      setFeedbacks(d.feedbacks || []);
      setStats(d.stats || null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function toggleHomepage(id: string, currentStatus: boolean) {
    try {
      // Optimistic update
      setFeedbacks(prev =>
        prev.map(f => (f.id === id ? { ...f, show_on_homepage: !currentStatus } : f))
      );

      const r = await fetch('/api/admin/feedback', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, show_on_homepage: !currentStatus }),
      });
      const d = await r.json();
      if (d.error) throw new Error(d.error);
    } catch (err: any) {
      console.error('Failed to toggle feedback homepage status:', err);
      // Revert on error
      setFeedbacks(prev =>
        prev.map(f => (f.id === id ? { ...f, show_on_homepage: currentStatus } : f))
      );
      setError('Failed to update feedback visibility.');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 gap-3">
        <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#8B6914' }} />
        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Loading feedback…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-16 gap-3">
        <AlertCircle className="w-5 h-5 text-red-400" />
        <span className="text-sm text-red-500">{error}</span>
      </div>
    );
  }

  const filtered = filterRating
    ? feedbacks.filter(f => f.rating === filterRating)
    : feedbacks;

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Average Rating Card */}
          <div
            className="rounded-xl border p-5 flex flex-col items-center justify-center gap-2"
            style={{ backgroundColor: 'var(--bg-card, #fff)', borderColor: 'var(--border)' }}
          >
            <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
              Average Rating
            </span>
            <p
              className="text-3xl font-bold"
              style={{ color: 'var(--text-primary)', fontFamily: 'Lora, Georgia, serif' }}
            >
              {stats.average_rating > 0 ? stats.average_rating.toFixed(1) : '—'}
            </p>
            <StarDisplay rating={Math.round(stats.average_rating)} size={18} />
          </div>

          {/* Total Count Card */}
          <div
            className="rounded-xl border p-5 flex flex-col items-center justify-center gap-2"
            style={{ backgroundColor: 'var(--bg-card, #fff)', borderColor: 'var(--border)' }}
          >
            <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
              Total Responses
            </span>
            <p
              className="text-3xl font-bold"
              style={{ color: 'var(--text-primary)', fontFamily: 'Lora, Georgia, serif' }}
            >
              {stats.total_feedbacks}
            </p>
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {stats.total_feedbacks === 1 ? 'user review' : 'user reviews'}
            </span>
          </div>

          {/* Distribution Card */}
          <div
            className="rounded-xl border p-5"
            style={{ backgroundColor: 'var(--bg-card, #fff)', borderColor: 'var(--border)' }}
          >
            <span className="text-xs font-medium uppercase tracking-wider block mb-3" style={{ color: 'var(--text-secondary)' }}>
              Rating Distribution
            </span>
            <div className="space-y-1.5">
              {[5, 4, 3, 2, 1].map(star => (
                <RatingBar
                  key={star}
                  stars={star}
                  count={stats.distribution[star] || 0}
                  total={stats.total_feedbacks}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filter Row */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Filter:</span>
        <button
          onClick={() => setFilterRating(null)}
          className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors"
          style={
            filterRating === null
              ? { backgroundColor: '#8B6914', color: '#fff', borderColor: '#8B6914' }
              : { backgroundColor: 'var(--bg-card,#fff)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }
          }
        >
          All ({feedbacks.length})
        </button>
        {[5, 4, 3, 2, 1].map(star => {
          const count = feedbacks.filter(f => f.rating === star).length;
          return (
            <button
              key={star}
              onClick={() => setFilterRating(star)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1"
              style={
                filterRating === star
                  ? { backgroundColor: '#8B6914', color: '#fff', borderColor: '#8B6914' }
                  : { backgroundColor: 'var(--bg-card,#fff)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }
              }
            >
              {star}★ ({count})
            </button>
          );
        })}
      </div>

      {/* Feedback List */}
      {filtered.length === 0 ? (
        <div
          className="text-center py-16 rounded-xl border border-dashed"
          style={{ borderColor: 'var(--border)' }}
        >
          <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-15" style={{ color: 'var(--text-secondary)' }} />
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
            {filterRating ? `No ${filterRating}★ reviews yet` : 'No feedback yet'}
          </p>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {filterRating
              ? 'Try a different filter to see more reviews.'
              : 'Feedback will appear here once users submit reviews.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(f => {
            const initials = f.user.full_name
              ? f.user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
              : f.user.email[0].toUpperCase();

            return (
              <div
                key={f.id}
                className="rounded-xl border p-4 transition-shadow hover:shadow-soft"
                style={{ backgroundColor: 'var(--bg-card, #fff)', borderColor: 'var(--border)' }}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="flex-none">
                    {f.user.avatar_url ? (
                      <img
                        src={f.user.avatar_url}
                        alt={f.user.full_name ?? f.user.email}
                        className="w-9 h-9 rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
                        style={{ backgroundColor: '#8B6914' }}
                      >
                        {initials}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div>
                        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {f.user.full_name ?? '(no name)'}
                        </span>
                        <span className="text-xs ml-2" style={{ color: 'var(--text-muted)' }}>
                          {f.user.email}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 flex-none">
                        <button
                          onClick={() => toggleHomepage(f.id, !!f.show_on_homepage)}
                          className={`p-1.5 rounded-md transition-colors ${
                            f.show_on_homepage ? 'bg-[#8B6914]/10 text-[#8B6914]' : 'hover:bg-black/5 text-gray-400'
                          }`}
                          title={f.show_on_homepage ? "Visible on Homepage" : "Hidden from Homepage"}
                        >
                          {f.show_on_homepage ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          {formatDate(f.created_at)}
                        </span>
                      </div>
                    </div>

                    <div className="mb-2">
                      <StarDisplay rating={f.rating} size={14} />
                    </div>

                    {f.feedback ? (
                      <p
                        className="text-sm leading-relaxed whitespace-pre-wrap"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {f.feedback}
                      </p>
                    ) : (
                      <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>
                        No written feedback provided.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
