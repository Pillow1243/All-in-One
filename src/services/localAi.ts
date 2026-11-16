// Real On-Device NLP, Persian Virastar, TF-IDF Summarizer, BM25 Q&A, Sentiment, Entities & Plagiarism Engine

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

export function convertNumerals(text: string, target: 'fa' | 'ar' | 'en'): string {
  const toEn = text
    .replace(/[۰-۹]/g, (d) => String(PERSIAN_DIGITS.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String(ARABIC_DIGITS.indexOf(d)));
  if (target === 'en') return toEn;
  const map = target === 'fa' ? PERSIAN_DIGITS : ARABIC_DIGITS;
  return toEn.replace(/[0-9]/g, (d) => map[Number(d)]);
}

// Persian Typography & Half-Space (نیم‌فاصله - Virastar) Engine
export function persianVirastar(input: string): string {
  let text = input;
  // Normalize Arabic Yeh/Kaf to Persian
  text = text.replace(/ي/g, 'ی').replace(/ك/g, 'ک').replace(/ة/g, 'ه');
  // Fix مي / نمي prefix spacing with ZWNJ (\u200C)
  text = text.replace(/(^|\s)(ن?می)\s+([آ-ی]+)/g, '$1$2\u200C$3');
  // Fix ها / های / تر / ترین suffixes with ZWNJ
  text = text.replace(/([آ-ی]+)\s+(ها|های|هایی|تر|ترین|ام|ای|است|ایم|اید|اند)(?=\s|$|[.,،؛:!؟])/g, '$1\u200C$2');
  // Punctuation spacing
  text = text.replace(/\s+([.,،؛:!؟])/g, '$1');
  text = text.replace(/([.,،؛:!؟])(?=[^\s\d.,،؛:!؟])/g, '$1 ');
  // Normalize multiple spaces & ZWNJ
  text = text.replace(/\u200C{2,}/g, '\u200C').replace(/[ \t]{2,}/g, ' ');
  return text.trim();
}

const STOP_WORDS = new Set([
  'the', 'is', 'in', 'at', 'of', 'a', 'an', 'and', 'or', 'to', 'for', 'on', 'with', 'as', 'by', 'that', 'this', 'it', 'be', 'are', 'was', 'were',
  'از', 'به', 'در', 'با', 'برای', 'که', 'این', 'آن', 'و', 'یا', 'را', 'است', 'هست', 'بود', 'شد', 'می', 'بر', 'تا', 'هم', 'یک', 'های', 'شده',
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));
}

export function extractKeywords(text: string, topN = 12): { word: string; count: number; density: number }[] {
  const words = tokenize(text);
  const freq: Record<string, number> = {};
  for (const w of words) freq[w] = (freq[w] || 0) + 1;
  const total = Math.max(words.length, 1);
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([word, count]) => ({ word, count, density: Number(((count / total) * 100).toFixed(2)) }));
}

