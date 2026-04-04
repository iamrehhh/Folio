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

Folio is a full-stack web reading platform designed to transform how you engage with books. It combines the clean, distraction-free reading experience of a Kindle with the intelligence of an AI assistant — letting you read, highlight, define words in context, take vocabulary notes, test your comprehension, and actively build your English language skills, all in one place.

Built for readers who want more than just a page-turner. Every book you read in Folio becomes a learning experience.

---

## Features

### Reading Experience
- **EPUB reader** with smooth scrolling, sepia/light/dark themes, and adjustable font size & line height
- **Chapter navigation** with a collapsible sidebar showing full nested TOC including parts and sections
- **Exact reading position restored** — returns to the precise paragraph where you left off, not just the chapter
- **Book completion celebration** — confetti screen with star rating when you genuinely finish a book
- **Session timer** — tracks time spent reading per session, hideable from the top bar
- **Highlight management** — add highlights in 4 colours, remove them directly from the reader

### Intelligence Layer
- **AI Reading Assistant** — ask questions about the book, get summaries, explore themes
- **Contextual word definitions** — click any word to see its meaning in the context of the sentence
- **AI-ranked standard definitions** — when a word has multiple meanings, AI picks the most contextually appropriate one
- **Chapter Quiz** — AI-generated 10-question multiple choice quiz to test comprehension of any chapter

### Daily Quiz — Vocabulary & Idioms
- **Daily Vocabulary Set** — 5 advanced words each day tuned for IPMAT/JIPMAT level, with definitions, formal and conversational examples, and synonyms
- **Daily Idioms Set** — 5 idioms per day in the same format, building idiomatic fluency
- **Fill-in-the-blank quiz** — randomised questions with a word bank; accepts grammatically adjusted forms (-ed, -ing, -s)
- **AI answer checking** — evaluates each answer and gives per-question feedback with an overall score
- **Reading passage** — AI-generated 200-word passage in a varied genre (mystery, fantasy, romance, science, etc.) using all 5 words naturally
- **No repeats within 7 days** — same daily set shared across all users; words and idioms rotate to avoid repetition

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
- **Direct-to-storage uploads** — EPUBs upload directly to Supabase Storage, bypassing Vercel size limits
- **Navigation progress bar** — smooth gold loading indicator on every page transition
- **Admin-only uploads** — only the designated admin can add books; other users can request via email

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

**Database:** Run `supabase/schema.sql` in your Supabase SQL Editor, then also run:

```sql
-- Daily quiz sets (shared across all users)
CREATE TABLE daily_quiz_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  date DATE NOT NULL,
  items JSONB NOT NULL,
  fill_blanks JSONB NOT NULL,
  passage TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(type, date)
);

-- User quiz attempts
CREATE TABLE quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_set_id UUID REFERENCES daily_quiz_sets(id) ON DELETE CASCADE,
  stage TEXT NOT NULL DEFAULT 'learn',
  answers JSONB,
  score INTEGER,
  feedback JSONB,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, quiz_set_id)
);

ALTER TABLE daily_quiz_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can read quiz sets" ON daily_quiz_sets FOR SELECT TO authenticated USING (true);
CREATE POLICY "users manage own attempts" ON quiz_attempts FOR ALL TO authenticated USING (user_id = auth.uid());
```

**Storage Buckets:**

| Bucket | Visibility | Purpose |
|---|---|---|
| `books` | Private | EPUB files |
| `covers` | Public | Cover images |

**Storage Policies:**
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
│   ├── quiz/               # Daily quiz hub
│   │   ├── vocabulary/     # Vocabulary quiz flow
│   │   └── idioms/         # Idioms quiz flow
│   └── api/                # API routes
│       ├── ai/             # AI assistant
│       ├── quiz/           # Chapter quiz generation
│       ├── quiz-sets/      # Daily vocabulary & idiom sets
│       ├── dictionary/     # Word definitions
│       ├── books/          # Book metadata & progress
│       ├── highlights/     # Highlights CRUD
│       ├── vocab/          # Vocabulary CRUD
│       └── sessions/       # Reading sessions
├── components/
│   ├── layout/             # Navigation, progress bar
│   ├── home/               # Dashboard widgets
│   ├── library/            # Library grid, upload, edit modals
│   ├── reader/             # Reader UI (9 components)
│   ├── quiz/               # Daily quiz client
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
