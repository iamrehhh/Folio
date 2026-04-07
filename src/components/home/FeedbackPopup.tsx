'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { X, Star, Send, Sparkles } from 'lucide-react';

const LS_KEY_PREFIX = 'folio_feedback_done_';

export default function FeedbackPopup({ hasCompletedBooks }: { hasCompletedBooks: boolean }) {
  const [show, setShow] = useState(false);
  const [phase, setPhase] = useState<'form' | 'success'>('form');
  const [closing, setClosing] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [lsKey, setLsKey] = useState('');

  const supabase = createClient();

  useEffect(() => {
    if (!hasCompletedBooks) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      const userLsKey = `${LS_KEY_PREFIX}${user.id}`;
      setLsKey(userLsKey);

      if (localStorage.getItem(userLsKey)) return;

      const { data: existing } = await supabase
        .from('site_feedback')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        localStorage.setItem(userLsKey, 'submitted');
        return;
      }

      if (!cancelled) {
        timer = setTimeout(() => setShow(true), 2500);
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [hasCompletedBooks]);

  const close = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      setShow(false);
      setClosing(false);
    }, 350);
  }, []);

  const handleSkip = () => {
    if (lsKey) localStorage.setItem(lsKey, 'skipped');
    close();
  };

  const handleSubmit = async () => {
    if (rating === 0) return;

    try {
      setSubmitting(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('site_feedback')
        .insert({
          user_id: user.id,
          rating,
          feedback: feedback.trim() || null,
        });

      if (error) throw error;

      if (lsKey) localStorage.setItem(lsKey, 'submitted');
      setPhase('success');

      // Auto-close after showing success
      setTimeout(() => close(), 2200);
    } catch (err) {
      console.error('Feedback submit error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!show) return null;

  const displayRating = hoverRating || rating;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[60] transition-all duration-350 ${closing ? 'bg-black/0 backdrop-blur-0' : 'bg-black/40 backdrop-blur-sm'
          }`}
        onClick={handleSkip}
      />

      {/* Modal */}
      <div
        className={`fixed inset-0 z-[61] flex items-center justify-center px-4 pointer-events-none`}
      >
        <div
          className={`pointer-events-auto w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden transition-all duration-350 ${closing
              ? 'opacity-0 scale-95 translate-y-4'
              : 'opacity-100 scale-100 translate-y-0'
            }`}
          style={{
            backgroundColor: 'var(--bg-card, #fff)',
            borderColor: 'var(--border)',
            animation: closing ? 'none' : 'feedbackPopIn 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {phase === 'form' ? (
            <>
              {/* Header accent bar */}
              <div
                className="h-1.5 w-full"
                style={{
                  background: 'linear-gradient(90deg, #8B6914 0%, #C9972A 50%, #8B6914 100%)',
                }}
              />

              {/* Close button */}
              <button
                onClick={handleSkip}
                className="absolute top-4 right-4 p-1.5 rounded-full transition-colors hover:bg-black/5"
                style={{ color: 'var(--text-muted)' }}
              >
                <X className="w-4 h-4" />
              </button>

              <div className="px-6 pt-6 pb-2">
                {/* Icon */}
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{
                    background: 'linear-gradient(135deg, #8B691420 0%, #C9972A15 100%)',
                  }}
                >
                  <Sparkles className="w-7 h-7" style={{ color: '#8B6914' }} />
                </div>

                {/* Title */}
                <h3
                  className="text-xl font-bold text-center mb-1"
                  style={{ fontFamily: 'Lora, Georgia, serif', color: 'var(--text-primary)' }}
                >
                  How's your Folio experience?
                </h3>
                <p className="text-sm text-center mb-6" style={{ color: 'var(--text-secondary)' }}>
                  You've finished a book — we'd love to hear your thoughts!
                </p>

                {/* Star Rating */}
                <div className="flex items-center justify-center gap-2 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 transition-transform duration-150 hover:scale-125 active:scale-95"
                      style={{ transform: displayRating >= star ? 'scale(1.1)' : 'scale(1)' }}
                    >
                      <Star
                        className="w-8 h-8 transition-colors duration-200"
                        fill={displayRating >= star ? '#D4A017' : 'transparent'}
                        stroke={displayRating >= star ? '#D4A017' : 'var(--border)'}
                        strokeWidth={1.5}
                      />
                    </button>
                  ))}
                </div>

                {/* Rating label */}
                <p
                  className="text-xs text-center mb-5 h-4 transition-opacity"
                  style={{
                    color: '#D4A017',
                    opacity: displayRating > 0 ? 1 : 0,
                    fontWeight: 600,
                  }}
                >
                  {displayRating === 1 && 'Needs improvement'}
                  {displayRating === 2 && 'Fair'}
                  {displayRating === 3 && 'Good'}
                  {displayRating === 4 && 'Great!'}
                  {displayRating === 5 && 'Outstanding!'}
                </p>

                {/* Feedback textarea */}
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Tell us what you love or what we can improve…"
                  className="w-full rounded-xl border p-3.5 text-sm outline-none resize-none transition-colors"
                  style={{
                    backgroundColor: 'var(--bg, #FAF8F4)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)',
                    minHeight: '90px',
                  }}
                  maxLength={1000}
                />
                <p className="text-[11px] text-right mt-1 mb-4" style={{ color: 'var(--text-muted)' }}>
                  Optional · {feedback.length}/1000
                </p>
              </div>

              {/* Actions */}
              <div
                className="flex items-center justify-between px-6 py-4 border-t"
                style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg, #FAF8F4)' }}
              >
                <button
                  onClick={handleSkip}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-black/5"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Skip
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={rating === 0 || submitting}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40"
                  style={{
                    backgroundColor: '#8B6914',
                    boxShadow: rating > 0 ? '0 2px 12px rgba(139, 105, 20, 0.3)' : 'none',
                  }}
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Submit Feedback
                </button>
              </div>
            </>
          ) : (
            /* Success state */
            <div className="px-6 py-12 text-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  animation: 'successBounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
                }}
              >
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                    style={{
                      strokeDasharray: 24,
                      strokeDashoffset: 0,
                      animation: 'checkDraw 0.4s ease-out 0.3s both',
                    }}
                  />
                </svg>
              </div>
              <h3
                className="text-xl font-bold mb-2"
                style={{ fontFamily: 'Lora, Georgia, serif', color: 'var(--text-primary)' }}
              >
                Thank you!
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Your feedback helps us make Folio even better.
              </p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes feedbackPopIn {
          0% {
            opacity: 0;
            transform: scale(0.9) translateY(20px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </>
  );
}
