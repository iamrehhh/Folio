'use client';

import { useState, useEffect } from 'react';
import { BookMarked, Lightbulb, ChevronRight, CheckCircle2, XCircle, Loader2, BookOpen } from 'lucide-react';

type Stage = 'loading' | 'learn' | 'test' | 'results' | 'read' | 'complete' | 'done' | 'error';

interface WordItem {
  word: string;
  partOfSpeech: string;
  definition: string;
  formalExample: string;
  conversationalExample: string;
  synonyms: string[];
}

interface FillBlank {
  sentence: string;
  answer: string;
  acceptedForms: string[];
  targetWord: string;
}

interface QuizSet {
  id: string;
  type: 'vocabulary' | 'idiom';
  items: WordItem[];
  fill_blanks: FillBlank[];
  passage: string;
}

interface Props {
  type: 'vocabulary' | 'idiom';
}

export default function QuizClient({ type }: Props) {
  const [stage, setStage] = useState<Stage>('loading');
  const [quizSet, setQuizSet] = useState<QuizSet | null>(null);
  const [answers, setAnswers] = useState<string[]>(['', '', '', '', '']);
  const [results, setResults] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [currentWordIdx, setCurrentWordIdx] = useState(0);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);
  const [customTheme, setCustomTheme] = useState('');
  const [isGeneratingPassage, setIsGeneratingPassage] = useState(false);

  const label = type === 'vocabulary' ? 'Vocabulary' : 'Idioms';
  const accent = '#8B6914';

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/quiz-sets?type=${type}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setQuizSet(data.set);

        if (data.attempt?.stage === 'complete') {
          setAlreadyCompleted(true);
          setStage('done');
        } else if (data.attempt?.stage === 'read') {
          setResults(data.attempt.feedback);
          setStage('read');
        } else {
          setStage('learn');
        }
      } catch (err) {
        console.error(err);
        setStage('error');
      }
    }
    load();
  }, [type]);

  async function handleDoneLearn() {
    if (!quizSet) return;
    await fetch('/api/quiz-sets/attempt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quizSetId: quizSet.id, stage: 'test' }),
    });
    setStage('test');
  }

  async function handleSubmitAnswers() {
    if (!quizSet) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/quiz-sets/attempt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizSetId: quizSet.id, stage: 'test', answers }),
      });
      const data = await res.json();
      setResults(data.results);
      setStage('results');
    } catch { /* ignore */ }
    finally { setSubmitting(false); }
  }

  async function handleNextToRead() {
    if (customTheme.trim() && quizSet && results) {
      setIsGeneratingPassage(true);
      try {
        const res = await fetch('/api/quiz-sets/custom-passage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quizSetId: quizSet.id, theme: customTheme.trim(), type }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.customPassage) {
            setResults({ ...results, customPassage: data.customPassage });
          }
        }
      } catch (err) {
        console.error('Failed to generate custom passage silently falling back', err);
      } finally {
        setIsGeneratingPassage(false);
        setStage('read');
      }
    } else {
      setStage('read');
    }
  }

  async function handleFinish() {
    if (!quizSet) return;
    await fetch('/api/quiz-sets/attempt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quizSetId: quizSet.id, stage: 'complete' }),
    });
    setStage('done');
  }

  // Parse passage with bold markdown and newlines
  function renderPassage(text: string) {
    const paragraphs = text.split('\n').filter(p => p.trim() !== '');
    return paragraphs.map((para, pIdx) => {
      const parts = para.split(/\*\*([^*]+)\*\*/g);
      return (
        <p key={pIdx} className="text-base leading-8 mb-5 last:mb-0" style={{ color: 'var(--text-primary)', fontFamily: 'Lora, Georgia, serif' }}>
          {parts.map((part, i) =>
            i % 2 === 1
              ? <strong key={`${pIdx}-${i}`} style={{ color: accent }}>{part}</strong>
              : <span key={`${pIdx}-${i}`}>{part}</span>
          )}
        </p>
      );
    });
  }

  // ── Loading ──
  if (stage === 'loading') return (
    <div className="flex flex-col items-center justify-center py-32 gap-4">
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: accent }} />
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        Preparing today's {label} set…
      </p>
    </div>
  );

  // ── Error ──
  if (stage === 'error') return (
    <div className="flex flex-col items-center justify-center py-32 gap-3 text-center">
      <XCircle className="w-10 h-10 text-red-400" />
      <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Failed to load quiz set</p>
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Please try refreshing the page.</p>
    </div>
  );

  // ── Already done today ──
  if (stage === 'done') return (
    <div className="flex flex-col items-center justify-center py-32 gap-4 text-center max-w-sm mx-auto">
      <div className="w-16 h-16 rounded-full flex items-center justify-center"
        style={{ backgroundColor: '#8B691415' }}>
        <CheckCircle2 className="w-8 h-8" style={{ color: accent }} />
      </div>
      <h2 className="text-xl font-semibold" style={{ fontFamily: 'Lora, Georgia, serif', color: 'var(--text-primary)' }}>
        {alreadyCompleted ? "You've already completed today's set!" : "Set Complete! ✦"}
      </h2>
      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        Come back tomorrow for a fresh {label.toLowerCase()} set. Consistency is key to building a strong vocabulary!
      </p>
      <a href="/quiz"
        className="mt-2 px-6 py-2.5 rounded-xl text-sm font-medium text-white"
        style={{ backgroundColor: accent }}>
        Back to Quiz
      </a>
    </div>
  );

  if (!quizSet) return null;
  const words = quizSet.items;
  const questions = quizSet.fill_blanks;

  // ── Learn Stage ──
  if (stage === 'learn') return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full"
          style={{ backgroundColor: '#8B691415', color: accent }}>
          Step 1 of 3 — Learn
        </span>
      </div>
      <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Lora, Georgia, serif', color: 'var(--text-primary)' }}>
        Today's {label}
      </h1>
      <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
        Study these 5 {type === 'idiom' ? 'idioms' : 'words'} carefully before the quiz.
      </p>

      <div className="space-y-8">
        {words.map((item, idx) => (
          <div key={idx} className="rounded-2xl border p-6"
            style={{ backgroundColor: 'var(--bg-card,#fff)', borderColor: 'var(--border)' }}>
            {/* Word header */}
            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-lg font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'Lora, Georgia, serif' }}>
                {idx + 1}. {item.word}
              </span>
              <span className="text-sm italic" style={{ color: 'var(--text-secondary)' }}>
                ({item.partOfSpeech})
              </span>
            </div>

            <ul className="space-y-3">
              <li className="flex gap-2">
                <span className="text-sm font-semibold shrink-0" style={{ color: 'var(--text-primary)' }}>Definition:</span>
                <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{item.definition}</span>
              </li>
              <li className="flex gap-2">
                <span className="text-sm font-semibold shrink-0" style={{ color: 'var(--text-primary)' }}>Formal Example:</span>
                <span className="text-sm" style={{ color: 'var(--text-primary)' }}
                  dangerouslySetInnerHTML={{
                    __html: item.formalExample.replace(
                      new RegExp(item.word, 'gi'),
                      `<strong style="color:var(--text-primary)">$&</strong>`
                    )
                  }} />
              </li>
              <li className="flex gap-2">
                <span className="text-sm font-semibold shrink-0" style={{ color: 'var(--text-primary)' }}>Conversational Example:</span>
                <span className="text-sm" style={{ color: 'var(--text-primary)' }}
                  dangerouslySetInnerHTML={{
                    __html: item.conversationalExample.replace(
                      new RegExp(item.word, 'gi'),
                      `<strong style="color:var(--text-primary)">$&</strong>`
                    )
                  }} />
              </li>
              <li className="flex gap-2 flex-wrap">
                <span className="text-sm font-semibold shrink-0" style={{ color: 'var(--text-primary)' }}>Synonyms:</span>
                <div className="flex gap-2 flex-wrap">
                  {item.synonyms.map((s, si) => (
                    <span key={si} className="px-2.5 py-0.5 rounded-full text-xs font-medium"
                      style={{ backgroundColor: '#8B691415', color: accent }}>
                      {s}
                    </span>
                  ))}
                </div>
              </li>
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-10 flex justify-end">
        <button onClick={handleDoneLearn}
          className="flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: accent }}>
          Done — Take the Quiz
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  // ── Test Stage ──
  if (stage === 'test') return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full"
          style={{ backgroundColor: '#8B691415', color: accent }}>
          Step 2 of 3 — Quiz
        </span>
      </div>
      <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Lora, Georgia, serif', color: 'var(--text-primary)' }}>
        Fill in the Blanks
      </h1>
      <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
        Use each word from the word bank exactly once. Grammar adjustments (e.g. -ed, -ing) are accepted.
      </p>

      {/* Word bank */}
      <div className="rounded-xl p-4 mb-8 flex flex-wrap gap-2 items-center"
        style={{ backgroundColor: 'var(--bg-card,#fff)', border: '1px solid var(--border)' }}>
        <span className="text-xs font-semibold uppercase tracking-wider mr-1" style={{ color: 'var(--text-secondary)' }}>
          Word Bank:
        </span>
        {words.map((w, i) => (
          <span key={i} className="px-3 py-1 rounded-lg text-sm font-mono font-medium"
            style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
            {w.word}
          </span>
        ))}
      </div>

      {/* Questions */}
      <div className="space-y-5">
        {questions.map((q, idx) => {
          const parts = q.sentence.split('__________');
          return (
            <div key={idx} className="rounded-xl border p-5"
              style={{ backgroundColor: 'var(--bg-card,#fff)', borderColor: 'var(--border)' }}>
              <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--text-secondary)' }}>
                {idx + 1}.
              </p>
              <p className="text-sm leading-loose" style={{ color: 'var(--text-primary)' }}>
                {parts[0]}
                <input
                  type="text"
                  value={answers[idx]}
                  onChange={e => {
                    const newAnswers = [...answers];
                    newAnswers[idx] = e.target.value;
                    setAnswers(newAnswers);
                  }}
                  placeholder="___________"
                  className="inline-block mx-1 px-2 py-0.5 rounded border-b-2 outline-none text-sm font-medium w-36 text-center"
                  style={{
                    backgroundColor: '#8B691408',
                    color: 'var(--text-primary)',
                    border: 'none',
                    borderBottom: `2px solid ${accent}`,
                  }}
                />
                {parts[1]}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-10 flex justify-end">
        <button
          onClick={handleSubmitAnswers}
          disabled={submitting || answers.some(a => !a.trim())}
          className="flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: accent }}>
          {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Checking…</> : <>Submit Answers <ChevronRight className="w-4 h-4" /></>}
        </button>
      </div>
    </div>
  );

  // ── Results Stage ──
  if (stage === 'results' && results) return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full"
          style={{ backgroundColor: '#8B691415', color: accent }}>
          Results
        </span>
      </div>

      {/* Score */}
      <div className="rounded-2xl p-6 mb-8 text-center"
        style={{ backgroundColor: 'var(--bg-card,#fff)', border: '1px solid var(--border)' }}>
        <div className="text-5xl font-bold mb-2" style={{ color: accent, fontFamily: 'Lora, Georgia, serif' }}>
          {results.totalScore}/5
        </div>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{results.overallFeedback}</p>
      </div>

      {/* Per-question feedback */}
      <div className="space-y-4 mb-8">
        {results.results?.map((r: any, idx: number) => (
          <div key={idx} className="rounded-xl border p-4 flex gap-3"
            style={{ backgroundColor: 'var(--bg-card,#fff)', borderColor: 'var(--border)' }}>
            <div className="mt-0.5 shrink-0">
              {r.correct
                ? <CheckCircle2 className="w-5 h-5 text-green-500" />
                : <XCircle className="w-5 h-5 text-red-400" />}
            </div>
            <div>
              <p className="text-sm font-medium mb-0.5" style={{ color: 'var(--text-primary)' }}>
                Q{idx + 1}: {r.correct ? 'Correct' : `Expected "${questions[idx]?.answer}" — you wrote "${r.userAnswer}"`}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{r.feedback}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row justify-end items-end sm:items-center gap-3">
        <input 
          type="text" 
          placeholder="Topic (e.g. Fantasy, Tech)" 
          value={customTheme}
          onChange={(e) => setCustomTheme(e.target.value.substring(0, 50))}
          className="w-full sm:w-64 px-4 py-3 rounded-xl text-sm border focus:outline-none"
          style={{ 
            backgroundColor: 'var(--bg-card,#fff)', 
            borderColor: 'var(--border)', 
            color: 'var(--text-primary)' 
          }}
          disabled={isGeneratingPassage}
        />
        <button onClick={handleNextToRead}
          disabled={isGeneratingPassage}
          className="flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: accent, whiteSpace: 'nowrap' }}>
          {isGeneratingPassage ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Writing…</>
          ) : (
            <>Next — Read the Passage <ChevronRight className="w-4 h-4" /></>
          )}
        </button>
      </div>
    </div>
  );

  // ── Read Stage ──
  if (stage === 'read') return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full"
          style={{ backgroundColor: '#8B691415', color: accent }}>
          Step 3 of 3 — Read
        </span>
      </div>
      <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Lora, Georgia, serif', color: 'var(--text-primary)' }}>
        Words in Context
      </h1>
      <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
        Read this passage — it uses all 5 {type === 'idiom' ? 'idioms' : 'words'} you just learned. Highlighted words are your vocabulary.
      </p>

      <div className="rounded-2xl border p-8 mb-8"
        style={{ backgroundColor: 'var(--bg-card,#fff)', borderColor: 'var(--border)' }}>
        {renderPassage(results?.customPassage || quizSet.passage)}
      </div>

      <div className="flex justify-end">
        <button onClick={handleFinish}
          className="flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: accent }}>
          Finish Set ✦
        </button>
      </div>
    </div>
  );

  return null;
}
