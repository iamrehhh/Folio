'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Send, Loader2, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
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
  const { aiMessages, addAIMessage, updateLastAIMessage, selectedText } = useReaderStore();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (input === '' && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [input]);

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
  const bg = theme === 'dark' ? '#242424' : theme === 'dark-sepia' ? '#433B30' : theme === 'sepia' ? '#EEE4C4' : '#F2EFE9';
  const border = theme === 'dark' ? '#333' : theme === 'dark-sepia' ? '#5C5243' : theme === 'sepia' ? '#DDD0A8' : '#E5E0D8';
  const textPrimary = theme === 'dark' ? '#E8E6E0' : theme === 'dark-sepia' ? '#FAECDC' : '#1C1C1E';
  const textSecondary = theme === 'dark' ? '#A0998C' : theme === 'dark-sepia' ? '#CEC3B6' : '#6B6860';
  const inputBg = theme === 'dark' ? '#1A1A1A' : theme === 'dark-sepia' ? '#362E25' : '#fff';

  async function sendMessage(content: string) {
    if (!content.trim() || isLoading) return;
    setInput('');

    const userMsg: AIMessage = { role: 'user', content };
    addAIMessage(userMsg);
    setIsLoading(true);
    setIsStreaming(true);

    // Add an empty assistant message that we'll stream into
    addAIMessage({ role: 'assistant', content: '' });

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...aiMessages, userMsg],
          chapterText,
          bookTitle,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(data.error || 'Request failed');
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        // Parse SSE events — may contain multiple `data: ...` lines
        const lines = chunk.split('\n');

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;

          const payload = trimmed.slice(6); // remove "data: "
          if (payload === '[DONE]') continue;

          try {
            const parsed = JSON.parse(payload);
            if (parsed.error) throw new Error(parsed.error);
            if (parsed.text) {
              accumulated += parsed.text;
              updateLastAIMessage(accumulated);
            }
          } catch {
            // Skip malformed chunks
          }
        }
      }

      // Final update to ensure complete message is set
      if (accumulated) {
        updateLastAIMessage(accumulated);
      } else {
        updateLastAIMessage('No response generated.');
      }

    } catch (err: any) {
      if (err?.name === 'AbortError') {
        // User cancelled — leave partial content
      } else {
        updateLastAIMessage('Sorry, I couldn\'t process that request. Please try again.');
      }
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      abortRef.current = null;
    }
  }

  return (
    <aside
      className="w-80 h-full flex-none border-l flex flex-col animate-slide-in-right"
      style={{ backgroundColor: bg, borderColor: border }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0" style={{ borderColor: border }}>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4" style={{ color: '#8B6914' }} />
          <span className="text-sm font-medium" style={{ color: textPrimary }}>AI Assistant</span>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-black/10 transition-colors">
          <X className="w-4 h-4" style={{ color: textSecondary }} />
        </button>
      </div>

      {/* Chapter context */}
      <div className="px-4 py-2 border-b shrink-0" style={{ borderColor: border }}>
        <p className="text-xs" style={{ color: textSecondary }}>
          Context: <span style={{ color: textPrimary }}>{chapterTitle || bookTitle}</span>
        </p>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="min-h-full flex flex-col">
          {aiMessages.length === 0 ? (
            /* Prompts pushed to bottom via mt-auto */
            <div className="mt-auto space-y-2">
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
            <div className="space-y-4">
              {aiMessages.map((msg, i) => {
                const isLastAssistant = msg.role === 'assistant' && i === aiMessages.length - 1;
                const isCurrentlyStreaming = isLastAssistant && isStreaming;
                const isEmpty = msg.role === 'assistant' && !msg.content;

                return (
                  <div
                    key={i}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    style={msg.role === 'assistant' ? { animation: i === aiMessages.length - 1 && !isStreaming ? undefined : undefined } : undefined}
                  >
                    <div
                      className="max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed"
                      style={
                        msg.role === 'user'
                          ? { backgroundColor: '#8B6914', color: '#fff', borderRadius: '12px 12px 2px 12px' }
                          : { backgroundColor: inputBg, color: textPrimary, border: `1px solid ${border}`, borderRadius: '12px 12px 12px 2px' }
                      }
                    >
                      {msg.role === 'assistant' ? (
                        isEmpty && isLoading ? (
                          /* Show thinking indicator while waiting for first token */
                          <div className="flex items-center gap-2 py-0.5">
                            <div className="ai-thinking-dots flex gap-1">
                              <span className="ai-dot" style={{ backgroundColor: '#8B6914' }} />
                              <span className="ai-dot" style={{ backgroundColor: '#8B6914', animationDelay: '0.15s' }} />
                              <span className="ai-dot" style={{ backgroundColor: '#8B6914', animationDelay: '0.3s' }} />
                            </div>
                            <span className="text-xs" style={{ color: textSecondary }}>Thinking…</span>
                          </div>
                        ) : (
                          <div className={`ai-prose ${isCurrentlyStreaming ? 'ai-streaming' : ''}`}>
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                            {isCurrentlyStreaming && (
                              <span className="ai-cursor" style={{ borderColor: '#8B6914' }} />
                            )}
                          </div>
                        )
                      ) : (
                        msg.content
                      )}
                    </div>
                  </div>
                );
              })}

              <div ref={bottomRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="p-3 border-t shrink-0" style={{ borderColor: border }}>
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage(input);
              }
            }}
            placeholder="Ask about this chapter…"
            rows={1}
            className="flex-1 px-3 py-2 text-sm rounded-lg border outline-none resize-none appearance-none"
            style={{
              backgroundColor: inputBg,
              borderColor: border,
              color: textPrimary,
              minHeight: '38px',
              maxHeight: '120px'
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
