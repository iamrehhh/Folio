'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Star, Send, MessageCircle, Reply, Clock, BookOpen, Users, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Book, BookComment } from '@/types';
import toast from 'react-hot-toast';

interface Props {
  book: Book;
  userId: string;
  userName: string;
  userAvatar: string | null;
}

interface RatingStats {
  averageRating: number;
  totalRatings: number;
  distribution: Record<number, number>;
  userRating: number | null;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function Avatar({ name, url, size = 36 }: { name: string | null; url: string | null; size?: number }) {
  const initials = (name || 'A').slice(0, 2).toUpperCase();
  if (url) {
    return (
      <img
        src={url}
        alt={name || 'User'}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="rounded-full flex items-center justify-center flex-shrink-0 font-semibold"
      style={{
        width: size,
        height: size,
        backgroundColor: '#8B691420',
        color: '#8B6914',
        fontSize: size * 0.38,
      }}
    >
      {initials}
    </div>
  );
}

// ─── Star Rating Input ───────────────────────
function StarRatingInput({ value, onChange, disabled }: { value: number; onChange: (v: number) => void; disabled?: boolean }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          disabled={disabled}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(i)}
          className="transition-transform hover:scale-110 disabled:opacity-50"
          style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
        >
          <Star
            className="w-7 h-7 transition-colors duration-150"
            style={{
              color: (hover || value) >= i ? '#8B6914' : 'var(--border)',
              fill: (hover || value) >= i ? '#8B6914' : 'transparent',
            }}
          />
        </button>
      ))}
    </div>
  );
}

// ─── Rating Distribution Bar ────────────────
function RatingBar({ star, count, max }: { star: number; count: number; max: number }) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div className="flex items-center gap-2.5 text-sm">
      <span className="w-4 text-right font-medium" style={{ color: 'var(--text-secondary)' }}>{star}</span>
      <Star className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#8B6914', fill: '#8B6914' }} />
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: '#8B6914' }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: (5 - star) * 0.08 }}
        />
      </div>
      <span className="w-6 text-xs tabular-nums" style={{ color: 'var(--text-muted, var(--text-secondary))' }}>{count}</span>
    </div>
  );
}

