'use client';

import { useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

function ProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const bar     = document.getElementById('folio-progress-bar');
    const spinner = document.getElementById('folio-progress-spinner');
    if (!bar || !spinner) return;

    // Reset
    bar.style.transition = 'none';
    bar.style.width = '0%';
    bar.style.opacity = '1';
    spinner.style.opacity = '1';

    // Animate to 70%
    const t1 = setTimeout(() => {
      bar.style.transition = 'width 0.5s ease';
      bar.style.width = '70%';
    }, 10);

    // Complete
    const t2 = setTimeout(() => {
      bar.style.transition = 'width 0.25s ease';
      bar.style.width = '100%';
      spinner.style.opacity = '0';
      // Fade out bar
      const t3 = setTimeout(() => {
        bar.style.transition = 'opacity 0.25s ease';
        bar.style.opacity = '0';
        const t4 = setTimeout(() => {
          bar.style.width = '0%';
          bar.style.transition = 'none';
          bar.style.opacity = '1';
        }, 250);
        return () => clearTimeout(t4);
      }, 150);
      return () => clearTimeout(t3);
    }, 120);

    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [pathname, searchParams]);

  return null;
}

export default function NavigationProgress() {
  return (
    <>
      {/* Top progress bar */}
      <div
        id="folio-progress-bar"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          height: '3px',
          width: '0%',
          opacity: 0,
          backgroundColor: '#8B6914',
          borderRadius: '0 2px 2px 0',
          boxShadow: '0 0 10px rgba(139,105,20,0.7), 0 0 4px rgba(139,105,20,0.4)',
          zIndex: 9999,
          pointerEvents: 'none',
          transition: 'none',
        }}
      />

      {/* Spinning dot at right tip of bar */}
      <div
        id="folio-progress-spinner"
        style={{
          position: 'fixed',
          top: '8px',
          right: '14px',
          opacity: 0,
          zIndex: 9999,
          pointerEvents: 'none',
          transition: 'opacity 0.2s ease',
        }}
      >
        <div style={{
          width: '13px',
          height: '13px',
          border: '2px solid rgba(139,105,20,0.25)',
          borderTopColor: '#8B6914',
          borderRadius: '50%',
          animation: 'folio-spin 0.65s linear infinite',
        }} />
      </div>

      <style>{`
        @keyframes folio-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <Suspense fallback={null}>
        <ProgressBar />
      </Suspense>
    </>
  );
}
