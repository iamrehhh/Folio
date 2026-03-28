'use client';

import { useEffect, useRef, useState } from 'react';
import { BookOpen, Star, ArrowLeft, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import type { Book } from '@/types';

interface Props {
  book: Book;
  onContinueReading: () => void;
}

function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    const COLORS = ['#8B6914','#C9972A','#FFD700','#F5EDD6','#E8E6E0','#ffffff','#A07D20'];
    const pieces: {
      x: number; y: number; vx: number; vy: number;
      w: number; h: number; color: string; angle: number; va: number; opacity: number;
    }[] = [];

    for (let i = 0; i < 140; i++) {
      pieces.push({
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * 200,
        vx: (Math.random() - 0.5) * 3,
        vy: 2 + Math.random() * 4,
        w: 6 + Math.random() * 8,
        h: 3 + Math.random() * 5,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        angle: Math.random() * Math.PI * 2,
        va: (Math.random() - 0.5) * 0.15,
        opacity: 1,
      });
    }

    let animId: number;
    let frame = 0;

    function draw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      frame++;
      for (const p of pieces) {
        p.x += p.vx;
        p.y += p.vy;
        p.angle += p.va;
        p.vy += 0.06;
        if (frame > 120) p.opacity = Math.max(0, p.opacity - 0.008);
        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      if (pieces.some(p => p.opacity > 0)) animId = requestAnimationFrame(draw);
    }

    animId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-[60]"
      style={{ width: '100vw', height: '100vh' }} />
  );
}

export default function CompletionScreen({ book, onContinueReading }: Props) {
  const [rating, setRating]       = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [rated, setRated]         = useState(false);

  const completedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  function submitRating(stars: number) {
    setRating(stars);
    setRated(true);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(20,18,16,0.94)', backdropFilter: 'blur(8px)' }}>
      <Confetti />

      <div className="relative z-[61] w-full max-w-sm mx-4 text-center animate-fade-in">

        {/* Book cover */}
        <div className="mb-6 flex justify-center">
          {book.cover_url ? (
            <div className="relative">
              <img src={book.cover_url} alt={book.title}
                className="w-28 h-40 object-cover rounded-xl"
                style={{ boxShadow: '0 0 40px rgba(139,105,20,0.5), 0 8px 32px rgba(0,0,0,0.5)' }} />
            </div>
          ) : (
            <div className="w-24 h-24 rounded-full flex items-center justify-center"
              style={{ backgroundColor: '#8B691430', border: '2px solid #8B6914' }}>
              <BookOpen className="w-10 h-10" style={{ color: '#8B6914' }} />
            </div>
          )}
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full mb-5 text-xs font-semibold uppercase tracking-widest"
          style={{ backgroundColor: '#8B691420', color: '#C9972A', border: '1px solid #8B691445' }}>
          ✦ Book Completed
        </div>

        {/* Title & author */}
        <h1 className="text-2xl font-bold mb-1 leading-snug px-2"
          style={{ fontFamily: 'Lora, Georgia, serif', color: '#FAF8F4' }}>
          {book.title}
        </h1>
        <p className="text-sm mb-1" style={{ color: '#A0998C' }}>{book.author}</p>
        <p className="text-xs mb-8" style={{ color: '#555' }}>Finished · {completedDate}</p>

        {/* Star rating */}
        <div className="mb-8">
          <p className="text-xs uppercase tracking-widest mb-3" style={{ color: '#6B6860' }}>
            {rated ? `You rated this ${rating} star${rating !== 1 ? 's' : ''}` : 'Rate this book'}
          </p>
          <div className="flex justify-center gap-1.5">
            {[1,2,3,4,5].map(star => (
              <button key={star} onClick={() => submitRating(star)}
                onMouseEnter={() => !rated && setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                disabled={rated}
                className="transition-transform hover:scale-110 active:scale-95">
                <Star className="w-9 h-9" style={{
                  color:  star <= (hoverRating || rating) ? '#FFD700' : '#2A2A2A',
                  fill:   star <= (hoverRating || rating) ? '#FFD700' : 'transparent',
                  transition: 'color 0.12s, fill 0.12s',
                }} />
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 px-2">
          <Link href="/library"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-medium transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#8B6914', color: '#fff' }}>
            <ArrowLeft className="w-4 h-4" />
            Back to Library
          </Link>
          <button onClick={onContinueReading}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-medium border transition-colors hover:bg-white/5"
            style={{ borderColor: '#2A2A2A', color: '#6B6860' }}>
            <RotateCcw className="w-4 h-4" />
            Continue Reading
          </button>
        </div>
      </div>
    </div>
  );
}
