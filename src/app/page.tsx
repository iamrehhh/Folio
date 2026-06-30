// Save this as: src/app/page.tsx
// Also update src/middleware.ts — change the root redirect so unauthenticated
// users see this landing page instead of being redirected to /login.
// In middleware.ts, remove or change the `pathname === '/'` redirect block to:
//   if (pathname === '/' && user) return redirect to /home
//   (unauthenticated users at '/' will just see the landing page naturally)

import Link from 'next/link';
import { BookOpen, Highlighter, BookMarked, Sparkles, GraduationCap, BarChart2, Library, Archive, Github, Linkedin, Mail } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/server';
import FeaturedFeedback from '@/components/home/FeaturedFeedback';
import FadeInCSS from '@/components/ui/FadeInCSS';

// ISR: cache this page for 1 hour instead of re-rendering on every request
export const revalidate = 3600;

export const metadata = {
  title: 'Folio | Your Intelligent Reading Companion',
  description:
    'Folio is a beautiful EPUB reader with AI assistance, vocabulary saving, highlights, reading quizzes, and detailed reading stats. Read smarter, not harder.',
};

const FEATURES = [
  {
    icon: Library,
    title: 'Public & Private Library',
    desc: 'Browse a growing community library of books, curate your own personal collection, and seamlessly upload your own EPUBs up to 9MB.',
  },
  {
    icon: BookOpen,
    title: 'Immersive Reader',
    desc: 'A distraction-free, customizable EPUB reader with light, sepia, and dark themes. Hide the top bar for deeper focus.',
  },
  {
    icon: Sparkles,
    title: 'AI Reading Assistant',
    desc: 'Ask questions about any chapter, request summaries, or explore themes — powered by AI that knows exactly what you are reading.',
  },
  {
    icon: Archive,
    title: 'Personal Vault',
    desc: 'A central, organized space to filter and manage all your saved vocabulary words, color-coded highlights, and notes.',
  },
  {
    icon: GraduationCap,
    title: 'Daily Quizzes',
    desc: 'Learn advanced vocabulary every day with definitions, examples, fill-in-the-blank quizzes, and reading passages.',
  },
  {
    icon: BarChart2,
    title: 'Stats & Scheduling',
    desc: 'Track your reading streak, session lengths, books completed, and schedule upcoming reads with automatic reminders.',
  },
];

