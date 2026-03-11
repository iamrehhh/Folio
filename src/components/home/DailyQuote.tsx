'use client';

import { useEffect, useState } from 'react';
import { QUOTES, Quote } from '@/lib/quotes';

export default function DailyQuote() {
  const [dailyQuote, setDailyQuote] = useState<Quote | null>(null);

  useEffect(() => {
    // We use the client's local timezone to calculate the current "day".
    // This ensures the quote changes exactly at midnight for the user, 
    // regardless of where the server is located or when hydration runs.
    const now = new Date();
    // Create a local date string (e.g., "2026-03-11")
    const localDateString = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
    
    // Create a simple deterministic hash from the date string
    let hash = 0;
    for (let i = 0; i < localDateString.length; i++) {
      const char = localDateString.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    // Ensure positive index
    const index = Math.abs(hash) % QUOTES.length;
    setDailyQuote(QUOTES[index]);
  }, []);

  // Prevent hydration mismatch by returning empty structure until client effects run
  if (!dailyQuote) {
    return <div className="h-10 mb-8" />; // Placeholder spacing
  }

  return (
    <div className="mb-10 text-left max-w-3xl">
      <span 
        className="text-[18px] italic text-[#4A4740] leading-relaxed font-medium"
        style={{ fontFamily: 'Lora, Georgia, serif' }}
      >
        "{dailyQuote.text}"
      </span>
      <span 
        className="text-[13px] tracking-wide text-[#8B6914] font-semibold uppercase ml-3 inline-block"
        style={{ fontFamily: 'var(--font-inter), sans-serif' }}
      >
        — {dailyQuote.author}
      </span>
    </div>
  );
}
