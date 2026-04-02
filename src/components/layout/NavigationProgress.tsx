'use client';

import { useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

function ProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const bar = document.getElementById('folio-progress-bar');
    const spinner = document.getElementById('folio-progress-spinner');
    if (!bar || !spinner) return;

    let timer: NodeJS.Timeout;

    // When pathname changes (page fully loaded), sweep to 100% and fade out
    function finish() {
      if (timer) clearInterval(timer);
      bar!.style.transition = 'width 0.35s ease-out';
      bar!.style.width = '100%';
      spinner!.style.opacity = '0';

      setTimeout(() => {
        bar!.style.transition = 'opacity 0.3s ease';
        bar!.style.opacity = '0';
        setTimeout(() => {
          bar!.style.transition = 'none';
          bar!.style.width = '0%';
        }, 300);
      }, 350);
    }

    // Call finish on mount/route change
    finish();

    // Listen for link clicks to START realistic progress bar
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a');
      if (!anchor || !anchor.href) return;

      try {
        const currentUrl = new URL(window.location.href);
        const targetUrl = new URL(anchor.href);

        // Ignore external links, new tabs, modifier keys, or same-page anchors
        if (targetUrl.origin !== currentUrl.origin) return;
        if (anchor.target === '_blank') return;
        if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
        if (targetUrl.pathname === currentUrl.pathname && targetUrl.search === currentUrl.search) return;

        // Reset and commence realistic trickle
        if (timer) clearInterval(timer);
        bar!.style.transition = 'none';
        bar!.style.opacity = '1';
        bar!.style.width = '0%';
        spinner!.style.opacity = '1';

        // Force reflow
        void bar!.offsetWidth;

        bar!.style.transition = 'width 0.5s ease';
        bar!.style.width = '15%';

        let currentWidth = 15;
        timer = setInterval(() => {
          // Asymptotically approach 90%
          currentWidth += (90 - currentWidth) * 0.05;
          if (bar) bar.style.width = `${currentWidth}%`;
        }, 300);
      } catch {
        // invalid URL format, ignore
      }
    };

    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('click', handleClick);
      if (timer) clearInterval(timer);
    };
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
