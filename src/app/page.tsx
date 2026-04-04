// Save this as: src/app/page.tsx
// Also update src/middleware.ts — change the root redirect so unauthenticated
// users see this landing page instead of being redirected to /login.
// In middleware.ts, remove or change the `pathname === '/'` redirect block to:
//   if (pathname === '/' && user) return redirect to /home
//   (unauthenticated users at '/' will just see the landing page naturally)

import Link from 'next/link';
import { BookOpen, Highlighter, BookMarked, Sparkles, GraduationCap, BarChart2 } from 'lucide-react';

export const metadata = {
  title: 'Folio — Your Intelligent Reading Companion',
  description:
    'Folio is a beautiful EPUB reader with AI assistance, vocabulary saving, highlights, reading quizzes, and detailed reading stats. Read smarter, not harder.',
};

const FEATURES = [
  {
    icon: BookOpen,
    title: 'Distraction-Free Reading',
    desc: 'A clean, customizable EPUB reader with light, sepia, and dark themes. Adjust font size and line height for your perfect reading experience.',
  },
  {
    icon: Sparkles,
    title: 'AI Reading Assistant',
    desc: 'Ask questions about any chapter, request summaries, or explore themes — powered by AI that knows exactly what you are reading.',
  },
  {
    icon: Highlighter,
    title: 'Smart Highlights',
    desc: 'Highlight passages in four colors, add notes, and revisit all your highlights in one clean, organized view.',
  },
  {
    icon: BookMarked,
    title: 'Vocabulary Builder',
    desc: 'Tap any word to get a contextual AI-powered definition. Save words to your personal vocabulary list and export as CSV.',
  },
  {
    icon: GraduationCap,
    title: 'Daily Quizzes',
    desc: 'Learn 5 advanced vocabulary words or idioms every day — with definitions, examples, fill-in-the-blank quizzes, and reading passages.',
  },
  {
    icon: BarChart2,
    title: 'Reading Stats & Streaks',
    desc: 'Track your reading streak, session lengths, books completed this month and year, and schedule upcoming reads.',
  },
];

