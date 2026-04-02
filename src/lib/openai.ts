import OpenAI from 'openai';

let openaiClient: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  }
  return openaiClient;
}

export const AI_MODEL = 'gpt-4o-mini';

// ─── Prompt templates ───────────────────────────────────────────

export function buildContextualDefinitionPrompt(word: string, paragraph: string): string {
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

export function buildChapterQuizPrompt(chapterTitle: string, chapterText: string): string {
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
  const avoidList = usedWords.length > 0
    ? `\nDo NOT use any of these recently used words: ${usedWords.join(', ')}`
    : '';
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
  const avoidList = usedIdioms.length > 0
    ? `\nDo NOT use any of these recently used idioms: ${usedIdioms.join(', ')}`
    : '';
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
  // Shuffle the word order before sending to AI so questions aren't in word order
  const shuffled = [...words].sort(() => Math.random() - 0.5);
  const wordList = shuffled.join(', ');

  return `You are an English language exam question creator for IPMAT/JIPMAT level students.

Create exactly 5 fill-in-the-blank sentences using these ${type === 'idiom' ? 'idioms' : 'words'}: ${wordList}

CRITICAL: The questions must NOT follow the same order as the word list above. Scramble the order freely.

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
- acceptedForms should include all grammatically valid forms of the answer
- Questions must appear in a RANDOM order — do not match the input word order`;
}

// Interesting genres with vivid descriptions to guide AI writing quality
const PASSAGE_GENRES = [
  { genre: 'scientific discovery', setting: 'a research lab or field expedition making a breakthrough' },
  { genre: 'fantasy adventure', setting: 'a vivid magical world with compelling characters' },
  { genre: 'political thriller', setting: 'a tense diplomatic crisis or election scandal' },
  { genre: 'historical fiction', setting: 'a pivotal moment in history seen through a character\'s eyes' },
  { genre: 'romance', setting: 'two characters navigating a complex emotional relationship' },
  { genre: 'philosophical reflection', setting: 'a thinker grappling with a profound life question' },
  { genre: 'business drama', setting: 'a high-stakes corporate negotiation or startup journey' },
  { genre: 'mystery', setting: 'a detective or sleuth uncovering a surprising secret' },
  { genre: 'sports narrative', setting: 'an athlete facing a defining moment of pressure or triumph' },
  { genre: 'social satire', setting: 'modern society\'s quirks and contradictions observed sharply' },
  { genre: 'travel writing', setting: 'a vivid encounter with an unfamiliar culture or landscape' },
  { genre: 'coming-of-age', setting: 'a young person facing a formative challenge or realisation' },
];

export function buildPassagePrompt(words: string[], type: 'vocabulary' | 'idiom'): string {
  const wordList = words.join(', ');
  // Pick a random genre each time
  const pick = PASSAGE_GENRES[Math.floor(Math.random() * PASSAGE_GENRES.length)];

  return `You are an accomplished writer and English language educator creating a reading passage for IPMAT/JIPMAT students.

Write a vivid, engaging 200-word passage in the genre of **${pick.genre}**.
Setting/tone: ${pick.setting}.

The passage must naturally incorporate ALL of the following ${type === 'idiom' ? 'idioms' : 'words'}: ${wordList}

Requirements:
- Exactly 200 words (±15 words)
- The passage must feel like genuine, high-quality prose — not a textbook exercise
- Each word/idiom must arise organically from the narrative, NOT feel shoehorned in
- Make the passage interesting and enjoyable to read — vivid imagery, strong voice, narrative tension
- Bold each target word/idiom using **word** markdown when it appears
- The passage should standalone as a satisfying mini-story or reflection

QUALITY BAR: The passage should be something a reader genuinely enjoys, not just tolerates. Strong verbs, precise details, emotional resonance.

Return ONLY the passage text with markdown bolding. No titles, no labels, no extra text.`;
}

export function buildAnswerCheckPrompt(
  questions: Array<{ sentence: string; answer: string; acceptedForms: string[]; targetWord: string }>,
  userAnswers: string[],
  words: string[]
): string {
  const qa = questions.map((q, i) =>
    `Q${i + 1}: "${q.sentence}"\nCorrect: "${q.answer}" (accepted forms: ${q.acceptedForms.join(', ')})\nUser answered: "${userAnswers[i] ?? ''}"`
  ).join('\n\n');

  return `You are an English language examiner checking fill-in-the-blank answers for IPMAT/JIPMAT students.

Word bank: ${words.join(', ')}

${qa}

For each question evaluate:
1. Is the answer correct? (accept exact match OR any valid grammatical form like -ed, -ing, -s)
2. Give brief, encouraging feedback (1 sentence max)

Return ONLY valid JSON:
{
  "results": [
    {
      "questionIndex": 0,
      "correct": true,
      "userAnswer": "inexorable",
      "feedback": "Perfect! 'Inexorable' perfectly captures the unstoppable nature of the storm."
    }
  ],
  "totalScore": 4,
  "overallFeedback": "Excellent work! You clearly understood the nuances of most words."
}`;
}
