# 📚 Folio — Kindle-Like Reading Web App

A distraction-free, full-stack reading app built with **Next.js 14**, **Supabase**, **epub.js**, and **OpenAI GPT-4o Mini**.

---

## ✨ Features

| Feature | Status |
|---|---|
| Google Sign-In via Supabase Auth | ✅ |
| Personalized Home Dashboard | ✅ |
| Library with genre filter + search | ✅ |
| EPUB reader (epub.js, scrolled) | ✅ |
| Light / Sepia / Dark reading themes | ✅ |
| Adjustable font size & line height | ✅ |
| Chapter sidebar with navigation | ✅ |
| Text highlighting (4 colors) | ✅ |
| Click-to-define vocabulary popover | ✅ |
| AI contextual word explanation | ✅ |
| AI Reading Assistant panel | ✅ |
| Chapter Quiz (10 MCQ, AI-generated) | ✅ |
| Vocabulary library with CSV export | ✅ |
| Highlights library with jump-to | ✅ |
| Reading progress persistence | ✅ |
| Keyboard shortcuts | ✅ |

---

## 🚀 Getting Started

### 1. Prerequisites

- Node.js 18+
- A Supabase project ([supabase.com](https://supabase.com))
- An OpenAI API key with GPT-4o Mini access

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy `.env.local.example` to `.env.local` and fill in your values:

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_PROJECT_ID=your-project-id
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Set up Supabase

**Run the schema:**
1. Go to your Supabase Dashboard → SQL Editor
2. Paste the contents of `supabase/schema.sql`
3. Click **Run**

**Create Storage Buckets:**
1. Go to Storage → New Bucket
2. Create `books` bucket — **Private** (EPUBs)
3. Create `covers` bucket — **Public** (cover images)

**Configure Google OAuth:**
1. Go to Authentication → Providers → Google
2. Enable Google and add your OAuth credentials
3. Add `http://localhost:3000/auth/callback` to allowed redirect URLs

### 5. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
src/
├── app/
│   ├── login/          # Authentication page
│   ├── home/           # Dashboard
│   ├── library/        # Book library
│   ├── read/[bookId]/  # Core reading interface
│   ├── vocab/          # Vocabulary section
│   ├── highlights/     # Highlights section
│   └── api/
│       ├── ai/         # AI assistant (GPT-4o Mini)
│       ├── quiz/       # Quiz generation + results
│       ├── dictionary/ # Free Dictionary API + AI context
│       ├── highlights/ # CRUD
│       ├── vocab/      # CRUD
│       └── books/      # Upload + progress
├── components/
│   ├── layout/         # AppShell (nav)
│   ├── home/           # Dashboard widgets
│   ├── library/        # Library grid + upload modal
│   ├── reader/         # Full reader UI (7 components)
│   ├── vocab/          # Vocabulary client
│   └── highlights/     # Highlights client
├── lib/
│   ├── supabase/       # client.ts + server.ts
│   ├── openai.ts       # OpenAI client + prompt templates
│   ├── store.ts        # Zustand reader store
│   └── utils.ts        # Shared utilities
└── types/
    └── index.ts        # All TypeScript types
```

---

## ⌨️ Keyboard Shortcuts (Reader)

| Key | Action |
|---|---|
| `→` or `]` | Next chapter |
| `←` or `[` | Previous chapter |
| `Ctrl + B` | Toggle chapter sidebar |
| `Ctrl + I` | Toggle AI assistant |
| `Esc` | Close panels / dismiss popovers |

---

## 🏗️ Deployment (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set env variables in Vercel Dashboard:
# Settings → Environment Variables → add all from .env.local
```

Add `https://your-app.vercel.app/auth/callback` to Supabase allowed redirect URLs.

---

## 🗺️ Next Steps (Post-MVP)

- [ ] Reading timer + session logging
- [ ] In-book search (Ctrl+F)
- [ ] Weekly reading goals
- [ ] Book completion celebration screen
- [ ] AI chapter summaries (cached)
- [ ] Chapter annotations / scratchpad
- [ ] Highlight note editing in-reader
