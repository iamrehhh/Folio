'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Send, Loader2, Sparkles } from 'lucide-react';
import { useReaderStore } from '@/lib/store';
import type { AIMessage } from '@/types';

interface Props {
  bookTitle: string;
  chapterText: string;
  chapterTitle: string;
  onClose: () => void;
}

const QUICK_PROMPTS = [
  'Summarise this chapter',
  'Explain the themes here',
  'Who are the characters?',
  'What just happened?',
];

export default function AIPanel({ bookTitle, chapterText, chapterTitle, onClose }: Props) {
  const { aiMessages, addAIMessage, selectedText } = useReaderStore();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Pre-fill with selected text if any
  useEffect(() => {
    if (selectedText) {
      setInput(`Explain this passage: "${selectedText.slice(0, 200)}"`);
    }
  }, [selectedText]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages]);

  const theme = useReaderStore((s) => s.theme);
  const bg = theme === 'dark' ? '#242424' : theme === 'sepia' ? '#EEE4C4' : '#F2EFE9';
  const border = theme === 'dark' ? '#333' : theme === 'sepia' ? '#DDD0A8' : '#E5E0D8';
  const textPrimary = theme === 'dark' ? '#E8E6E0' : '#1C1C1E';
  const textSecondary = theme === 'dark' ? '#A0998C' : '#6B6860';
  const inputBg = theme === 'dark' ? '#1A1A1A' : '#fff';

  async function sendMessage(content: string) {
    if (!content.trim() || isLoading) return;
    setInput('');

    const userMsg: AIMessage = { role: 'user', content };
    addAIMessage(userMsg);
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...aiMessages, userMsg],
          chapterText,
          bookTitle,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      addAIMessage({ role: 'assistant', content: data.reply });
    } catch {
      addAIMessage({ role: 'assistant', content: 'Sorry, I couldn\'t process that request. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <aside
      className="w-80 flex-none border-l flex flex-col animate-slide-in-right"
      style={{ backgroundColor: bg, borderColor: border }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: border }}>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4" style={{ color: '#8B6914' }} />
          <span className="text-sm font-medium" style={{ color: textPrimary }}>AI Assistant</span>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-black/10 transition-colors">
          <X className="w-4 h-4" style={{ color: textSecondary }} />
        </button>
      </div>

      {/* Chapter context */}
      <div className="px-4 py-2 border-b" style={{ borderColor: border }}>
        <p className="text-xs" style={{ color: textSecondary }}>
          Context: <span style={{ color: textPrimary }}>{chapterTitle || bookTitle}</span>
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {aiMessages.length === 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-medium" style={{ color: textSecondary }}>Suggested prompts</p>
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => sendMessage(prompt)}
                className="w-full text-left px-3 py-2 rounded-lg text-sm border transition-colors hover:bg-black/5"
                style={{ borderColor: border, color: textPrimary }}
              >
                {prompt}
              </button>
            ))}
          </div>
        ) : (
          aiMessages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className="max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed"
                style={
                  msg.role === 'user'
                    ? { backgroundColor: '#8B6914', color: '#fff', borderRadius: '12px 12px 2px 12px' }
                    : { backgroundColor: inputBg, color: textPrimary, border: `1px solid ${border}`, borderRadius: '12px 12px 12px 2px' }
                }
              >
                {msg.content}
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex justify-start">
            <div
              className="px-3 py-2.5 rounded-xl border"
              style={{ backgroundColor: inputBg, borderColor: border }}
            >
              <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#8B6914' }} />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t" style={{ borderColor: border }}>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
            placeholder="Ask about this chapter…"
            className="flex-1 px-3 py-2 text-sm rounded-lg border outline-none"
            style={{
              backgroundColor: inputBg,
              borderColor: border,
              color: textPrimary,
            }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            className="p-2 rounded-lg text-white disabled:opacity-40 transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#8B6914' }}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