export default async function LandingPage() {
  const supabase = createAdminClient();
  const { data: featuredFeedbacks } = await supabase.from('site_feedback').select('*, user:profiles(full_name, avatar_url)')
    .eq('show_on_homepage', true)
    .order('created_at', { ascending: false })
    .limit(10);

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
        <FadeInCSS delay={0.1}>
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-sm font-medium mb-8"
            style={{ backgroundColor: '#8B691410', borderColor: '#8B691430', color: '#8B6914' }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI-Powered Reading Companion
          </div>
        </FadeInCSS>

        <FadeInCSS delay={0.2}>
          <h1
            className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6 mx-auto max-w-4xl"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}
          >
            Read smarter.<br />
            <span style={{ color: 'var(--accent)' }}>Remember more.</span>
          </h1>
        </FadeInCSS>

        <FadeInCSS delay={0.3}>
          <p
            className="text-lg md:text-xl leading-relaxed mb-10 mx-auto max-w-xl"
            style={{ color: 'var(--text-secondary)' }}
          >
            Folio is your personal reading companion — a beautiful EPUB reader with an AI assistant,
            a public library, a personal vault for vocabulary and highlights, and daily quizzes.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="group relative px-8 py-3.5 rounded-xl text-base font-semibold text-white transition-all hover:-translate-y-0.5"
            >
              <div className="absolute inset-0 w-full h-full rounded-xl bg-gradient-to-r from-[#8B6914] to-[#A07D20] shadow-[0_8px_24px_rgba(139,105,20,0.3)] group-hover:shadow-[0_12px_32px_rgba(139,105,20,0.4)] transition-all" />
              <span className="relative z-10 flex items-center gap-2">Start Reading <Sparkles className="w-4 h-4" /></span>
            </Link>
            <Link
              href="/login"
              className="px-8 py-3.5 rounded-xl text-base font-medium border backdrop-blur-md transition-all hover:bg-white/50 shadow-soft"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            >
              Browse Public Library →
            </Link>
          </div>

          <div className="mt-8 flex justify-center">
            <a 
              href="#creator"
              className="group flex items-center gap-3 px-4 py-2 rounded-full border bg-white/40 backdrop-blur-sm transition-all hover:bg-white hover:shadow-soft"
              style={{ borderColor: 'var(--border)' }}
            >
               <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#8B6914] to-[#A07D20] flex items-center justify-center text-white text-[10px] font-bold">
                 AR
               </div>
               <span className="text-sm font-medium transition-colors" style={{ color: 'var(--text-secondary)' }}>
                 Crafted by <span style={{ color: 'var(--text-primary)' }}>Abdul Rehan</span>
               </span>
            </a>
          </div>
        </FadeInCSS>

        {/* Mock reader window */}
        <FadeInCSS delay={0.5} direction="up">
        <div
          className="relative mt-16 mx-auto max-w-4xl rounded-2xl border overflow-hidden shadow-glass"
          style={{ borderColor: 'var(--border)' }}
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
                style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
              >
                Chapter II introduces Winston's daily life under the Party's oppressive rule...
              </div>
            </div>
          </div>
        </div>
        </FadeInCSS>
      </section>

      {/* ── FEATURES ── */}
      <section className="relative z-10 px-6 md:px-12 py-20">
        <div className="max-w-5xl mx-auto">
          <FadeInCSS>
            <h2
              className="text-3xl md:text-4xl font-bold text-center mb-4"
              style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}
            >
              Everything you need to read deeply
            </h2>
            <p className="text-center text-base mb-14" style={{ color: 'var(--text-secondary)' }}>
              Folio combines a beautiful reader with powerful tools to help you learn as you read.
            </p>
          </FadeInCSS>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, title, desc }, idx) => (
              <FadeInCSS key={title} delay={0.1 * (idx % 3)} className="h-full">
              <div
                className="h-full rounded-2xl border p-6 transition-all hover:shadow-soft-lg hover:-translate-y-1 bg-white/60 backdrop-blur-sm flex flex-col"
                style={{ borderColor: 'var(--border)' }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 shadow-soft"
                  style={{ backgroundColor: 'var(--accent-muted, #8B691415)' }}
                >
                  <Icon className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                </div>
                <h3
                  className="font-semibold text-base mb-2"
                  style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}
                >
                  {title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {desc}
                </p>
              </div>
              </FadeInCSS>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEEDBACK ── */}
      {featuredFeedbacks && featuredFeedbacks.length > 0 && (
        <section className="relative z-10 px-4 md:px-8 py-6 md:py-10 max-w-5xl mx-auto">
          <FeaturedFeedback feedbacks={featuredFeedbacks as any} />
        </section>
      )}

      {/* ── CREATOR INFO ── */}
      <section id="creator" className="relative z-10 px-6 py-20 max-w-5xl mx-auto">
        <FadeInCSS>
          <div className="rounded-3xl border bg-white/40 backdrop-blur-md p-8 md:p-12 shadow-soft flex flex-col md:flex-row items-center gap-10" style={{ borderColor: 'var(--border)' }}>
            
            <div className="flex-none relative mx-auto md:mx-0">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-[#8B6914] to-[#A07D20] p-1 shadow-xl">
                <div className="w-full h-full rounded-full bg-[#FAF8F4] flex items-center justify-center border-4 border-transparent overflow-hidden">
                   <span className="text-4xl md:text-5xl font-bold" style={{ color: '#8B6914', fontFamily: 'var(--font-heading)' }}>AR</span>
                </div>
              </div>
              <div className="absolute -bottom-2 -right-2 bg-white p-2 rounded-full shadow-lg border" style={{ borderColor: 'var(--border)' }}>
                <Sparkles className="w-5 h-5 text-[#8B6914]" />
              </div>
            </div>

            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-semibold mb-4" style={{ backgroundColor: '#8B691410', borderColor: '#8B691430', color: '#8B6914' }}>
                Meet the Creator
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
                Abdul Rehan
              </h2>
              <div className="text-base md:text-lg leading-relaxed mb-6 space-y-4" style={{ color: 'var(--text-secondary)' }}>
                <p>
                  Hi, I'm Abdul Rehan, a college student with no traditional coding background. Fascinated by the concept of &quot;vibe coding&quot;, I learned how to build full-stack web applications entirely by interacting with AI tools like Antigravity and Claude, alongside watching YouTube tutorials.
                </p>
                <p>
                  I've experimented with building various projects through prompt engineering, and Folio stands as the proudest and most advanced platform I've created so far!
                </p>
              </div>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                <a href="https://github.com/iamrehhh" target="_blank" rel="noreferrer" className="p-2.5 rounded-full border bg-white text-[#6B6860] hover:text-[#1C1C1E] hover:border-[#1C1C1E] hover:-translate-y-1 transition-all shadow-sm">
                  <Github className="w-5 h-5" />
                </a>
                <a href="https://www.linkedin.com/in/abdul-rehan-239267419/" target="_blank" rel="noreferrer" className="p-2.5 rounded-full border bg-white text-[#6B6860] hover:text-[#0A66C2] hover:border-[#0A66C2] hover:-translate-y-1 transition-all shadow-sm">
                  <Linkedin className="w-5 h-5" />
                </a>
                <a href="mailto:rehanabduloffical@gmail.com" className="p-2.5 rounded-full border bg-white text-[#6B6860] hover:text-[#EA4335] hover:border-[#EA4335] hover:-translate-y-1 transition-all shadow-sm">
                  <Mail className="w-5 h-5" />
                </a>
              </div>
            </div>

          </div>
        </FadeInCSS>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="relative z-10 px-6 py-20 text-center">
        <FadeInCSS direction="up">
        <div
          className="max-w-2xl mx-auto rounded-3xl p-12 relative overflow-hidden shadow-glass"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
          <BookOpen className="relative z-10 w-10 h-10 text-white/80 mx-auto mb-5" />
          <h2
            className="relative z-10 text-3xl font-bold text-white mb-4"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Start your reading journey today
          </h2>
          <p className="relative z-10 text-white/80 mb-8 leading-relaxed max-w-md mx-auto">
            Browse the community library or upload your own EPUBs. Get access to AI assistance,
            your Personal Vault, daily quizzes, and more — completely free.
          </p>
          <Link
            href="/login"
            className="relative z-10 inline-block px-8 py-3.5 rounded-xl text-base font-semibold bg-white transition-all hover:scale-105 hover:shadow-lg"
            style={{ color: 'var(--accent)' }}
          >
            Create your account
          </Link>
        </div>
        </FadeInCSS>
      </section>

      {/* ── FOOTER ── */}
      <footer
        className="relative z-10 border-t px-6 md:px-12 py-8"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shadow-soft" style={{ backgroundColor: 'var(--accent)' }}>
              <BookOpen className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-semibold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
              Folio
            </span>
          </div>

          <div className="flex items-center gap-6 text-sm" style={{ color: '#9B9890' }}>
            <Link href="/privacy" className="hover:text-[#8B6914] transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-[#8B6914] transition-colors">
              Terms of Service
            </Link>
            <a href="mailto:rehanabduloffical@gmail.com" className="hover:text-[#8B6914] transition-colors">
              Contact
            </a>
            <Link href="/login" className="hover:text-[#8B6914] transition-colors">
              Sign In
            </Link>
          </div>

          <p className="text-xs" style={{ color: '#9B9890' }}>
            © {new Date().getFullYear()} Folio. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
