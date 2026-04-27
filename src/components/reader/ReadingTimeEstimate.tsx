'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

type DisplayMode = 'chapter' | 'book' | 'hidden';

interface Props {
  /** Estimated locations remaining in the current chapter */
  chapterLocationsRemaining: number;
  /** Locations remaining in the entire book */
  bookLocationsRemaining: number;
  /** User's estimated reading speed in "locations per second" — 0 means still calibrating */
  locationsPerSecond: number;
  /** Theme colors */
  mutedColor: string;
  bgColor: string;
  /** Whether the reading speed is still being calibrated */
  isCalibrating: boolean;
}

function formatDuration(totalSeconds: number): string {
  if (totalSeconds < 0 || !isFinite(totalSeconds)) return '';

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0 && minutes > 0) return `${hours} hr ${minutes} min left`;
  if (hours > 0) return `${hours} hr left`;
  if (minutes > 1) return `${minutes} min left`;
  if (minutes === 1) return '1 min left';
  return 'Less than a minute';
}

export default function ReadingTimeEstimate({
  chapterLocationsRemaining,
  bookLocationsRemaining,
  locationsPerSecond,
  mutedColor,
  bgColor,
  isCalibrating,
}: Props) {
  const [mode, setMode] = useState<DisplayMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('folio-reading-time-mode');
      if (saved === 'chapter' || saved === 'book' || saved === 'hidden') return saved;
    }
    return 'chapter';
  });

  // Track user activity for auto-fade
  const [isIdle, setIsIdle] = useState(false);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastDisplayedRef = useRef('');

  // Smooth out the displayed value — only update every 30 seconds to avoid jitter
  const [displayText, setDisplayText] = useState('');
  const updateTimerRef = useRef<NodeJS.Timeout | null>(null);

  const cycleMode = useCallback(() => {
    setMode(prev => {
      const next: DisplayMode =
        prev === 'chapter' ? 'book' :
        prev === 'book' ? 'hidden' :
        'chapter';
      localStorage.setItem('folio-reading-time-mode', next);
      return next;
    });
  }, []);

  // Idle detection: fade out after 8s of no activity
  useEffect(() => {
    function resetIdle() {
      setIsIdle(false);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => setIsIdle(true), 8000);
    }

    resetIdle();

    window.addEventListener('scroll', resetIdle, { passive: true });
    window.addEventListener('mousemove', resetIdle, { passive: true });
    window.addEventListener('keydown', resetIdle);
    window.addEventListener('folio-activity', resetIdle);

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      window.removeEventListener('scroll', resetIdle);
      window.removeEventListener('mousemove', resetIdle);
      window.removeEventListener('keydown', resetIdle);
      window.removeEventListener('folio-activity', resetIdle);
    };
  }, []);

  // Calculate and smoothly update the displayed time
  useEffect(() => {
    if (mode === 'hidden') return;

    function computeText(): string {
      if (isCalibrating || locationsPerSecond <= 0) {
        return 'Estimating reading speed…';
      }

      if (mode === 'book') {
        if (bookLocationsRemaining <= 0) return '';
        const secondsLeft = bookLocationsRemaining / locationsPerSecond;
        const text = formatDuration(secondsLeft);
        return text ? `${text} in book` : '';
      }

      // Chapter mode
      if (chapterLocationsRemaining <= 0) return '';
      const secondsLeft = chapterLocationsRemaining / locationsPerSecond;
      const text = formatDuration(secondsLeft);
      return text ? `${text} in chapter` : '';
    }

    // Update immediately on mode change or data change
    const newText = computeText();
    if (newText !== lastDisplayedRef.current) {
      lastDisplayedRef.current = newText;
      setDisplayText(newText);
    }

    // Then update every 30 seconds to keep it smooth and non-jittery
    if (updateTimerRef.current) clearInterval(updateTimerRef.current);
    updateTimerRef.current = setInterval(() => {
      const updated = computeText();
      if (updated !== lastDisplayedRef.current) {
        lastDisplayedRef.current = updated;
        setDisplayText(updated);
      }
    }, 30000);

    return () => {
      if (updateTimerRef.current) clearInterval(updateTimerRef.current);
    };
  }, [mode, locationsPerSecond, chapterLocationsRemaining, bookLocationsRemaining, isCalibrating]);

  // Don't render at all if no data yet
  if (locationsPerSecond <= 0 && !isCalibrating) return null;

  return (
    <div
      onClick={(e) => { e.stopPropagation(); cycleMode(); }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); cycleMode(); } }}
      aria-label={`Reading time estimate: ${displayText || 'hidden'}. Click to toggle.`}
      title="Click to toggle: Chapter time → Book time → Hidden"
      style={{
        position: 'absolute',
        bottom: '1rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 15,
        cursor: 'pointer',
        userSelect: 'none',
        // Smooth fade on idle
        opacity: mode === 'hidden' ? 0.08 :
                 isIdle ? 0.25 : 0.55,
        transition: 'opacity 0.8s ease',
        // Subtle appearance
        padding: mode === 'hidden' ? '6px 16px' : '4px 14px',
        borderRadius: '20px',
        backdropFilter: mode === 'hidden' ? 'none' : 'blur(8px)',
        WebkitBackdropFilter: mode === 'hidden' ? 'none' : 'blur(8px)',
        backgroundColor: mode === 'hidden' ? 'transparent' : `color-mix(in srgb, ${bgColor} 70%, transparent)`,
      }}
    >
      {mode !== 'hidden' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Small clock icon */}
          <svg
            width="11"
            height="11"
            viewBox="0 0 16 16"
            fill="none"
            stroke={mutedColor}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ opacity: 0.7, flexShrink: 0 }}
          >
            <circle cx="8" cy="8" r="7" />
            <path d="M8 4v4l2.5 1.5" />
          </svg>

          <span
            style={{
              fontSize: '11px',
              fontFamily: "'Inter', system-ui, sans-serif",
              fontWeight: 400,
              letterSpacing: '0.01em',
              color: mutedColor,
              whiteSpace: 'nowrap',
            }}
          >
            {displayText || 'Estimating reading speed…'}
          </span>
        </div>
      )}

      {mode === 'hidden' && (
        <svg
          width="12"
          height="12"
          viewBox="0 0 16 16"
          fill="none"
          stroke={mutedColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ opacity: 0.5 }}
        >
          <circle cx="8" cy="8" r="7" />
          <path d="M8 4v4l2.5 1.5" />
        </svg>
      )}
    </div>
  );
}
