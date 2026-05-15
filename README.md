<div align="center">

<img src="src/app/icon.svg" width="64" height="64" alt="Folio" />

# Folio

### A personal reading sanctuary for the modern reader

*Read beautifully. Think deeply. Remember more.*

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o%20Mini-412991?style=flat-square&logo=openai)](https://openai.com)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=flat-square&logo=vercel)](https://vercel.com)

</div>

---

## What is Folio?

Folio is a full-stack web reading platform designed to transform how you engage with books. It combines the clean, distraction-free reading experience of a premium e-reader with the intelligence of an AI assistant — letting you read, highlight, define words in context, take vocabulary notes, test your comprehension, and actively build your English language skills, all in one place.

Built for readers who want more than just a page-turner. Every book you read in Folio becomes an engaging learning experience.

---

## Features

### Reading Experience
- **EPUB reader** with smooth scrolling, sepia/light/dark themes, adjustable font size, and line height.
- **Distraction-Free Mode** — Toggle the top navigation bar to hide distractions, easily bringing it back with an intuitive reveal handle.
- **Chapter navigation** with a collapsible sidebar showing full nested TOC including parts and sections.
- **Exact reading position restored** — returns to the precise paragraph where you left off, not just the chapter.
- **Direct Book Interaction** — No more clunky buttons; simply tap a book cover to smoothly transition into your reading session.
- **Session timer** — tracks time spent reading per session.
- **Highlight management** — add highlights in 4 colours, remove them directly from the reader.

### Intelligence Layer
- **AI Reading Assistant** — ask questions about the book, get summaries, explore themes directly alongside the text.
- **Contextual Dictionary Popover** — click any word to see its standard definition alongside an AI-driven contextual meaning tailored to the sentence. Features an automatic animated close sequence upon saving a word.
- **Chapter Quiz** — AI-generated 10-question multiple choice quiz to test comprehension of any chapter.

### Daily Quiz — Vocabulary & Idioms
- **Daily Vocabulary Set** — 5 advanced words each day (IPMAT/JIPMAT level), with definitions, formal and conversational examples, and synonyms.
- **Daily Idioms Set** — 5 idioms per day in the same format, building idiomatic fluency.
- **Game Mode (Gamify)** — fully adaptive, infinitely generated MCQ quiz targeting your weak words (spaced repetition) with a Top 5 Leaderboard.
- **Fill-in-the-blank quiz** — randomised questions with a word bank; accepts grammatically adjusted forms (-ed, -ing, -s).
- **Reading passage** — AI-generated 200-word passage in varied genres naturally using all 5 words.

### Library & Organisation
- **My Library** — Your personal collection with seamless sorting by newest/oldest additions.
- **Public Library** — A clean, minimalist curated collection available to all users with centered search and dynamic filter elements.
- **Personal Vault** — A centralized hub for your Notes, Reading Lists, Vocabulary, and Quick Captures. Features pinning, colored cards, and full searchability.
- **Highlights Library** — all your highlights in one place, colour-coded, with jump-to-location.
- **Vocabulary Notebook** — save words with definitions, pronunciation, part of speech, and AI context.

### Platform
- **Support Reports** — In-app user reporting system with real-time, pulsing red badge notifications for admins on unread messages.
- **Google Sign-In** via Supabase Auth.
- **Fully responsive** — tailored layouts for desktop, tablet, and mobile.
- **Direct-to-storage uploads** — EPUBs upload directly to Supabase Storage, bypassing server size limits.
- **Admin-only uploads** — designated admins manage the public catalog; personal libraries remain private.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 14 (App Router) |
| **Database & Auth** | Supabase (PostgreSQL + RLS) |
| **Storage** | Supabase Storage |
| **AI** | OpenAI GPT-4o Mini |
| **EPUB Rendering** | epub.js |
| **Dictionary API** | Free Dictionary API |
| **State Management** | Zustand |
| **Animations** | Framer Motion |
| **Styling** | Tailwind CSS |
| **Hosting** | Vercel |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- An OpenAI API key

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/folio.git
cd folio

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
```

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_PROJECT_ID=your-project-id
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Supabase Setup

**Database:** Run `supabase/schema.sql` and `supabase_optimizations.sql` in your Supabase SQL Editor. Also ensure all migrations for personal vaults, report notifications, and daily quizzes are run.

**Storage Buckets:**

| Bucket | Visibility | Purpose |
|---|---|---|
| `books` | Private | EPUB files |
| `covers` | Public | Cover images |

**Google OAuth:** Enable in Supabase → Authentication → Providers → Google. Add your OAuth credentials and set the redirect URL to `https://your-project.supabase.co/auth/v1/callback`.

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
src/
├── app/
│   ├── login/              # Authentication
│   ├── (protected)/        # Authenticated areas
│   │   ├── home/           # Dashboard
│   │   ├── library/        # Personal & Public Library
│   │   ├── read/[bookId]/  # Distraction-free Reader
│   │   ├── vault/          # Personal Vault
│   │   ├── vocab/          # Vocabulary notebook
│   │   ├── highlights/     # Highlights collection
│   │   ├── quiz/           # Daily quizzes
│   │   ├── report/         # Support Reports
│   │   └── admin/          # Admin Dashboard
│   └── api/                # API routes
├── components/
│   ├── layout/             # Navigation & Context
│   ├── library/            # Library grids & cards
│   ├── reader/             # Core EPUB UI components
│   ├── vault/              # Vault UI and modal components
│   └── ...                 # Feature-specific components
└── lib/
    ├── supabase/           # Client & Server instances
    ├── openai.ts           # OpenAI configuration
    └── store.ts            # Zustand global state
```

---

## Reader Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `→` or `]` | Next chapter |
| `←` or `[` | Previous chapter |
| `Ctrl + B` | Toggle chapter sidebar |
| `Ctrl + I` | Toggle AI assistant |
| `Esc` | Close panels / Settings |

---

## Deployment

```bash
npx vercel
```

Add all environment variables in Vercel → Settings → Environment Variables. Update your Supabase allowed redirect URLs to include your production domain.

---

## EPUB Compatibility

Folio works best with standard EPUB2 and well-structured EPUB3 files. For the most reliable experience, books from [Project Gutenberg](https://gutenberg.org) and [Standard Ebooks](https://standardebooks.org) are recommended. Commercial EPUBs with DRM encryption are not supported.

---

<div align="center">

Built with care for readers who take their books seriously.

</div>
