'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, Sparkles, Send, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

interface MissedWord {
  term: string;
  definition: string;
}

export default function GamePracticeScreen({
  missedWords,
  mode,
  score,
  onComplete
}: {
  missedWords: MissedWord[];
  mode: string;
  score: number;
  onComplete: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sentence, setSentence] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const currentWord = missedWords[currentIndex];

  const handleSubmit = async () => {
    if (!sentence.trim()) return;
    setIsLoading(true);
    setFeedback(''); // prepare for stream

    try {
      const res = await fetch('/api/gamify/grade-sentence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sentence, term: currentWord.term })
      });

      if (!res.body) throw new Error('No readable stream');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value);
        setFeedback((prev) => (prev || '') + chunkValue);
      }
    } catch (err) {
      console.error(err);
      setFeedback('Failed to get feedback. Perhaps try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < missedWords.length - 1) {
      setCurrentIndex(curr => curr + 1);
      setSentence('');
      setFeedback(null);
    } else {
      onComplete(); // Done with practice
    }
  };

  if (!currentWord && missedWords.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-20 px-4">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-12 h-12 text-green-600" />
        </div>
        <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: 'Lora, Georgia, serif', color: 'var(--text-primary)' }}>Perfect Score!</h2>
        <p className="text-xl mb-8" style={{ color: 'var(--text-secondary)' }}>You mastered all 5 {mode === 'vocab' ? 'words' : 'idioms'} today. You earned {score} points!</p>
        <button
          onClick={onComplete}
          className="px-8 py-3 rounded-full font-bold text-white shadow-lg transition-transform hover:scale-105"
          style={{ backgroundImage: 'linear-gradient(to right, #8B6914, #6a4f0f)' }}
        >
           Save & Return
        </button>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto w-full">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-center mb-2" style={{ fontFamily: 'Lora, Georgia, serif', color: 'var(--text-primary)' }}>Let's Practice</h2>
        <p className="text-center text-base" style={{ color: 'var(--text-secondary)' }}>
          Write a sentence using the {mode === 'vocab' ? 'words' : 'idioms'} you missed to reinforce your memory.
        </p>
      </div>

      <div className="bg-[var(--bg-card,#fff)] border border-[var(--border)] rounded-3xl p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold italic font-serif" style={{ color: 'var(--text-primary)' }}>"{currentWord.term}"</h3>
          <span className="text-sm font-semibold opacity-60 uppercase">{currentIndex + 1} / {missedWords.length}</span>
        </div>
        <p className="text-sm italic mb-6 p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-secondary)' }}>
          {currentWord.definition}
        </p>

        <div className="mb-6">
          <textarea
            value={sentence}
            onChange={e => setSentence(e.target.value)}
            disabled={feedback !== null || isLoading}
            placeholder={`Draft your sentence here using "${currentWord.term}"...`}
            className="w-full min-h-[120px] p-4 rounded-2xl border-2 transition-colors focus:outline-none resize-none"
            style={{ 
              backgroundColor: 'var(--bg-primary)', 
              borderColor: feedback ? 'var(--border)' : '#8B691455',
              color: 'var(--text-primary)'
            }}
          />
        </div>

        {!feedback && !isLoading && (
          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={!sentence.trim()}
              className="flex items-center px-6 py-3 rounded-xl font-bold text-white transition-opacity disabled:opacity-50"
              style={{ backgroundColor: '#8B6914' }}
            >
               Get Feedback <Sparkles className="w-4 h-4 ml-2" />
            </button>
          </div>
        )}

        {(isLoading || feedback) && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="overflow-hidden">
             <div className="p-5 rounded-2xl border border-[var(--border)] bg-[#8B6914]/5 relative">
               <Sparkles className="absolute top-4 right-4 w-5 h-5 opacity-20" style={{ color: '#8B6914' }} />
               <h4 className="font-bold mb-2 flex items-center" style={{ color: '#8B6914' }}>AI Feedback</h4>
               <p className="leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                 {isLoading && !feedback ? 'Analyzing your sentence...' : feedback}
               </p>
             </div>
             
             {!isLoading && feedback && (
               <div className="mt-6 flex justify-end">
                  <button
                    onClick={handleNext}
                    className="flex items-center px-6 py-3 rounded-xl font-bold text-white transition-transform hover:scale-105"
                    style={{ backgroundColor: '#8B6914' }}
                  >
                     {currentIndex < missedWords.length - 1 ? 'Next Word' : 'Finish Practice'} <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                  </button>
               </div>
             )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
