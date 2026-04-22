'use client';

import { Star, Quote } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';

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
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className="w-3.5 h-3.5"
          fill={star <= rating ? '#D4A017' : 'transparent'}
          stroke={star <= rating ? '#D4A017' : 'var(--border)'}
          strokeWidth={1.5}
        />
      ))}
    </div>
  );
}

function FeedbackCard({ f }: { f: FeedbackProps }) {
  const [expanded, setExpanded] = useState(false);
  const text = f.feedback || "Excellent experience on the platform.";
  const isLong = text.length > 140; // threshold for showing "Read more"

  const user = f.user || { full_name: null, avatar_url: null };
  const initials = user.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'F'; // Default if no name

  return (
    <div 
      className={`flex-none w-[280px] sm:w-[320px] rounded-2xl p-6 border transition-all duration-300 hover:shadow-soft hover:-translate-y-1 snap-start relative bg-white/50 backdrop-blur-md flex flex-col ${expanded ? 'h-fit' : 'h-[300px]'}`}
      style={{ 
        borderColor: 'var(--border)',
        background: 'linear-gradient(135deg, var(--bg-card, #fff) 0%, rgba(255,255,255,0.4) 100%)'
      }}
    >
      <Quote className="absolute top-5 right-5 w-6 h-6 opacity-5" style={{ color: 'var(--text-primary)' }} />
      
      <div className="mb-4">
        <StarDisplay rating={f.rating} />
      </div>

      <div className={`relative transition-all duration-300 ${expanded ? '' : 'h-[100px] overflow-hidden'}`}>
        <p 
          className={`text-sm leading-relaxed italic ${expanded ? 'pb-2' : 'line-clamp-4'}`} 
          style={{ color: 'var(--text-primary)', fontFamily: 'Lora, Georgia, serif' }}
        >
          "{text}"
        </p>
        {/* Fade out text if overly long */}
        {!expanded && isLong && (
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white/20 to-transparent pointer-events-none" />
        )}
      </div>

      <div className="min-h-[20px] mt-1">
        {isLong && (
          <button 
            onClick={() => setExpanded(!expanded)}
            className="text-xs font-semibold text-left opacity-70 hover:opacity-100 transition-opacity w-[fit-content]"
            style={{ color: 'var(--text-secondary)' }}
          >
            {expanded ? 'Show less' : 'Read more'}
          </button>
        )}
      </div>

      <div className="flex items-center gap-3 mt-auto pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
        {user.avatar_url ? (
          <img src={user.avatar_url} alt={user.full_name ?? ''} className="w-10 h-10 rounded-full object-cover shadow-sm" />
        ) : (
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-sm" style={{ backgroundColor: '#F0EBE1', color: '#8B6914' }}>
            {initials}
          </div>
        )}
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {user.full_name ?? 'Anonymous'}
          </p>
          <p className="text-[10px] uppercase font-medium tracking-wider" style={{ color: 'var(--text-secondary)' }}>
            Folio Reader
          </p>
        </div>
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
      const scrollAmount = 320; // card width approximately
      scrollRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section className="mt-16 mb-8 relative">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 px-2 gap-4">
        <div>
          <h2 className="text-2xl font-semibold flex items-center gap-2" style={{ fontFamily: 'Lora, Georgia, serif', color: 'var(--text-primary)' }}>
            Readers' Perspectives
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Experiences and stories from the Folio community.
          </p>
        </div>

        {feedbacks.length > 2 && (
          <div className="flex items-center gap-2 hidden sm:flex">
            <button 
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className="w-8 h-8 flex items-center justify-center rounded-full border transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ backgroundColor: 'var(--bg-card, #fff)', borderColor: 'var(--border)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-primary)' }}><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <button 
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className="w-8 h-8 flex items-center justify-center rounded-full border transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ backgroundColor: 'var(--bg-card, #fff)', borderColor: 'var(--border)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-primary)' }}><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </div>
        )}
      </div>

      <div 
        ref={scrollRef}
        onScroll={updateScrollState}
        className="flex overflow-x-auto gap-4 sm:gap-6 pb-6 px-2 snap-x snap-mandatory hide-scrollbars"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {feedbacks.map((f, idx) => (
          <FeedbackCard key={f.id || idx} f={f} />
        ))}
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbars::-webkit-scrollbar {
          display: none;
        }
      `}} />
    </section>
  );
}
