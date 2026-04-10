// Save this as: src/app/privacy-policy/page.tsx

import Link from 'next/link';
import { BookOpen, ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy — Folio',
  description: 'Privacy policy for Folio, your intelligent reading companion.',
};

export default function PrivacyPolicyPage() {
  return (
    <div
      className="min-h-screen relative"
      style={{ backgroundColor: '#FAF8F4', color: '#1C1C1E', fontFamily: 'var(--font-inter, system-ui, sans-serif)' }}
    >
      {/* Dotted texture */}
      <div
        className="fixed inset-0 opacity-[0.12] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#8B6914 0.5px, transparent 0.5px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-5 border-b" style={{ borderColor: '#E5E0D8' }}>
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-[10px] flex items-center justify-center" style={{ backgroundColor: '#8B6914' }}>
            <BookOpen className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-xl font-semibold tracking-tight" style={{ fontFamily: 'Lora, Georgia, serif', color: '#1C1C1E' }}>
            Folio
          </span>
        </Link>
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-[#8B6914]"
          style={{ color: '#6B6860' }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </nav>

      {/* Content */}
      <main className="relative z-10 max-w-3xl mx-auto px-6 md:px-8 py-14">
        <div
          className="rounded-2xl border p-8 md:p-12"
          style={{ backgroundColor: '#fff', borderColor: '#E5E0D8' }}
        >
          <h1
            className="text-3xl md:text-4xl font-bold mb-2"
            style={{ fontFamily: 'Lora, Georgia, serif', color: '#1C1C1E' }}
          >
            Privacy Policy
          </h1>
          <p className="text-sm mb-10" style={{ color: '#9B9890' }}>
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <div className="space-y-10 text-sm leading-relaxed" style={{ color: '#4A4740' }}>

            <section>
              <h2 className="text-lg font-semibold mb-3" style={{ fontFamily: 'Lora, Georgia, serif', color: '#1C1C1E' }}>
                1. Introduction
              </h2>
              <p>
                Welcome to <strong>Folio</strong>. Folio is an intelligent reading companion
                application that allows users to read EPUB books, save highlights and vocabulary words, and use AI-powered
                features to deepen their understanding of what they read.
              </p>
              <p className="mt-3">
                This Privacy Policy explains how we collect, use, and protect your personal information when you use
                Folio at <strong>foliolib.xyz</strong>. By using Folio, you agree to the practices described here.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3" style={{ fontFamily: 'Lora, Georgia, serif', color: '#1C1C1E' }}>
                2. Information We Collect
              </h2>
              <p className="mb-3">We collect the following types of information:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Account information</strong> — your name and email address, collected when you sign up using
                  Google, Discord, or email and password.
                </li>
                <li>
                  <strong>Reading data</strong> — the books you upload, your reading progress (chapter and position),
                  highlights you save, vocabulary words you collect, and quiz results.
                </li>
                <li>
                  <strong>Usage data</strong> — reading session durations, features you use, and how you interact
                  with the application.
                </li>
                <li>
                  <strong>Content you upload</strong> — EPUB files and optional cover images you upload to your personal
                  library. These are stored securely and associated only with your account.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3" style={{ fontFamily: 'Lora, Georgia, serif', color: '#1C1C1E' }}>
                3. How We Use Your Information
              </h2>
              <p className="mb-3">We use the information we collect to:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Provide and operate the Folio reading platform</li>
                <li>Sync your reading progress, highlights, and vocabulary across sessions</li>
                <li>Power AI features such as word definitions, chapter summaries, and quiz generation</li>
                <li>Show you reading statistics and streaks</li>
                <li>Send you authentication-related emails (password resets, email verification)</li>
                <li>Improve and maintain the application</li>
              </ul>
              <p className="mt-3">
                We do <strong>not</strong> sell your personal information to third parties. We do not use your data
                for advertising purposes.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3" style={{ fontFamily: 'Lora, Georgia, serif', color: '#1C1C1E' }}>
                4. Third-Party Services
              </h2>
              <p className="mb-3">Folio uses the following third-party services to operate:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Supabase</strong> — for user authentication, database storage, and file storage.
                  Your data is stored securely on Supabase's infrastructure.
                </li>
                <li>
                  <strong>OpenAI</strong> — for AI-powered features including word definitions in context,
                  chapter summaries, quiz generation, and vocabulary explanations. Text from your current
                  chapter may be sent to OpenAI's API to generate responses.
                </li>
                <li>
                  <strong>Google / Discord</strong> — if you choose to sign in using Google or Discord OAuth,
                  your basic profile information (name, email, avatar) is shared with us by those providers.
                </li>
                <li>
                  <strong>Vercel</strong> — for hosting the application. Vercel may collect standard server
                  logs including IP addresses and request metadata.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3" style={{ fontFamily: 'Lora, Georgia, serif', color: '#1C1C1E' }}>
                5. User-Uploaded Content
              </h2>
              <p>
                When you upload EPUB books or cover images to Folio, those files are stored in your private
                Supabase Storage bucket and are accessible only to your account. Folio does not claim any
                ownership over content you upload.
              </p>
              <p className="mt-3">
                <strong>Important:</strong> You are solely responsible for ensuring you have the right to upload
                and read any content you add to Folio. The content present in this application has been submitted
                by users and Folio is not responsible for the content uploaded.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3" style={{ fontFamily: 'Lora, Georgia, serif', color: '#1C1C1E' }}>
                6. Data Security
              </h2>
              <p>
                We take reasonable measures to protect your information. All data is transmitted over HTTPS.
                Authentication is handled by Supabase, which uses industry-standard security practices including
                JWT tokens and Row Level Security (RLS) policies to ensure users can only access their own data.
              </p>
              <p className="mt-3">
                However, no method of internet transmission or electronic storage is 100% secure. While we strive
                to protect your data, we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3" style={{ fontFamily: 'Lora, Georgia, serif', color: '#1C1C1E' }}>
                7. Your Rights
              </h2>
              <p className="mb-3">You have the right to:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Access the personal data we hold about you</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your account and associated data</li>
                <li>Export your vocabulary words as PDF at any time from within the app</li>
              </ul>
              <p className="mt-3">
                To exercise any of these rights, please contact us at{' '}
                <a href="mailto:mintbyte90@gmail.com" className="underline" style={{ color: '#8B6914' }}>
                  mintbyte90@gmail.com
                </a>
                .
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3" style={{ fontFamily: 'Lora, Georgia, serif', color: '#1C1C1E' }}>
                8. Children's Privacy
              </h2>
              <p>
                Folio is not intended for children under the age of 13. We do not knowingly collect personal
                information from children under 13. If you believe a child has provided us with personal
                information, please contact us and we will promptly delete it.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3" style={{ fontFamily: 'Lora, Georgia, serif', color: '#1C1C1E' }}>
                9. Changes to This Policy
              </h2>
              <p>
                We may update this Privacy Policy from time to time. When we do, we will update the "Last updated"
                date at the top of this page. We encourage you to review this policy periodically.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3" style={{ fontFamily: 'Lora, Georgia, serif', color: '#1C1C1E' }}>
                10. Contact Us
              </h2>
              <p>
                If you have any questions about this Privacy Policy or how we handle your data, please contact us at:
              </p>
              <div
                className="mt-4 p-4 rounded-xl border"
                style={{ backgroundColor: '#FAF8F4', borderColor: '#E5E0D8' }}
              >
                <p><strong>Folio</strong></p>
                <p>
                  Email:{' '}
                  <a href="mailto:mintbyte90@gmail.com" className="underline" style={{ color: '#8B6914' }}>
                    mintbyte90@gmail.com
                  </a>
                </p>
                <p>Application: <a href="https://foliolib.vercel.app" className="underline" style={{ color: '#8B6914' }}>foliolib.xyz</a></p>
              </div>
            </section>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs mt-8" style={{ color: '#9B9890' }}>
          © {new Date().getFullYear()} Folio. All rights reserved.{' '}
          <Link href="/" className="underline hover:text-[#8B6914] transition-colors">
            Back to Home
          </Link>
        </p>
      </main>
    </div>
  );
}
