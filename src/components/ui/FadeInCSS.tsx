'use client';

import { useEffect, useRef, ReactNode } from 'react';

interface FadeInCSSProps {
  children: ReactNode;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  className?: string;
}

/**
 * Lightweight CSS-only FadeIn using IntersectionObserver.
 * Drop-in replacement for the framer-motion FadeIn on static/landing pages
 * to avoid shipping the ~35KB framer-motion bundle.
 */
export default function FadeInCSS({ children, delay = 0, direction = 'up', className = '' }: FadeInCSSProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('fadein-visible');
          observer.unobserve(el);
        }
      },
      { rootMargin: '-50px', threshold: 0 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const translateMap: Record<string, string> = {
    up: 'translateY(24px)',
    down: 'translateY(-24px)',
    left: 'translateX(24px)',
    right: 'translateX(-24px)',
    none: 'translate(0)',
  };

  return (
    <div
      ref={ref}
      className={`fadein-init ${className}`}
      style={{
        transform: translateMap[direction],
        transitionDelay: `${delay}s`,
      }}
    >
      {children}
    </div>
  );
}
