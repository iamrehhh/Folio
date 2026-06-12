'use client';

import { Star } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import FadeIn from '@/components/ui/FadeIn';

interface FeedbackProps {
  id: string;
  rating: number;
  feedback: string | null;
  created_at: string;
  user: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

interface FeaturedFeedbackProps {
  feedbacks: FeedbackProps[];
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className="w-4 h-4"
          fill={star <= rating ? '#8B6914' : 'transparent'}
          stroke={star <= rating ? '#8B6914' : '#E5E0D8'}
          strokeWidth={1.5}
        />
      ))}
    </div>
  );
}

function FeedbackCard({ f }: { f: FeedbackProps }) {
  const [expanded, setExpanded] = useState(false);
  const text = f.feedback || "Excellent experience on the platform.";
  const isLong = text.length > 150;

  const user = f.user || { full_name: null, avatar_url: null };
  const initials = user.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'R';

  return (
    <div 
      className={`flex-none w-[320px] sm:w-[380px] rounded-2xl p-8 bg-white transition-all duration-300 hover:shadow-xl hover:-translate-y-1 relative flex flex-col snap-center ${expanded ? 'h-fit' : 'h-[320px]'}`}
      style={{ 
        boxShadow: '0 4px 20px -2px rgba(0,0,0,0.03)',
        border: '1px solid rgba(0,0,0,0.04)'
      }}
    >
      <div className="flex items-center gap-4 mb-6 flex-none">
        {user.avatar_url ? (
          <img src={user.avatar_url} alt={user.full_name ?? ''} className="w-12 h-12 rounded-full object-cover shadow-sm ring-1 ring-black/5" />
        ) : (
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold shadow-sm ring-1 ring-black/5" style={{ backgroundColor: '#F9F6F0', color: '#8B6914' }}>
            {initials}
          </div>
        )}
        <div>
          <p className="text-sm font-bold tracking-tight text-gray-900">
            {user.full_name ?? 'Folio Reader'}
          </p>
          <div className="mt-1">
            <StarDisplay rating={f.rating} />
          </div>
        </div>
      </div>

      <div className={`relative transition-all duration-300 flex-1 ${expanded ? '' : 'overflow-hidden'}`}>
        <p 
          className={`text-[15px] leading-relaxed text-gray-700 ${expanded ? 'pb-2' : 'line-clamp-5'}`} 
          style={{ fontFamily: 'var(--font-inter, system-ui, sans-serif)' }}
        >
          "{text}"
        </p>
        {!expanded && isLong && (
          <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-white to-transparent pointer-events-none" />
        )}
      </div>

      <div className="min-h-[20px] mt-2 flex-none">
        {isLong && (
          <button 
            onClick={() => setExpanded(!expanded)}
            className="text-xs font-bold text-left opacity-60 hover:opacity-100 transition-opacity uppercase tracking-wider"
            style={{ color: '#8B6914' }}
          >
            {expanded ? 'Read less' : 'Read more'}
          </button>
        )}
      </div>
    </div>
  );
}

export default function FeaturedFeedback({ feedbacks }: FeaturedFeedbackProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  if (!feedbacks || feedbacks.length === 0) return null;

  const updateScrollState = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
    }
  };

  useEffect(() => {
    updateScrollState();
    window.addEventListener('resize', updateScrollState);
    return () => window.removeEventListener('resize', updateScrollState);
  }, [feedbacks]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 380; // card width approximately
      scrollRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section className="py-24 relative bg-[#FAF8F4] overflow-hidden border-t" style={{ borderColor: 'rgba(0,0,0,0.03)' }}>
      {/* Background radial gradient */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 0%, rgba(139,105,20,0.04) 0%, transparent 60%)' }} />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <FadeIn direction="up">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4" style={{ fontFamily: 'var(--font-heading)', color: '#1C1C1E' }}>
              Readers' Perspectives
            </h2>
            <p className="text-base md:text-lg text-gray-600 leading-relaxed">
              Discover how Folio is transforming the reading experience for book lovers around the world.
            </p>
          </div>
        </FadeIn>

        <div className="relative">
          {feedbacks.length > 2 && (
            <>
              <button 
                onClick={() => scroll('left')}
                disabled={!canScrollLeft}
                className="absolute -left-5 top-1/2 -translate-y-1/2 z-20 w-14 h-14 flex items-center justify-center rounded-full bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all disabled:opacity-0 disabled:scale-90 hover:scale-110 hidden sm:flex"
                style={{ color: '#8B6914' }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              </button>
              <button 
                onClick={() => scroll('right')}
                disabled={!canScrollRight}
                className="absolute -right-5 top-1/2 -translate-y-1/2 z-20 w-14 h-14 flex items-center justify-center rounded-full bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all disabled:opacity-0 disabled:scale-90 hover:scale-110 hidden sm:flex"
                style={{ color: '#8B6914' }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
              </button>
            </>
          )}

          <div 
            ref={scrollRef}
            onScroll={updateScrollState}
            className="flex overflow-x-auto gap-6 sm:gap-8 pb-12 pt-4 px-4 -mx-4 snap-x snap-mandatory hide-scrollbars items-start"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {feedbacks.map((f, idx) => (
              <FeedbackCard key={f.id || idx} f={f} />
            ))}
          </div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbars::-webkit-scrollbar {
          display: none;
        }
      `}} />
    </section>
  );
}
