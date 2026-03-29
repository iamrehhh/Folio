<div align="center">

<img src="public/icon.svg" width="64" height="64" alt="Folio" />

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

Folio is a full-stack web reading platform designed to transform how you engage with books. It combines the clean, distraction-free reading experience of a Kindle with the intelligence of an AI assistant — letting you read, highlight, define words in context, take vocabulary notes, and test your comprehension, all in one place.

Built for readers who want more than just a page-turner. Every book you read in Folio becomes a learning experience.

---

## Features

### Reading Experience
- **EPUB reader** with smooth scrolling, sepia/light/dark themes, and adjustable font size & line height
- **Chapter navigation** with a collapsible sidebar showing full nested TOC
- **Reading progress** persisted across sessions — pick up exactly where you left off
- **Book completion celebration** — confetti screen with star rating when you finish a book
- **Session timer** — tracks time spent reading per session, hideable from top bar

### Intelligence Layer
- **AI Reading Assistant** — ask questions about the book, get summaries, explore themes
- **Contextual word definitions** — click any word to see its meaning *in the context of the sentence*, not just a dictionary lookup
- **AI-ranked standard definitions** — when a word has multiple meanings, AI picks the most contextually appropriate one
- **Chapter Quiz** — AI-generated 10-question multiple choice quiz to test comprehension of any chapter

### Library & Organisation
- **Personal library** with genre filtering, search, and reading status tabs (All / In Progress / Unread / Completed)
- **Curated collection** — books uploaded by the admin are available to all users automatically
- **Real-time updates** — new books appear instantly without page refresh via Supabase Realtime
- **Book covers** — upload custom covers or add them later via the edit modal
- **Highlights library** — all your highlights in one place, colour-coded, with jump-to-location
- **Vocabulary notebook** — save words with definitions, pronunciation, part of speech, and AI context

### Platform
- **Google Sign-In** via Supabase Auth
- **Fully responsive** — works on desktop, tablet, and mobile
- **Direct-to-storage uploads** — EPUBs upload directly to Supabase Storage, bypassing Vercel limits entirely
- **Navigation progress bar** — smooth gold loading indicator on every page transition

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Database & Auth | Supabase (PostgreSQL + RLS) |
| Storage | Supabase Storage |
| AI | OpenAI GPT-4o Mini |
| EPUB Rendering | epub.js |
| Dictionary | Free Dictionary API |
| State Management | Zustand |
| Styling | Tailwind CSS |
| Hosting | Vercel |

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

**Database:** Run `supabase/schema.sql` in your Supabase SQL Editor.

**Storage Buckets:**

| Bucket | Visibility | Purpose |
|---|---|---|
| `books` | Private | EPUB files |
| `covers` | Public | Cover images |

**Storage Policies** — run in SQL Editor:
```sql
CREATE POLICY "users can upload own books"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'books' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "users can read own books"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'books' AND (storage.foldername(name))[1] = auth.uid()::text);

ALTER TABLE books REPLICA IDENTITY FULL;
```

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
│   ├── home/               # Personal dashboard
│   ├── library/            # Book library
│   ├── read/[bookId]/      # Reading interface
│   ├── vocab/              # Vocabulary notebook
│   ├── highlights/         # Highlights collection
│   └── api/                # API routes
│       ├── ai/             # AI assistant
│       ├── quiz/           # Quiz generation
│       ├── dictionary/     # Word definitions
│       ├── books/          # Book metadata
│       ├── highlights/     # Highlights CRUD
│       ├── vocab/          # Vocabulary CRUD
│       └── sessions/       # Reading sessions
├── components/
│   ├── layout/             # Navigation, progress bar
│   ├── home/               # Dashboard widgets
│   ├── library/            # Library grid, upload, edit modals
│   ├── reader/             # Reader UI (8 components)
│   ├── vocab/              # Vocabulary client
│   └── highlights/         # Highlights client
└── lib/
    ├── supabase/           # Client & server Supabase instances
    ├── openai.ts           # OpenAI client & prompt templates
    ├── store.ts            # Zustand reader state
    └── utils.ts            # Shared utilities
```

---

## Reader Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `→` or `]` | Next chapter |
| `←` or `[` | Previous chapter |
| `Ctrl + B` | Toggle chapter sidebar |
| `Ctrl + I` | Toggle AI assistant |
| `Esc` | Close panels |

---

## Deployment

```bash
# Deploy to Vercel
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