// ─── Single Comment ─────────────────────────
function CommentCard({
  comment,
  userId,
  onReply,
  onDelete,
  depth = 0,
}: {
  comment: BookComment;
  userId: string;
  onReply: (parentId: string) => void;
  onDelete: (commentId: string, parentId: string | null) => void;
  depth?: number;
}) {
  const [deleting, setDeleting] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -4, transition: { duration: 0.2 } }}
      transition={{ duration: 0.25 }}
      className="group/comment"
      style={{ marginLeft: depth > 0 ? 20 : 0 }}
    >
      <div
        className="rounded-xl p-4 transition-colors"
        style={{
          backgroundColor: depth > 0 ? 'transparent' : 'var(--bg-card, #fff)',
          border: depth > 0 ? 'none' : '1px solid var(--border)',
          opacity: deleting ? 0.5 : 1,
        }}
      >
        <div className="flex items-start gap-3">
          <Avatar name={comment.user?.full_name ?? null} url={comment.user?.avatar_url ?? null} size={depth > 0 ? 28 : 34} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                {comment.user?.full_name || 'Anonymous'}
              </span>
              {comment.user_id === userId && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium" style={{ backgroundColor: '#8B691415', color: '#8B6914' }}>
                  You
                </span>
              )}
              <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted, var(--text-secondary))' }}>
                <Clock className="w-3 h-3" />
                {timeAgo(comment.created_at)}
              </span>
            </div>
            <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-wrap break-words" style={{ color: 'var(--text-primary)' }}>
              {comment.content}
            </p>
            <div className="mt-2 flex items-center gap-3">
              <button
                onClick={() => onReply(comment.id)}
                className="flex items-center gap-1.5 text-xs font-medium transition-colors hover:opacity-80"
                style={{ color: 'var(--text-secondary)' }}
              >
                <Reply className="w-3.5 h-3.5" />
                Reply
              </button>
              {comment.user_id === userId && (
                <button
                  disabled={deleting}
                  onClick={() => {
                    setDeleting(true);
                    onDelete(comment.id, comment.parent_id);
                  }}
                  className="flex items-center gap-1.5 text-xs font-medium transition-all opacity-0 group-hover/comment:opacity-100 hover:!text-red-500"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-1 relative" style={{ paddingLeft: 16 }}>
          <div
            className="absolute left-0 top-0 bottom-0 w-px"
            style={{ backgroundColor: 'var(--border)' }}
          />
          <AnimatePresence mode="popLayout">
            {comment.replies.map(reply => (
              <CommentCard
                key={reply.id}
                comment={reply}
                userId={userId}
                onReply={onReply}
                onDelete={onDelete}
                depth={depth + 1}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}

// ─── Main Discussion Component ──────────────
export default function BookDiscussionClient({ book, userId, userName, userAvatar }: Props) {
  const [comments, setComments] = useState<BookComment[]>([]);
  const [ratingStats, setRatingStats] = useState<RatingStats | null>(null);
  const [userRating, setUserRating] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRating, setIsRating] = useState(false);
  const [loadingComments, setLoadingComments] = useState(true);
  const [loadingRatings, setLoadingRatings] = useState(true);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  // Fetch comments
  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/books/${book.id}/comments`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setComments(data.comments);
    } catch {
      toast.error('Failed to load comments');
    } finally {
      setLoadingComments(false);
    }
  }, [book.id]);

  // Fetch ratings
  const fetchRatings = useCallback(async () => {
    try {
      const res = await fetch(`/api/books/${book.id}/ratings`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRatingStats(data);
      if (data.userRating) setUserRating(data.userRating);
    } catch {
      toast.error('Failed to load ratings');
    } finally {
      setLoadingRatings(false);
    }
  }, [book.id]);

  useEffect(() => {
    fetchComments();
    fetchRatings();
  }, [fetchComments, fetchRatings]);

  // Submit rating
  async function handleRate(rating: number) {
    if (isRating) return;
    setIsRating(true);
    setUserRating(rating);
    try {
      const res = await fetch('/api/books/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId: book.id, rating }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Rated ${rating} star${rating > 1 ? 's' : ''}`);
      fetchRatings(); // Refresh stats
    } catch {
      toast.error('Failed to submit rating');
    } finally {
      setIsRating(false);
    }
  }

  // Submit comment
  async function handleSubmitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/books/${book.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: commentText.trim(),
          parentId: replyingTo,
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      
      if (replyingTo) {
        // Add reply to parent comment
        setComments(prev =>
          prev.map(c =>
            c.id === replyingTo
              ? { ...c, replies: [...(c.replies || []), data.comment] }
              : c
          )
        );
      } else {
        setComments(prev => [...prev, data.comment]);
      }

      setCommentText('');
      setReplyingTo(null);

      // Scroll to new comment
      setTimeout(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch {
      toast.error('Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  }

  // Handle reply click
  function handleReply(parentId: string) {
    setReplyingTo(parentId);
    commentInputRef.current?.focus();
  }

  // Handle delete
  async function handleDeleteComment(commentId: string, parentId: string | null) {
    try {
      const res = await fetch(`/api/books/${book.id}/comments?commentId=${commentId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error();

      if (parentId) {
        // Remove reply from parent
        setComments(prev =>
          prev.map(c =>
            c.id === parentId
              ? { ...c, replies: (c.replies || []).filter(r => r.id !== commentId) }
              : c
          )
        );
      } else {
        // Remove top-level comment
        setComments(prev => prev.filter(c => c.id !== commentId));
      }

      toast.success('Comment deleted');
    } catch {
      toast.error('Failed to delete comment');
    }
  }

  const replyingToComment = replyingTo
    ? comments.find(c => c.id === replyingTo) ||
      comments.flatMap(c => c.replies ?? []).find(r => r.id === replyingTo)
    : null;

  const totalComments = comments.reduce((sum, c) => sum + 1 + (c.replies?.length ?? 0), 0);
  const maxDistribution = ratingStats
    ? Math.max(...Object.values(ratingStats.distribution), 1)
    : 1;

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]" style={{ backgroundColor: 'var(--bg)' }}>

      {/* ── Top Bar ── */}
      <div
        className="flex items-center gap-3 px-4 md:px-8 py-3 border-b flex-shrink-0"
        style={{ borderColor: 'var(--border)' }}
      >
        <Link
          href="/library"
          className="flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-80"
          style={{ color: 'var(--text-secondary)' }}
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Library</span>
        </Link>
        <div className="w-px h-5" style={{ backgroundColor: 'var(--border)' }} />
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {book.cover_url && (
            <img
              src={book.cover_url}
              alt=""
              className="w-8 h-11 rounded object-cover flex-shrink-0 shadow-sm"
            />
          )}
          <div className="min-w-0">
            <h1
              className="text-sm font-semibold leading-tight truncate"
              style={{ fontFamily: 'Lora, Georgia, serif', color: 'var(--text-primary)' }}
            >
              {book.title}
            </h1>
            <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
              {book.author}
            </p>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">

          {/* ── Book Header Card ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="rounded-2xl border overflow-hidden"
            style={{ backgroundColor: 'var(--bg-card, #fff)', borderColor: 'var(--border)' }}
          >
            <div className="flex gap-5 p-5 md:p-6">
              {/* Cover */}
              <div className="flex-shrink-0 w-24 md:w-28 aspect-[2/3] rounded-xl overflow-hidden shadow-md" style={{ backgroundColor: '#E5E0D8' }}>
                {book.cover_url
                  ? <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center"><BookOpen className="w-8 h-8 opacity-25" style={{ color: 'var(--text-secondary)' }} /></div>
                }
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h2
                  className="text-lg md:text-xl font-bold leading-tight"
                  style={{ fontFamily: 'Lora, Georgia, serif', color: 'var(--text-primary)' }}
                >
                  {book.title}
                </h2>
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{book.author}</p>

                {book.genre && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {book.genre.split(',').map(g => g.trim()).filter(Boolean).map((g, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-full text-xs font-medium"
                        style={{ backgroundColor: '#8B691412', color: '#8B6914' }}
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                )}

                {book.description && (
                  <p className="text-sm mt-3 leading-relaxed line-clamp-3" style={{ color: 'var(--text-secondary)' }}>
                    {book.description}
                  </p>
                )}
              </div>
            </div>
          </motion.div>

          {/* ── Rating Section ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="rounded-2xl border p-5 md:p-6"
            style={{ backgroundColor: 'var(--bg-card, #fff)', borderColor: 'var(--border)' }}
          >
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
              <Star className="w-4 h-4" style={{ color: '#8B6914' }} />
              Community Rating
            </h3>

            {loadingRatings ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--border)', borderTopColor: '#8B6914' }} />
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                {/* Aggregate */}
                <div className="flex flex-col items-center gap-1.5 min-w-[100px]">
                  <div className="text-4xl font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                    {ratingStats?.averageRating?.toFixed(1) || '—'}
                  </div>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star
                        key={i}
                        className="w-4 h-4"
                        style={{
                          color: i <= Math.round(ratingStats?.averageRating ?? 0) ? '#8B6914' : 'var(--border)',
                          fill: i <= Math.round(ratingStats?.averageRating ?? 0) ? '#8B6914' : 'transparent',
                        }}
                      />
                    ))}
                  </div>
                  <p className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted, var(--text-secondary))' }}>
                    <Users className="w-3 h-3" />
                    {ratingStats?.totalRatings || 0} rating{(ratingStats?.totalRatings ?? 0) !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Distribution */}
                <div className="flex-1 space-y-1.5 w-full">
                  {[5, 4, 3, 2, 1].map(star => (
                    <RatingBar
                      key={star}
                      star={star}
                      count={ratingStats?.distribution[star] ?? 0}
                      max={maxDistribution}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Your Rating */}
            <div
              className="mt-5 pt-5 border-t"
              style={{ borderColor: 'var(--border)' }}
            >
              <div className="flex items-center justify-between flex-wrap gap-3">
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {userRating > 0 ? 'Your rating' : 'Rate this book'}
                </p>
                <StarRatingInput value={userRating} onChange={handleRate} disabled={isRating} />
              </div>
            </div>
          </motion.div>

          {/* ── Comments Section ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <h3
              className="text-sm font-semibold uppercase tracking-wider mb-4 flex items-center gap-2"
              style={{ color: 'var(--text-secondary)' }}
            >
              <MessageCircle className="w-4 h-4" style={{ color: '#8B6914' }} />
              Discussion
              {totalComments > 0 && (
                <span
                  className="px-2 py-0.5 rounded-full text-xs font-semibold"
                  style={{ backgroundColor: '#8B691415', color: '#8B6914' }}
                >
                  {totalComments}
                </span>
              )}
            </h3>

            {/* Comments list */}
            {loadingComments ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--border)', borderTopColor: '#8B6914' }} />
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-12 rounded-2xl border" style={{ backgroundColor: 'var(--bg-card, #fff)', borderColor: 'var(--border)' }}>
                <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-20" style={{ color: 'var(--text-secondary)' }} />
                <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                  No comments yet
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                  Be the first to share your thoughts!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {comments.map(comment => (
                    <CommentCard
                      key={comment.id}
                      comment={comment}
                      userId={userId}
                      onReply={handleReply}
                      onDelete={handleDeleteComment}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
            <div ref={commentsEndRef} />
          </motion.div>
        </div>
      </div>

      {/* ── Comment Input — Fixed Bottom ── */}
      <div
        className="flex-shrink-0 border-t"
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card, #fff)' }}
      >
        {/* Replying indicator */}
        <AnimatePresence>
          {replyingTo && replyingToComment && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-2 px-4 md:px-6 pt-3 pb-0">
                <Reply className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#8B6914' }} />
                <span className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                  Replying to <strong style={{ color: 'var(--text-primary)' }}>{replyingToComment.user?.full_name || 'Anonymous'}</strong>
                </span>
                <button
                  onClick={() => setReplyingTo(null)}
                  className="ml-auto text-xs font-medium transition-colors hover:opacity-80"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmitComment} className="flex items-end gap-3 p-4 md:px-6 max-w-2xl mx-auto w-full">
          <Avatar name={userName} url={userAvatar} size={32} />
          <div className="flex-1 relative">
            <textarea
              ref={commentInputRef}
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder={replyingTo ? 'Write a reply…' : 'Share your thoughts…'}
              rows={1}
              maxLength={2000}
              className="w-full resize-none rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors"
              style={{
                backgroundColor: 'var(--bg)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)',
                minHeight: 42,
                maxHeight: 120,
              }}
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = 'auto';
                el.style.height = Math.min(el.scrollHeight, 120) + 'px';
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmitComment(e as any);
                }
              }}
            />
          </div>
          <button
            type="submit"
            disabled={!commentText.trim() || isSubmitting}
            className="flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 disabled:opacity-30 flex-shrink-0"
            style={{
              backgroundColor: commentText.trim() ? '#8B6914' : 'var(--border)',
              color: commentText.trim() ? '#fff' : 'var(--text-secondary)',
            }}
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