export function summarizeTextLocal(text: string, maxSentences = 3): string {
  const sentences = text
    .split(/(?<=[.!?؟۔\n])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 15);
  if (sentences.length <= maxSentences) return text.trim();

  const words = tokenize(text);
  const freq: Record<string, number> = {};
  for (const w of words) freq[w] = (freq[w] || 0) + 1;

  const scored = sentences.map((sentence, idx) => {
    const tokens = tokenize(sentence);
    const score =
      tokens.reduce((sum, t) => sum + (freq[t] || 0), 0) / Math.max(Math.sqrt(tokens.length), 1) +
      (idx === 0 ? 2.5 : 0);
    return { sentence, idx, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, maxSentences)
    .sort((a, b) => a.idx - b.idx)
    .map((x) => x.sentence)
    .join(' ');
}

// BM25-like local Document Q&A (works offline for Chat with PDF / Website / Document)
export function answerFromDocumentLocal(documentText: string, question: string): string {
  const chunks = documentText
    .split(/(?<=[.!?؟\n])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 10);
  if (!chunks.length) return 'متن مرجع خالی است. لطفاً ابتدا متن یا فایل را بارگذاری کنید.';

  const qTokens = tokenize(question);
  if (!qTokens.length) return summarizeTextLocal(documentText, 3);

  const scored = chunks.map((chunk) => {
    const cTokens = tokenize(chunk);
    const cSet = new Set(cTokens);
    let score = 0;
    for (const qt of qTokens) {
      if (cSet.has(qt)) score += 3;
      else if (chunk.toLowerCase().includes(qt)) score += 1.5;
    }
    return { chunk, score };
  });

  const best = scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score).slice(0, 3);
  if (!best.length) {
    return `پاسخ دقیق مستقیم یافت نشد؛ خلاصه بخش‌های کلیدی سند:\n\n${summarizeTextLocal(documentText, 3)}`;
  }
  return best.map((b, i) => `${i + 1}. ${b.chunk}`).join('\n\n');
}

export function analyzeSentiment(text: string): { label: string; score: number; positive: number; negative: number } {
  const posWords = [
    'good', 'great', 'awesome', 'love', 'excellent', 'amazing', 'happy', 'best', 'fast', 'free', 'perfect', 'nice', 'wonderful',
    'عالی', 'خوب', 'فوق‌العاده', 'زیبا', 'بهترین', 'دوست', 'سریع', 'موفق', 'خوشحال', 'قدرتمند', 'بی‌نظیر', 'مفید', 'رایگان',
  ];
  const negWords = [
    'bad', 'terrible', 'hate', 'worst', 'slow', 'broken', 'ugly', 'error', 'fail', 'poor', 'sad', 'angry', 'awful',
    'بد', 'ضعیف', 'خراب', 'کند', 'افتضاح', 'مشکل', 'خطا', 'ناراحت', 'زشت', 'نامناسب', 'شکست', 'غمگین',
  ];
  const lower = text.toLowerCase();
  let positive = 0;
  let negative = 0;
  for (const w of posWords) if (lower.includes(w)) positive++;
  for (const w of negWords) if (lower.includes(w)) negative++;
  const total = positive + negative;
  const score = total === 0 ? 0 : Math.round(((positive - negative) / total) * 100);
  const label = score > 20 ? 'مثبت (Positive) 😊' : score < -20 ? 'منفی (Negative) 😟' : 'خنثی (Neutral) 😐';
  return { label, score, positive, negative };
}

export function extractEntities(text: string) {
  return {
    emails: Array.from(new Set(text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [])),
    urls: Array.from(new Set(text.match(/https?:\/\/[^\s"'<>]+/g) || [])),
    phones: Array.from(new Set(text.match(/(?:\+?\d[\d\s-]{8,14}\d|09[0-9۰-۹]{9})/g) || [])),
    dates: Array.from(new Set(text.match(/\b\d{4}[-/]\d{1,2}[-/]\d{1,2}\b|\b1[34]\d{2}\/\d{1,2}\/\d{1,2}\b/g) || [])),
    numbers: Array.from(new Set(text.match(/\b\d+(?:[.,]\d+)?\b/g) || [])).slice(0, 30),
    hashtags: Array.from(new Set(text.match(/#[\p{L}\p{N}_]+/gu) || [])),
    mentions: Array.from(new Set(text.match(/@[\p{L}\p{N}_]+/gu) || [])),
  };
}

export function computeReadability(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const sentences = text.split(/[.!?؟\n]+/).filter((s) => s.trim().length > 0);
  const avgWordsPerSentence = words.length / Math.max(sentences.length, 1);
  const avgWordLen = words.reduce((s, w) => s + w.length, 0) / Math.max(words.length, 1);
  const score = Math.max(0, Math.min(100, Math.round(120 - avgWordsPerSentence * 1.4 - avgWordLen * 6.5)));
  const level = score >= 75 ? 'بسیار روان (آسان)' : score >= 50 ? 'استاندارد (متوسط)' : 'تخصصی / پیچیده';
  return {
    words: words.length,
    sentences: sentences.length,
    avgWordsPerSentence: Number(avgWordsPerSentence.toFixed(1)),
    avgWordLen: Number(avgWordLen.toFixed(1)),
    readingTimeMin: Math.max(1, Math.ceil(words.length / 200)),
    score,
    level,
  };
}

// Jaccard 3-shingle text similarity (Plagiarism Checker)
export function computePlagiarismSimilarity(textA: string, textB: string): { similarityPct: number; matchedPhrases: string[] } {
  const wordsA = tokenize(textA);
  const wordsB = tokenize(textB);
  const makeShingles = (ws: string[]) => {
    const s = new Set<string>();
    const size = Math.min(3, Math.max(1, ws.length));
    for (let i = 0; i <= ws.length - size; i++) s.add(ws.slice(i, i + size).join(' '));
    return s;
  };
  const setA = makeShingles(wordsA);
  const setB = makeShingles(wordsB);
  const matched: string[] = [];
  for (const item of setA) if (setB.has(item)) matched.push(item);
  const union = new Set([...setA, ...setB]).size;
  const similarityPct = union === 0 ? 0 : Math.round((matched.length / union) * 100);
  return { similarityPct, matchedPhrases: matched.slice(0, 15) };
}
