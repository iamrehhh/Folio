'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2, Quote, Link as LinkIcon, Check, X, ArrowLeft } from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import GamePracticeScreen from '@/components/quiz/GamePracticeScreen';
import Link from 'next/link';

interface Question {
  term: string;
  options: string[];
  correctIndex: number;
  definition: string;
  example: string;
  synonyms: string[];
}

export default function GameModePage({ params }: { params: { mode: string } }) {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  
  const [missedWords, setMissedWords] = useState<any[]>([]);
  const [wordsSeen, setWordsSeen] = useState<any[]>([]);
  const [score, setScore] = useState(0);

  const [gameState, setGameState] = useState<'loading' | 'playing' | 'practice'>('loading');

  useEffect(() => {
    fetchQuestions();
  }, [params.mode]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/gamify/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: params.mode })
      });
      if (!res.ok) throw new Error('Failed to generate set');
      const data = await res.json();
      setQuestions(data.questions);
      setGameState('playing');
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (idx: number) => {
    if (selectedOption !== null) return; // Prevent double click
    setSelectedOption(idx);
    
    const currQ = questions[currentIndex];
    const isCorrect = idx === currQ.correctIndex;
    
    setWordsSeen(prev => [...prev, { word: currQ.term, correct: isCorrect }]);
    
    if (isCorrect) {
      setScore(s => s + 10);
    } else {
      setMissedWords(prev => [...prev, currQ]);
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(curr => curr + 1);
      setSelectedOption(null);
    } else {
      // Game over, calculate bonus points
      const hasPerfectScore = missedWords.length === 0;
      const finalScore = score + (hasPerfectScore ? 20 : 0);
      setScore(finalScore);
      setGameState('practice');
    }
  };

  const handleFinish = async () => {
    // Add bonus for completing practice
    const finalScoreWithPractice = missedWords.length > 0 ? score + 15 : score;
    
    try {
      await fetch('/api/gamify/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pointsEarned: finalScoreWithPractice,
          mode: params.mode,
          wordsSeen
        })
      });
    } catch(err) {
      console.error('Failed to save score', err);
    }
    router.push('/quiz');
  };

  if (loading || gameState === 'loading') {
    return (
      <AppShell user={null}>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
           <Loader2 className="w-12 h-12 animate-spin mb-4" style={{ color: '#8B6914' }} />
           <p className="font-serif text-xl" style={{ color: 'var(--text-primary)' }}>Generating your adaptive set...</p>
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell user={null}>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
           <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
           <p className="mb-6 opacity-70">We couldn't generate the questions. Please try again later.</p>
           <button onClick={() => router.push('/quiz')} className="px-6 py-2 bg-gray-200 rounded-lg text-black font-semibold">Go Back</button>
        </div>
      </AppShell>
    );
  }

  if (gameState === 'practice') {
    return (
      <AppShell user={null}>
        <div className="py-12 px-4 max-w-4xl mx-auto">
          <GamePracticeScreen 
             missedWords={missedWords} 
             mode={params.mode} 
             score={score} 
             onComplete={handleFinish} 
          />
        </div>
      </AppShell>
    );
  }

  const q = questions[currentIndex];
  // Convert "Option A" to A, B, C, D visually
  const labels = ['A', 'B', 'C', 'D'];

  return (
    <AppShell user={null}>
      <div className="max-w-3xl mx-auto px-4 py-8">
        
        {/* Progress Bar */}
        <div className="flex items-center gap-4 mb-10 w-full max-w-2xl mx-auto">
          <div className="flex-1 h-3 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden relative">
            <motion.div 
               className="absolute top-0 left-0 h-full bg-[#8B6914]"
               initial={{ width: 0 }}
               animate={{ width: `${(currentIndex / questions.length) * 100}%` }}
               transition={{ duration: 0.5 }}
            />
          </div>
          <span className="font-mono font-bold text-sm opacity-60">
            {currentIndex + 1} / {questions.length}
          </span>
        </div>

        {/* Question Area */}
        <div className="bg-[var(--bg-card,#fff)] border border-[var(--border)] rounded-[2rem] p-8 md:p-12 shadow-sm max-w-2xl mx-auto mb-8">
           <h1 className="text-4xl md:text-5xl font-bold font-serif text-center mb-10 italic" style={{ color: 'var(--text-primary)' }}>
             "{q.term}"
           </h1>

           <div className="flex flex-col gap-4">
             {q.options.map((opt, idx) => {
                const isSelected = selectedOption === idx;
                const isCorrect = idx === q.correctIndex;
                const showResult = selectedOption !== null;

                let bgClass = "bg-[var(--bg-primary)] hover:border-gray-400";
                let textClass = "var(--text-primary)";
                let icon = null;

                if (showResult) {
                  if (isSelected && isCorrect) {
                     bgClass = "bg-green-100 border-green-500 ring-2 ring-green-500/20";
                     textClass = "#166534";
                     icon = <Check className="w-5 h-5 text-green-600" />;
                  } else if (isSelected && !isCorrect) {
                     bgClass = "bg-red-50 border-red-300";
                     textClass = "#991B1B";
                     icon = <X className="w-5 h-5 text-red-600" />;
                  } else if (!isSelected && isCorrect) {
                     bgClass = "bg-green-50 border-green-500 border-dashed opacity-80";
                     textClass = "#166534";
                     icon = <Check className="w-5 h-5 text-green-600 opacity-60" />;
                  } else {
                     bgClass = "bg-gray-50 border-gray-200 opacity-40";
                  }
                }

                return (
                  <button 
                    key={idx}
                    onClick={() => handleSelectOption(idx)}
                    disabled={showResult}
                    className={`relative w-full flex items-center p-5 rounded-2xl border-2 transition-all text-left ${bgClass} ${showResult ? 'cursor-default' : 'cursor-pointer hover:shadow-md hover:-translate-y-0.5'}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mr-4 bg-white/80 border ${showResult && isCorrect ? 'border-green-500 text-green-700' : 'border-gray-200 text-gray-500'}`}>
                      {labels[idx]}
                    </div>
                    <span className="flex-1 font-medium text-lg leading-tight" style={{ color: textClass }}>{opt}</span>
                    {icon && <div className="ml-3">{icon}</div>}
                  </button>
                )
             })}
           </div>
        </div>

        {/* Feedback Card (Revealed after selection) */}
        {selectedOption !== null && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto"
          >
            <div className="bg-[#8B6914]/5 border border-[#8B6914]/20 rounded-3xl p-8 mb-8 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 w-full h-full opacity-5 pointer-events-none flex justify-end">
                  <Quote size={120} />
               </div>

               <div className="relative z-10 mb-8">
                 <div className="flex items-center gap-2 mb-3 text-xs font-bold tracking-widest uppercase" style={{ color: '#8B6914' }}>
                   <Quote className="w-4 h-4" /> Example
                 </div>
                 <p className="text-xl md:text-2xl font-serif italic" style={{ color: 'var(--text-primary)' }}>
                   "{q.example}"
                 </p>
               </div>

               <div className="relative z-10">
                 <div className="flex items-center gap-2 mb-3 text-xs font-bold tracking-widest uppercase" style={{ color: '#8B6914' }}>
                   <LinkIcon className="w-4 h-4" /> Synonyms
                 </div>
                 <div className="flex flex-wrap gap-2">
                   {q.synonyms.map((s, i) => (
                     <div key={i} className="px-4 py-2 bg-white dark:bg-black rounded-lg border border-[#8B6914]/20 shadow-sm font-medium text-sm">
                       {s}
                     </div>
                   ))}
                 </div>
               </div>
            </div>

            <div className="flex justify-end">
              <button 
                onClick={handleNextQuestion}
                className="flex items-center px-8 py-4 rounded-2xl font-bold text-white shadow-lg transition-transform hover:scale-105 group"
                style={{ backgroundColor: '#8B6914' }}
              >
                 Next Question 
                 <ArrowLeft className="w-5 h-5 ml-3 rotate-180 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </motion.div>
        )}

      </div>
    </AppShell>
  );
}