export default function LandingPage() {
  return (
    <div
      className="min-h-screen relative overflow-x-hidden"
      style={{ backgroundColor: '#FAF8F4', color: '#1C1C1E', fontFamily: 'var(--font-inter, system-ui, sans-serif)' }}
    >
      {/* Dotted background texture */}
      <div
        className="fixed inset-0 opacity-[0.15] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#8B6914 0.5px, transparent 0.5px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* Ambient glow */}
      <div
        className="fixed top-[-200px] left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse, rgba(139,105,20,0.12) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      {/* ── NAV ── */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-5">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-[10px] flex items-center justify-center"
            style={{ backgroundColor: '#8B6914' }}
          >
            <BookOpen className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <span
            className="text-xl font-semibold tracking-tight"
            style={{ fontFamily: 'Lora, Georgia, serif', color: '#1C1C1E' }}
          >
            Folio
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#E5E0D8]"
            style={{ color: '#6B6860' }}
          >
            Sign in
          </Link>
          <Link
            href="/login"
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#8B6914' }}
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative z-10 text-center px-6 pt-16 pb-20 md:pt-24 md:pb-28">
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-sm font-medium mb-8"
          style={{ backgroundColor: '#8B691410', borderColor: '#8B691430', color: '#8B6914' }}
        >
          <Sparkles className="w-3.5 h-3.5" />
          AI-Powered Reading Companion
        </div>

        <h1
          className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6 mx-auto max-w-4xl"
          style={{ fontFamily: 'Lora, Georgia, serif', color: '#1C1C1E' }}
        >
          Read smarter.<br />
          <span style={{ color: '#8B6914' }}>Remember more.</span>
        </h1>

        <p
          className="text-lg md:text-xl leading-relaxed mb-10 mx-auto max-w-xl"
          style={{ color: '#6B6860' }}
        >
          Folio is your personal reading companion — a beautiful EPUB reader with an AI assistant,
          vocabulary builder, smart highlights, and daily quizzes to help you deeply absorb what you read.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/login"
            className="px-8 py-3.5 rounded-xl text-base font-semibold text-white shadow-lg transition-all hover:opacity-90 hover:-translate-y-0.5"
            style={{ backgroundColor: '#8B6914', boxShadow: '0 8px 24px rgba(139,105,20,0.3)' }}
          >
            Start Reading Free
          </Link>
          <Link
            href="/login"
            className="px-8 py-3.5 rounded-xl text-base font-medium border transition-colors hover:bg-[#E5E0D8]"
            style={{ borderColor: '#E5E0D8', color: '#6B6860' }}
          >
            Sign in to your library →
          </Link>
        </div>

        {/* Mock reader window */}
        <div
          className="relative mt-16 mx-auto max-w-4xl rounded-2xl border overflow-hidden shadow-2xl"
          style={{ borderColor: '#E5E0D8' }}
        >
          {/* Browser chrome */}
          <div
            className="flex items-center gap-2 px-4 py-3 border-b"
            style={{ borderColor: '#E5E0D8', backgroundColor: '#F2EFE9' }}
          >
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-400/60" />
              <div className="w-3 h-3 rounded-full bg-green-400/60" />
            </div>
            <div
              className="flex-1 mx-4 py-1 px-3 rounded text-xs text-center"
              style={{ backgroundColor: '#E5E0D8', color: '#9B9890' }}
            >
              foliolib.vercel.app/read
            </div>
          </div>

          {/* Mock reader UI */}
          <div className="flex" style={{ height: '300px', backgroundColor: '#FAF8F4' }}>
            {/* Sidebar */}
            <div
              className="w-40 flex-none border-r p-4 hidden sm:block"
              style={{ borderColor: '#E5E0D8', backgroundColor: '#F2EFE9' }}
            >
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#9B9890' }}>Contents</p>
              {['Chapter I', 'Chapter II', 'Chapter III', 'Chapter IV'].map((ch, i) => (
                <div
                  key={ch}
                  className="py-1.5 px-2 rounded text-xs mb-0.5"
                  style={i === 1
                    ? { backgroundColor: '#8B691415', color: '#8B6914', fontWeight: 600 }
                    : { color: '#9B9890' }}
                >
                  {ch}
                </div>
              ))}
            </div>

            {/* Reading area */}
            <div className="flex-1 px-8 md:px-12 py-8 overflow-hidden text-left">
              <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#9B9890' }}>Chapter II</p>
              <div className="space-y-3" style={{ fontFamily: 'Lora, Georgia, serif', color: '#1C1C1E' }}>
                <p className="text-sm leading-7">
                  It was a bright cold day in April, and the clocks were striking thirteen. Winston Smith,
                  his chin nuzzled into his breast in an effort to escape the{' '}
                  <span className="px-0.5 rounded" style={{ backgroundColor: '#FFE06660' }}>
                    vile wind
                  </span>
                  , slipped quickly through the glass doors of Victory Mansions.
                </p>
                <p className="text-sm leading-7 opacity-60">
                  A swirl of gritty dust entered along with him. The hallway smelt of boiled cabbage
                  and old rag mats. At one end of it a coloured poster, too large for indoors,
                  had been tacked to the wall.
                </p>
              </div>
            </div>

            {/* AI panel hint */}
            <div
              className="w-52 flex-none border-l p-4 hidden lg:block"
              style={{ borderColor: '#E5E0D8', backgroundColor: '#F2EFE9' }}
            >
              <div className="flex items-center gap-1.5 mb-3">
                <Sparkles className="w-3.5 h-3.5" style={{ color: '#8B6914' }} />
                <span className="text-xs font-semibold" style={{ color: '#1C1C1E' }}>AI Assistant</span>
              </div>
              <div
                className="rounded-lg p-2.5 text-xs leading-relaxed mb-2"
                style={{ backgroundColor: '#fff', border: '1px solid #E5E0D8', color: '#6B6860' }}
              >
                Summarise this chapter
              </div>
              <div
                className="rounded-lg p-2.5 text-xs leading-relaxed"
                style={{ backgroundColor: '#8B6914', color: '#fff' }}
              >
                Chapter II introduces Winston's daily life under the Party's oppressive rule...
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="relative z-10 px-6 md:px-12 py-20">
        <div className="max-w-5xl mx-auto">
          <h2
            className="text-3xl md:text-4xl font-bold text-center mb-4"
            style={{ fontFamily: 'Lora, Georgia, serif', color: '#1C1C1E' }}
          >
            Everything you need to read deeply
          </h2>
          <p className="text-center text-base mb-14" style={{ color: '#6B6860' }}>
            Folio combines a beautiful reader with powerful tools to help you learn as you read.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-2xl border p-6 transition-all hover:shadow-lg hover:-translate-y-0.5"
                style={{ backgroundColor: '#fff', borderColor: '#E5E0D8' }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: '#8B691415' }}
                >
                  <Icon className="w-5 h-5" style={{ color: '#8B6914' }} />
                </div>
                <h3
                  className="font-semibold text-base mb-2"
                  style={{ fontFamily: 'Lora, Georgia, serif', color: '#1C1C1E' }}
                >
                  {title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: '#6B6860' }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="relative z-10 px-6 py-20 text-center">
        <div
          className="max-w-2xl mx-auto rounded-3xl p-12"
          style={{ backgroundColor: '#8B6914' }}
        >
          <BookOpen className="w-10 h-10 text-white/80 mx-auto mb-5" />
          <h2
            className="text-3xl font-bold text-white mb-4"
            style={{ fontFamily: 'Lora, Georgia, serif' }}
          >
            Start your reading journey today
          </h2>
          <p className="text-white/80 mb-8 leading-relaxed max-w-md mx-auto">
            Upload your EPUB books and get access to AI assistance, vocabulary building,
            smart highlights, and more — completely free.
          </p>
          <Link
            href="/login"
            className="inline-block px-8 py-3.5 rounded-xl text-base font-semibold bg-white transition-all hover:opacity-90 hover:-translate-y-0.5"
            style={{ color: '#8B6914' }}
          >
            Create your free account
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer
        className="relative z-10 border-t px-6 md:px-12 py-8"
        style={{ borderColor: '#E5E0D8' }}
      >
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#8B6914' }}>
              <BookOpen className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-semibold" style={{ fontFamily: 'Lora, Georgia, serif', color: '#1C1C1E' }}>
              Folio
            </span>
          </div>

          <div className="flex items-center gap-6 text-sm" style={{ color: '#9B9890' }}>
            <Link href="/privacy-policy" className="hover:text-[#8B6914] transition-colors">
              Privacy Policy
            </Link>
            <a href="mailto:mintbyte90@gmail.com" className="hover:text-[#8B6914] transition-colors">
              Contact
            </a>
            <Link href="/login" className="hover:text-[#8B6914] transition-colors">
              Sign In
            </Link>
          </div>

          <p className="text-xs" style={{ color: '#9B9890' }}>
            © {new Date().getFullYear()} Team Folio. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
