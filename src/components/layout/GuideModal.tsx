'use client';

import { X, Book, FileText, Cpu, UserCircle, Mail, Trophy, Bug, Calendar, Keyboard, KeyRound, BookMarked, Library, Users, Bookmark, Linkedin } from 'lucide-react';

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
              <div className="text-sm mb-4 leading-relaxed space-y-2" style={{ color: 'var(--text-secondary)' }}>
                <p>
                  Hi, I'm Abdul Rehan, a college student with no traditional coding background. Fascinated by the concept of "vibe coding", I learned how to build full-stack web applications entirely by interacting with AI tools like Antigravity and Claude, alongside watching YouTube tutorials.
                </p>
                <p>
                  I've experimented with building various projects through prompt engineering, and Folio stands as the proudest and most advanced platform I've created so far!
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <UserCircle className="w-4 h-4" style={{ color: '#8B6914' }} />
                  <span style={{ color: 'var(--text-primary)' }} className="font-medium">Abdul Rehan</span>
                </div>
                <div className="hidden sm:block text-gray-300">•</div>
                <a
                  href="mailto:rehanabduloffical@gmail.com"
                  className="flex items-center gap-2 text-sm hover:underline"
                  style={{ color: '#8B6914' }}
                >
                  <Mail className="w-4 h-4" />
                  rehanabduloffical@gmail.com
                </a>
                <div className="hidden sm:block text-gray-300">•</div>
                <a
                  href="https://www.linkedin.com/in/abdul-rehan-239267419/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm hover:underline"
                  style={{ color: '#8B6914' }}
                >
                  <Linkedin className="w-4 h-4" />
                  LinkedIn
                </a>
              </div>
            </div>
          </section>

          {/* How to use */}
          <section>
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-3" style={{ color: 'var(--text-primary)', fontFamily: 'Lora, Georgia, serif' }}>
              <Book className="w-5 h-5" style={{ color: '#8B6914' }} /> How to Use Folio
            </h3>
            <div className="space-y-3 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              <p>
                Folio is designed to enhance your reading experience. Start by navigating to the <strong>Library</strong> section to browse the public catalog or curate your personal collection.
              </p>
              <p>
                While reading, you can highlight text, save vocabulary words, and interact with the AI assistant to ask questions, summarize chapters, or get explanations for complex concepts.
                Your progress, highlights, and vocabulary are automatically saved and can be accessed from the sidebar.
              </p>
            </div>
          </section>

          {/* My Library & Public Library */}
          <section>
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-3" style={{ color: 'var(--text-primary)', fontFamily: 'Lora, Georgia, serif' }}>
              <BookMarked className="w-5 h-5" style={{ color: '#8B6914' }} /> My Library & Public Library
            </h3>
            <div className="space-y-3 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              <p>
                Your library is split into two views, accessible from the <strong>sidebar</strong>:
              </p>
              <div className="p-4 rounded-xl border bg-white/50 space-y-3" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: '#8B691418' }}>
                    <BookMarked className="w-4 h-4" style={{ color: '#8B6914' }} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>My Library</p>
                    <p className="text-sm">Contains books you've <strong>uploaded</strong> and books you've explicitly <strong>added</strong> from the public catalog. This is your personal, curated collection.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: '#8B691418' }}>
                    <Library className="w-4 h-4" style={{ color: '#8B6914' }} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Public Library</p>
                    <p className="text-sm">Shows all books available on the platform. Browse and discover new reads from the full catalog.</p>
                  </div>
                </div>
              </div>
              <p>
                To <strong>add a book</strong> to your personal library, browse the Public Library and click the <strong>"+ Add to My Library"</strong> button on any book card. To <strong>remove</strong> a book, click the <strong>⋮ menu</strong> on the book cover and select <strong>"Remove from library"</strong>.
              </p>
              <p>
                Use the <strong>Authors</strong> section in the sidebar to filter books by a specific author — great for quickly finding titles in a growing collection.
              </p>
            </div>
          </section>

          {/* Bookmarks */}
          <section>
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-3" style={{ color: 'var(--text-primary)', fontFamily: 'Lora, Georgia, serif' }}>
              <Bookmark className="w-5 h-5" style={{ color: '#8B6914' }} /> Bookmarks
            </h3>
            <div className="space-y-3 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              <p>
                Keep track of your favorite passages, important scenes, or simply where you left off using the <strong>Bookmark</strong> feature inside the Reader.
              </p>
              <p>
                Click the bookmark icon in the top navigation bar while reading to save your exact position. You can view all your saved bookmarks in the <strong>Sidebar</strong> under the "Bookmarks" tab, allowing you to easily jump back to specific sections within the book.
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
                <li><strong>Note on compatibility:</strong> We currently do not support <strong>DRM-protected files</strong>, <strong>fixed-layout EPUBs</strong>, or heavily <strong>image-based files</strong> (such as comics or manga). These formats may fail to upload or render properly.</li>
              </ul>
            </div>
          </section>

          {/* Keyboard Shortcuts */}
          <section>
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-3" style={{ color: 'var(--text-primary)', fontFamily: 'Lora, Georgia, serif' }}>
              <Keyboard className="w-5 h-5" style={{ color: '#8B6914' }} /> Keyboard Shortcuts
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <div className="space-y-2">
                <h4 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Reader Mode</h4>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2"><kbd className="px-1.5 py-0.5 rounded border text-xs font-sans leading-none" style={{ backgroundColor: 'var(--bg-sidebar, #F2EFE9)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>→ / ]</kbd> Next Chapter</li>
                  <li className="flex items-center gap-2"><kbd className="px-1.5 py-0.5 rounded border text-xs font-sans leading-none" style={{ backgroundColor: 'var(--bg-sidebar, #F2EFE9)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>← / [</kbd> Previous Chapter</li>
                  <li className="flex items-center gap-2"><kbd className="px-1.5 py-0.5 rounded border text-xs font-sans leading-none" style={{ backgroundColor: 'var(--bg-sidebar, #F2EFE9)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>Ctrl/Cmd + B</kbd> Toggle Sidebar</li>
                  <li className="flex items-center gap-2"><kbd className="px-1.5 py-0.5 rounded border text-xs font-sans leading-none" style={{ backgroundColor: 'var(--bg-sidebar, #F2EFE9)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>Ctrl/Cmd + I</kbd> Toggle AI Panel</li>
                  <li className="flex items-center gap-2"><kbd className="px-1.5 py-0.5 rounded border text-xs font-sans leading-none" style={{ backgroundColor: 'var(--bg-sidebar, #F2EFE9)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>Esc</kbd> Close popups</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold" style={{ color: 'var(--text-primary)' }}>AI Chat & Forms</h4>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2"><kbd className="px-1.5 py-0.5 rounded border text-xs font-sans leading-none" style={{ backgroundColor: 'var(--bg-sidebar, #F2EFE9)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>Enter</kbd> Send message</li>
                  <li className="flex items-center gap-2"><kbd className="px-1.5 py-0.5 rounded border text-xs font-sans leading-none" style={{ backgroundColor: 'var(--bg-sidebar, #F2EFE9)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>Shift + Enter</kbd> New line</li>
                </ul>
              </div>
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

          {/* Scheduling & Calendar */}
          <section>
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-3" style={{ color: 'var(--text-primary)', fontFamily: 'Lora, Georgia, serif' }}>
              <Calendar className="w-5 h-5" style={{ color: '#8B6914' }} /> Reading Schedule
            </h3>
            <div className="space-y-3 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              <p>
                Use the <strong>Calendar Scheduling</strong> feature to plan and track your reading habits. It provides an intuitive, visually elegant calendar where you can map out your reading goals and keep your sessions organized.
              </p>
              <p>
                Setting regular schedules helps you build a strong reading habit over time by giving you a clear, synchronized overview of your reading progress and commitments.
              </p>
            </div>
          </section>

          {/* Personal Vault */}
          <section>
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-3" style={{ color: 'var(--text-primary)', fontFamily: 'Lora, Georgia, serif' }}>
              <KeyRound className="w-5 h-5" style={{ color: '#8B6914' }} /> Personal Vault
            </h3>
            <div className="space-y-3 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              <p>
                Your <strong>Personal Vault</strong> is a private space to store notes, reading lists, vocabulary, and quick captures — all in one place. Access it from your <strong>Profile</strong> page.
              </p>
              <p>
                Organize entries with <strong>color-coded cards</strong>, pin important ones to the top, and use category tabs to filter between Notes, Reading Lists, Vocabulary, and Captures.
              </p>
            </div>
          </section>

          {/* Bug Reporting */}
          <section>
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-3" style={{ color: 'var(--text-primary)', fontFamily: 'Lora, Georgia, serif' }}>
              <Bug className="w-5 h-5" style={{ color: '#8B6914' }} /> Feedback & Bug Reporting
            </h3>
            <div className="space-y-3 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              <p>
                Encountered an issue or have a suggestion? Use the <strong>Report Bug</strong> feature, accessible via the app menu or sidebar.
              </p>
              <p>
                You can submit error descriptions, discuss fixes via the support chat, and attach screenshots. Our system securely uses OCR (Optical Character Recognition) behind the scenes to analyze screenshot text seamlessly, helping us accurately identify and resolve your issues.
              </p>
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
              <p className="italic opacity-90">
                *Note: AI can sometimes make mistakes. Please verify important information.*
              </p>
            </div>
          </section>

          {/* Disclaimer */}
          <section>
            <p className="text-xs text-center mx-auto max-w-lg mt-4 px-4 py-3 rounded-lg" style={{ color: '#ef4444', backgroundColor: '#ef444410', border: '1px solid #ef444430' }}>
              The books in the public library do not have any copyright issues, and have been solely uploaded by the admin for experimental purposes to try out the reading features before users upload their own books.<br/><br/>
              <strong>We strictly do not endorse piracy or copyrighted material.</strong>
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
