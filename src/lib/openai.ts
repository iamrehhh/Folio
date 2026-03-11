import OpenAI from 'openai';

// Singleton — reused across API route calls in the same serverless instance
let openaiClient: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    });
  }
  return openaiClient;
}

export const AI_MODEL = 'gpt-4o-mini';

// ─── Prompt templates ───────────────────────────────────────────

export function buildContextualDefinitionPrompt(
  word: string,
  paragraph: string
): string {
  return `You are an expert reading assistant.

The reader tapped on the word "${word}" in the following passage:
---
${paragraph}
---

Explain what "${word}" means specifically in relation to how it is used in this passage. Be conversational and explain its contextual meaning as if you are a helpful tutor.
CRITICAL RULES:
- Keep your explanation to 2–3 concise sentences.
- DO NOT start with phrases like "In this context...", "The word refers to...", or "\"${word}\" means...". Just start the explanation directly.`;
}

export function buildChapterQuizPrompt(
  chapterTitle: string,
  chapterText: string
): string {
  return `You are a reading comprehension quiz generator.

Generate exactly 10 multiple-choice questions based on the following chapter.

Chapter: "${chapterTitle}"
Text:
${chapterText.slice(0, 12000)} ${chapterText.length > 12000 ? '... [truncated]' : ''}

Return ONLY a valid JSON array with exactly this structure (no markdown, no explanation):
[
  {
    "question": "...",
    "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
    "correctIndex": 0
  }
]

Rules:
- Each question must have exactly 4 options
- correctIndex is 0-based (0=A, 1=B, 2=C, 3=D)
- Questions should test comprehension, themes, and details
- Make distractors plausible but clearly wrong`;
}

export function buildAIAssistantSystemPrompt(chapterText: string, bookTitle: string): string {
  return `You are an intelligent reading assistant embedded in an e-reader for the book "${bookTitle}".

The reader is currently reading this chapter:
---
${chapterText.slice(0, 10000)}${chapterText.length > 10000 ? '\n... [chapter continues]' : ''}
---

Help the reader understand, analyse, and engage with the text. Be thoughtful, concise, and conversational. When discussing themes or characters, always ground your response in the actual text above.`;
}
