'use client';

import { useState, useEffect } from 'react';
import { X, CheckCircle2, XCircle, Loader2, RotateCcw, ArrowRight, Trophy } from 'lucide-react';
import type { QuizQuestion, QuizAnswer } from '@/types';
import toast from 'react-hot-toast';

interface Props {
  bookId: string;
  chapterIndex: number;
  chapterTitle: string;
  chapterText: string;
  userId: string;
  onClose: () => void;
}

type Phase = 'loading' | 'question' | 'summary';

export default function ChapterQuiz({
  bookId, chapterIndex, chapterTitle, chapterText, userId, onClose
}: Props) {
  const [phase, setPhase] = useState<Phase>('loading');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    generateQuiz();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function generateQuiz() {
    setPhase('loading');
    setError(null);
    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapterText, chapterTitle }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setQuestions(data.questions);
      setCurrentQ(0);
      setAnswers([]);
      setSelectedIndex(null);
      setPhase('question');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to generate quiz');
      setPhase('question'); // Exit loading phase so error UI shows instead of spinner
    }
  }

  function handleSelect(idx: number) {
    if (selectedIndex !== null) return; // already answered
    setSelectedIndex(idx);
  }

  function handleNext() {
    if (selectedIndex === null) return;
    const q = questions[currentQ];
    const newAnswers = [
      ...answers,
      {
        question: q.question,
        options: q.options,
        selected_index: selectedIndex,
        correct_index: q.correctIndex,
      },
    ];
    setAnswers(newAnswers);

    if (currentQ + 1 < questions.length) {
      setCurrentQ((c) => c + 1);
      setSelectedIndex(null);
    } else {
      setPhase('summary');
      saveResult(newAnswers);
    }
  }

  async function saveResult(finalAnswers: QuizAnswer[]) {
    const score = finalAnswers.filter((a) => a.selected_index === a.correct_index).length;
    try {
      await fetch('/api/quiz/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId,
          chapterIndex,
          chapterTitle,
          score,
          totalQuestions: finalAnswers.length,
          answers: finalAnswers,
        }),
      });
    } catch { /* ignore */ }
  }

  const score = answers.filter((a) => a.selected_index === a.correct_index).length;
  const q = questions[currentQ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative z-10 w-full max-w-xl rounded-2xl border shadow-popover overflow-hidden"
        style={{ backgroundColor: 'var(--bg-card, #fff)', borderColor: 'var(--border)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4" style={{ color: '#8B6914' }} />
            <span className="font-semibold" style={{ color: 'var(--text-primary)', fontFamily: 'Lora, Georgia, serif' }}>
              Chapter Quiz
            </span>
            {chapterTitle && (
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                · {chapterTitle}
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-[var(--border)] transition-colors">
            <X className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          {/* Loading */}
          {phase === 'loading' && (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" style={{ color: '#8B6914' }} />
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Generating quiz questions…
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="text-center py-8">
              <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>{error}</p>
              <button
                onClick={generateQuiz}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                style={{ backgroundColor: '#8B6914' }}
              >
                Try Again
              </button>
            </div>
          )}

          {/* Question */}
          {phase === 'question' && q && (
            <div className="animate-fade-in">
              {/* Progress */}
              <div className="flex items-center justify-between mb-6">
                <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Question {currentQ + 1} of {questions.length}
                </span>
                <div className="w-32 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border)' }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${((currentQ) / questions.length) * 100}%`, backgroundColor: '#8B6914' }}
                  />
                </div>
              </div>

              {/* Question text */}
              <p
                className="text-base font-medium mb-6 leading-relaxed"
                style={{ fontFamily: 'Lora, Georgia, serif', color: 'var(--text-primary)' }}
              >
                {q.question}
              </p>

              {/* Options */}
              <div className="space-y-3">
                {q.options.map((option, idx) => {
                  const isSelected = selectedIndex === idx;
                  const isCorrect = q.correctIndex === idx;
                  const showResult = selectedIndex !== null;

                  let borderColor = 'var(--border)';
                  let bgColor = 'transparent';
                  let textColor = 'var(--text-primary)';

                  if (showResult) {
                    if (isCorrect) { borderColor = '#4CAF50'; bgColor = '#4CAF5015'; }
                    else if (isSelected && !isCorrect) { borderColor = '#EF4444'; bgColor = '#EF444415'; }
                  } else if (isSelected) {
                    borderColor = '#8B6914';
                    bgColor = '#8B691415';
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelect(idx)}
                      disabled={selectedIndex !== null}
                      className="w-full text-left px-4 py-3 rounded-xl border text-sm leading-relaxed transition-all"
                      style={{ borderColor, backgroundColor: bgColor, color: textColor }}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="flex-none w-6 h-6 rounded-full border flex items-center justify-center text-xs font-medium"
                          style={{ borderColor }}
                        >
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="flex-1">{option}</span>
                        {showResult && isCorrect && <CheckCircle2 className="w-4 h-4 flex-none" style={{ color: '#4CAF50' }} />}
                        {showResult && isSelected && !isCorrect && <XCircle className="w-4 h-4 flex-none" style={{ color: '#EF4444' }} />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Next button */}
              {selectedIndex !== null && (
                <div className="mt-6 flex justify-end animate-fade-in">
                  <button
                    onClick={handleNext}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90"
                    style={{ backgroundColor: '#8B6914' }}
                  >
                    {currentQ + 1 < questions.length ? (
                      <>Next <ArrowRight className="w-4 h-4" /></>
                    ) : (
                      <>See Results <Trophy className="w-4 h-4" /></>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Summary */}
          {phase === 'summary' && (
            <div className="text-center animate-fade-in">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: score >= 7 ? '#4CAF5015' : '#8B691415' }}
              >
                <span className="text-3xl font-bold" style={{ color: score >= 7 ? '#4CAF50' : '#8B6914' }}>
                  {score}/{answers.length}
                </span>
              </div>
              <p
                className="text-xl font-semibold mb-1"
                style={{ fontFamily: 'Lora, Georgia, serif', color: 'var(--text-primary)' }}
              >
                {score >= 8 ? 'Excellent!' : score >= 6 ? 'Good work!' : 'Keep reading!'}
              </p>
              <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                You got {score} out of {answers.length} questions correct.
              </p>

              {/* Answer review */}
              <div className="text-left space-y-3 max-h-60 overflow-y-auto mb-6">
                {answers.map((a, i) => {
                  const correct = a.selected_index === a.correct_index;
                  return (
                    <div
                      key={i}
                      className="px-3 py-2 rounded-lg border"
                      style={{
                        borderColor: correct ? '#4CAF5030' : '#EF444430',
                        backgroundColor: correct ? '#4CAF5008' : '#EF44440A',
                      }}
                    >
                      <div className="flex items-start gap-2">
                        {correct
                          ? <CheckCircle2 className="w-4 h-4 flex-none mt-0.5" style={{ color: '#4CAF50' }} />
                          : <XCircle className="w-4 h-4 flex-none mt-0.5" style={{ color: '#EF4444' }} />
                        }
                        <div>
                          <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                            {a.question}
                          </p>
                          {!correct && (
                            <p className="text-xs mt-0.5" style={{ color: '#4CAF50' }}>
                              ✓ {a.options[a.correct_index]}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-3 justify-center">
                <button
                  onClick={generateQuiz}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors hover:bg-[var(--bg)]"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                >
                  <RotateCcw className="w-4 h-4" />
                  Retake Quiz
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: '#8B6914' }}
                >
                  Continue Reading
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
