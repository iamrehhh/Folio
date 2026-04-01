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
  return `You are a brilliant, warm reading companion embedded in an e-reader for the book "${bookTitle}".

The reader is currently reading this chapter:
---
${chapterText.slice(0, 10000)}${chapterText.length > 10000 ? '\n... [chapter continues]' : ''}
---

Help the reader understand, analyse, and engage with the text. Ground your responses in the actual text above.

FORMATTING RULES (very important):
- Use **markdown** formatting in every response.
- Break your answer into short paragraphs (2-3 sentences each) separated by blank lines.
- Use **bold** for key names, terms, and themes.
- Use bullet points (- ) or numbered lists when listing items, themes, or characters.
- Use ### headings to organize longer answers into sections.
- Keep your tone warm, insightful, and conversational — like a thoughtful book-club friend, not a textbook.
- Be concise but thorough. Aim for clarity over length.`;
}

// ─── Quiz Prompt Templates ──────────────────────────────────────

export function buildVocabSetPrompt(usedWords: string[]): string {
  const avoidList = usedWords.length > 0 ? `\nDo NOT use any of these recently used words: ${usedWords.join(', ')}` : '';
  return `You are an expert English vocabulary teacher preparing students for IPMAT and JIPMAT entrance exams.

Generate exactly 5 advanced English vocabulary words appropriate for IPMAT/JIPMAT level.
${avoidList}

For each word provide:
1. The word and part of speech
2. A clear, precise definition
3. A formal example sentence (academic/professional context)
4. A conversational example sentence (everyday context)
5. 2-3 easy-to-remember synonyms

Return ONLY valid JSON, no markdown, no explanation:
{
  "words": [
    {
      "word": "Mellifluous",
      "partOfSpeech": "adj.",
      "definition": "(Of a voice or words) sweet or musical; pleasant to hear.",
      "formalExample": "The soprano's mellifluous tones captivated the audience, earning her a standing ovation at the opera house.",
      "conversationalExample": "I love listening to that audiobook simply because the narrator has such a mellifluous voice.",
      "synonyms": ["euphonious", "dulcet", "harmonious"]
    }
  ]
}`;
}

export function buildIdiomSetPrompt(usedIdioms: string[]): string {
  const avoidList = usedIdioms.length > 0 ? `\nDo NOT use any of these recently used idioms: ${usedIdioms.join(', ')}` : '';
  return `You are an expert English language teacher preparing students for IPMAT and JIPMAT entrance exams.

Generate exactly 5 English idioms appropriate for IPMAT/JIPMAT level.
${avoidList}

For each idiom provide:
1. The idiom itself
2. What it means (clear definition)
3. A formal example sentence
4. A conversational example sentence
5. 2-3 similar idioms or expressions

Return ONLY valid JSON, no markdown, no explanation:
{
  "words": [
    {
      "word": "Bite the bullet",
      "partOfSpeech": "idiom",
      "definition": "To endure a painful or difficult situation that is unavoidable.",
      "formalExample": "The management decided to bite the bullet and announce the budget cuts during the quarterly meeting.",
      "conversationalExample": "I hate going to the dentist, but I just had to bite the bullet and book an appointment.",
      "synonyms": ["face the music", "take the plunge", "grin and bear it"]
    }
  ]
}`;
}

export function buildFillBlanksPrompt(words: string[], type: 'vocabulary' | 'idiom'): string {
  const wordList = words.join(', ');
  return `You are an English language exam question creator for IPMAT/JIPMAT level students.

Create exactly 5 fill-in-the-blank sentences using these ${type === 'idiom' ? 'idioms' : 'words'}: ${wordList}

Each sentence must:
- Use exactly one word/idiom from the list
- Be challenging but fair
- Require the word to be grammatically correct (add -ed, -ing, -s, etc. if needed)
- Have enough context clues to identify the correct word

Return ONLY valid JSON:
{
  "questions": [
    {
      "sentence": "Despite the __________ progress of the storm toward the coast, many residents refused to evacuate.",
      "answer": "inexorable",
      "acceptedForms": ["inexorable"],
      "targetWord": "inexorable"
    }
  ]
}

Rules:
- Each word must be used exactly once
- The blank should be shown as __________
- acceptedForms should include all grammatically valid forms of the answer`;
}

export function buildPassagePrompt(words: string[], type: 'vocabulary' | 'idiom'): string {
  const wordList = words.join(', ');
  const genres = ['mystery', 'historical fiction', 'science and technology', 'business and economics', 'social commentary', 'adventure', 'philosophical reflection'];
  const genre = genres[Math.floor(Math.random() * genres.length)];
  
  return `You are a skilled writer creating an educational reading passage for IPMAT/JIPMAT students.

Write a compelling 200-word passage in the genre of "${genre}" that naturally incorporates ALL of the following ${type === 'idiom' ? 'idioms' : 'words'}: ${wordList}

Requirements:
- Exactly 200 words (±10 words)
- Genre: ${genre}
- Each word/idiom must be used naturally, not forced
- Bold each of the target words/idioms using **word** markdown
- The passage should be engaging, well-written, and feel like genuine prose
- Appropriate for competitive exam reading comprehension level

Return ONLY the passage text with markdown bolding, no other text.`;
}

export function buildAnswerCheckPrompt(
  questions: Array<{sentence: string; answer: string; acceptedForms: string[]; targetWord: string}>,
  userAnswers: string[],
  words: string[]
): string {
  const qa = questions.map((q, i) => 
    `Q${i+1}: "${q.sentence}"\nCorrect: "${q.answer}" (accepted: ${q.acceptedForms.join(', ')})\nUser answered: "${userAnswers[i] ?? ''}"`
  ).join('\n\n');

  return `You are an English language examiner checking fill-in-the-blank answers for IPMAT/JIPMAT students.

Word bank used: ${words.join(', ')}

${qa}

For each question, evaluate the user's answer and provide:
1. Whether it's correct (exact match or accepted grammatical form)
2. Brief, encouraging feedback (1 sentence)

Return ONLY valid JSON:
{
  "results": [
    {
      "questionIndex": 0,
      "correct": true,
      "userAnswer": "inexorable",
      "feedback": "Perfect! 'Inexorable' correctly describes the unstoppable nature of the storm."
    }
  ],
  "totalScore": 4,
  "overallFeedback": "Excellent work! You clearly understood the nuances of most words."
}`;
}
