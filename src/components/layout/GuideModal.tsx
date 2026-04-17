'use client';

import { X, Book, FileText, Cpu, UserCircle, Mail, Trophy } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export default function GuideModal({ onClose }: Props) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative z-10 w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden animate-float-up"
        style={{
          backgroundColor: 'var(--bg, #FAF8F4)',
          borderColor: 'var(--border, #E5E0D8)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-5 border-b shrink-0"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-sidebar, #F2EFE9)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
              style={{ backgroundColor: '#8B6914' }}
            >
              <Book className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)', fontFamily: 'Lora, Georgia, serif' }}>
                Welcome to Folio
              </h2>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Your intelligent reading companion
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-black/5 transition-colors"
          >
            <X className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 custom-scrollbar">

          {/* How to use */}
          <section>
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-3" style={{ color: 'var(--text-primary)', fontFamily: 'Lora, Georgia, serif' }}>
              <Book className="w-5 h-5" style={{ color: '#8B6914' }} /> How to Use Folio
            </h3>
            <div className="space-y-3 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              <p>
                Folio is designed to enhance your reading experience. Start by navigating to the <strong>Library</strong> section to upload your favorite books.
              </p>
              <p>
                While reading, you can highlight text, save vocabulary words, and interact with the AI assistant to ask questions, summarize chapters, or get explanations for complex concepts.
                Your progress, highlights, and vocabulary are automatically saved and can be accessed from the sidebar.
              </p>
            </div>
          </section>

          {/* Quiz & Gamification */}
          <section>
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-3" style={{ color: 'var(--text-primary)', fontFamily: 'Lora, Georgia, serif' }}>
              <Trophy className="w-5 h-5" style={{ color: '#8B6914' }} /> Quiz & Gamification
            </h3>
            <div className="space-y-3 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              <p>
                Head over to the <strong>Quiz</strong> section to test your knowledge. It offers three unique experiences:
                a Daily <strong>Vocabulary set</strong>, a Daily <strong>Idioms set</strong>, and the interactive <strong>Game Mode</strong>.
              </p>
              <p>
                The <strong>Game Mode</strong> draws from a curated, offline question bank to test your knowledge with Multiple Choice questions. Climb the global <strong>Top 5 Leaderboard</strong> to see how you rank among other readers!
              </p>
            </div>
          </section>

          {/* Supported Files */}
          <section>
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-3" style={{ color: 'var(--text-primary)', fontFamily: 'Lora, Georgia, serif' }}>
              <FileText className="w-5 h-5" style={{ color: '#8B6914' }} /> Supported Formats
            </h3>
            <div className="p-4 rounded-xl border bg-white/50" style={{ borderColor: 'var(--border)' }}>
              <p className="text-sm leading-relaxed mb-2" style={{ color: 'var(--text-secondary)' }}>
                Currently, Folio exclusively supports <strong>EPUB (.epub)</strong> files for a seamless, reflowable reading experience.
              </p>
              <ul className="list-disc pl-5 text-sm space-y-1" style={{ color: 'var(--text-secondary)' }}>
                <li>Upload cleanly formatted EPUBs for the best AI analysis.</li>
                <li>Add custom cover images optionally during the upload process.</li>
              </ul>
            </div>
          </section>

          {/* System Information */}
          <section>
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-3" style={{ color: 'var(--text-primary)', fontFamily: 'Lora, Georgia, serif' }}>
              <Cpu className="w-5 h-5" style={{ color: '#8B6914' }} /> How it Works & AI
            </h3>
            <div className="space-y-3 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              <p>
                Folio is a modern web application built with <strong>Next.js</strong> and <strong>React</strong>. It stores your library securely using <strong>Supabase</strong>.
              </p>
              <p>
                The intelligence engine is powered by advanced AI models (such as OpenAI/GPT).
                When you ask a question or request a chapter summary, the AI processes the specific context of the book you are reading to provide accurate, insightful, and relevant responses directly inside your reader.
              </p>
            </div>
          </section>

          {/* Creator Information */}
          <section>
            <div
              className="p-5 rounded-2xl border"
              style={{
                backgroundColor: 'var(--bg-sidebar, #F2EFE9)',
                borderColor: 'var(--border)',
              }}
            >
              <h3 className="font-semibold mb-1" style={{ color: 'var(--text-primary)', fontFamily: 'Lora, Georgia, serif' }}>
                Creator Information
              </h3>
              <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                Folio is passionately designed and built by me, Abdul Rehan.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <UserCircle className="w-4 h-4" style={{ color: '#8B6914' }} />
                  <span style={{ color: 'var(--text-primary)' }} className="font-medium">Abdul Rehan</span>
                </div>
                <div className="hidden sm:block text-gray-300">•</div>
                <a
                  href="mailto:mintbyte90@gmail.com"
                  className="flex items-center gap-2 text-sm hover:underline"
                  style={{ color: '#8B6914' }}
                >
                  <Mail className="w-4 h-4" />
                  mintbyte90@gmail.com
                </a>
              </div>
            </div>
          </section>
          {/* Disclaimer */}
          <section>
            <p className="text-xs italic text-center mx-auto max-w-lg mt-4" style={{ color: 'var(--text-secondary)' }}>
              The content present in this site has been submitted by users (made it public for user testing purposes) and the site is not responsible for the content uploaded.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div
          className="px-6 py-4 border-t shrink-0 flex justify-end"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg, #FAF8F4)' }}
        >
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90 active:scale-95"
            style={{ backgroundColor: '#8B6914' }}
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}
