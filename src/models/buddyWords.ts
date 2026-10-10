/**
 * buddyWords.ts
 * --------------------------------------------------------------------------
 * How the space buddy "reads" what a child types. There is NO AI here: the
 * text is split into simple words and compared with the PATTERNS written in
 * buddy.json and adventures.json.
 *
 * Pattern rules (also in CONTENT_GUIDE.md):
 *   "how are you"   these words, next to each other, anywhere in the message
 *   "play + game"   BOTH parts anywhere in the message ("+" = "and also")
 *   "dino*"         any word that starts with "dino" (dinosaur, dinos...)
 *   "=hi"           the WHOLE message is exactly "hi"
 *   "~good"         (feelings only) only when the child talks about
 *                   themselves: "I am good", "I feel good", or just "good"
 *
 * Kids' spelling is forgiven: capitals, punctuation and apostrophes are
 * ignored ("I'm" = "im" = "i am"), "u" = "you" (the "spelling" list in
 * buddy.json), "sooooo" = "so", and in longer words one missing, extra or
 * swapped letter is OK ("lonly" = "lonely", "tierd" = "tired").
 */
import buddyJson from '../data/buddy.json';

/** One word the child typed. `alt` = the word with stretched letters squeezed ("saaad" -> "sad"). */
export interface Word {
  w: string;
  alt: string | null;
}

/** A pattern from the JSON, ready to compare. */
export interface Pattern {
  /** "=..." : the whole message. */
  exact: boolean;
  /** "~..." : only about the child themselves (feelings). */
  self: boolean;
  /** One list of words per "+" part. */
  parts: string[][];
}

/** A pattern that matched: how strong, and where. */
export interface Hit {
  /** How many pattern words matched (bigger = more sure). */
  score: number;
  /** Index of the first matched word. */
  at: number;
  /** How many words matched there. */
  len: number;
}

const SPELLING: Record<string, string> = buddyJson.spelling;

/** Lowercase, no apostrophes. */
function clean(text: string): string {
  return text.toLowerCase().replace(/[’‘`´']/g, '');
}

/** Splits what the child typed into words (spelling fixed). */
export function words(text: string): Word[] {
  const out: Word[] = [];
  for (const raw of clean(text).split(/[^a-z0-9]+/)) {
    if (!raw) {
      continue;
    }
    // A stretched letter ("sooooo", "saaad", "happyyy"): keep it at most
    // twice ("soo"), and also try it once ("sad", "happy").
    const two = raw.replace(/([a-z])\1{2,}/g, '$1$1');
    const one = /([a-z])\1{2,}/.test(raw) ? raw.replace(/([a-z])\1{2,}/g, '$1') : null;
    const fixed = SPELLING[two] ?? (one ? SPELLING[one] : undefined);
    if (fixed !== undefined) {
      for (const w of fixed.split(' ').filter(Boolean)) {
        out.push({ w, alt: null });
      }
      continue;
    }
    out.push({ w: two, alt: one && one !== two ? one : null });
  }
  return out;
}

/** The words of a pattern (keeps a "*" at the end of a word). */
function patternWords(text: string): string[] {
  const out: string[] = [];
  for (const raw of clean(text).split(/[^a-z0-9*]+/)) {
    if (!raw) {
      continue;
    }
    if (raw.endsWith('*')) {
      out.push(raw);
      continue;
    }
    const fixed = SPELLING[raw];
    out.push(...(fixed !== undefined ? fixed.split(' ').filter(Boolean) : [raw]));
  }
  return out;
}

const compiled = new Map<string, Pattern>();

/** Turns a pattern string from the JSON into a Pattern (cached). */
export function compile(text: string): Pattern {
  const hit = compiled.get(text);
  if (hit) {
    return hit;
  }
  let body = text.trim();
  const exact = body.startsWith('=');
  if (exact) {
    body = body.slice(1);
  }
  const self = body.startsWith('~');
  if (self) {
    body = body.slice(1);
  }
  const parts = body
    .split('+')
    .map(patternWords)
    .filter(p => p.length > 0);
  const pattern = { exact, self, parts };
  compiled.set(text, pattern);
  return pattern;
}

/** Only one letter missing, added, or two letters swapped (not a different letter). */
function oneSlip(a: string, b: string): boolean {
  if (a.length === b.length) {
    const diff: number[] = [];
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) {
        diff.push(i);
      }
    }
    return diff.length === 2 && diff[1] === diff[0] + 1 && a[diff[0]] === b[diff[1]] && a[diff[1]] === b[diff[0]];
  }
  const [long, short] = a.length > b.length ? [a, b] : [b, a];
  if (long.length - short.length !== 1) {
    return false;
  }
  for (let i = 0; i < long.length; i++) {
    if (long.slice(0, i) + long.slice(i + 1) === short) {
      return true;
    }
  }
  return false;
}

/** Does one typed word match one pattern word? */
export function sameWord(word: Word, pattern: string, fuzzy = true): boolean {
  if (pattern.endsWith('*')) {
    const start = pattern.slice(0, -1);
    return word.w.startsWith(start) || (word.alt?.startsWith(start) ?? false);
  }
  if (word.w === pattern || word.alt === pattern) {
    return true;
  }
  return fuzzy && pattern.length >= 5 && word.w.length >= 5 && oneSlip(word.w, pattern);
}

/** Where (if anywhere) the words of one part appear next to each other. */
function findPart(message: Word[], part: string[], fuzzy: boolean, from = 0): number {
  for (let i = from; i + part.length <= message.length; i++) {
    if (part.every((p, j) => sameWord(message[i + j], p, fuzzy))) {
      return i;
    }
  }
  return -1;
}

/** Words that show the child is talking about themselves (for "~" patterns). */
const SELF_BEFORE = [['i', 'am'], ['i', 'feel'], ['feeling'], ['i', 'felt'], ['feel'], ['i', 'was'], ['so'], ['very'], ['really'], ['am']];

/** Is the child talking about themselves at word `at` ("I am sad", "I feel sad", or just "sad")? */
export function aboutMe(message: Word[], at: number): boolean {
  if (message.length <= 2) {
    return true; // just "good" / "very good"
  }
  return SELF_BEFORE.some(before => {
    const start = at - before.length;
    return start >= 0 && before.every((b, j) => message[start + j].w === b);
  });
}

/**
 * How well a message matches a pattern. Returns null when it does not.
 * score = number of pattern words (+0.5 for an exact "=" match).
 */
export function matchPattern(message: Word[], pattern: Pattern | string, fuzzy = true): Hit | null {
  const p = typeof pattern === 'string' ? compile(pattern) : pattern;
  if (p.parts.length === 0) {
    return null;
  }
  if (p.exact) {
    const all = p.parts.flat();
    if (all.length === message.length && all.every((w, i) => sameWord(message[i], w, fuzzy))) {
      return { score: all.length + 0.5, at: 0, len: all.length };
    }
    return null;
  }
  let first: Hit | null = null;
  let score = 0;
  for (const part of p.parts) {
    let at = findPart(message, part, fuzzy);
    if (p.self) {
      while (at >= 0 && !aboutMe(message, at)) {
        at = findPart(message, part, fuzzy, at + 1);
      }
    }
    if (at < 0) {
      return null;
    }
    score += part.length;
    first = first ?? { score: 0, at, len: part.length };
  }
  return first ? { ...first, score } : null;
}

/** The best match among many patterns (or null). */
export function bestMatch(message: Word[], patterns: readonly string[], fuzzy = true): Hit | null {
  let best: Hit | null = null;
  for (const p of patterns) {
    const hit = matchPattern(message, p, fuzzy);
    if (hit && (!best || hit.score > best.score)) {
      best = hit;
    }
  }
  return best;
}

/** The words the child typed at a hit ("pizza", "ice cream"). */
export function matchedText(message: Word[], hit: Hit): string {
  return message
    .slice(hit.at, hit.at + hit.len)
    .map(m => m.alt ?? m.w)
    .join(' ');
}

// ---------------------------------------------------------------------------
// Safety (used by the buddy talk AND by typed answers in adventures)
// ---------------------------------------------------------------------------

export interface SafetyRule {
  id: string;
  /** What the grown-ups see ("Someone is hurting them"). */
  title: string;
  /** auto = the buddy tells the grown-ups straight away; ask = it asks the child first. */
  tell: 'auto' | 'ask';
  patterns: string[];
  /** Not worrying after all when one of these matches ("the ball hit me", "by accident"). */
  except?: string[];
  replies: string[];
}

export const SAFETY_RULES: SafetyRule[] = buddyJson.safety as SafetyRule[];

/**
 * Checks a message for something worrying (someone hurting the child,
 * unsafe touching, wanting to hurt themselves...). The rules are checked in
 * the order of the safety list in buddy.json, the most serious first.
 * No typo-guessing here ("strange" must never count as "stranger"): common
 * misspellings are written in the patterns instead.
 */
export function findWorry(text: string): SafetyRule | null {
  const message = words(text);
  for (const rule of SAFETY_RULES) {
    if (bestMatch(message, rule.patterns, false) && !(rule.except && bestMatch(message, rule.except, false))) {
      return rule;
    }
  }
  return null;
}

/** Phone numbers, emails and "I live at..." (the buddy says: keep it private). */
export function hasPrivateInfo(text: string): boolean {
  if (/\d[\d\s().-]{5,}\d/.test(text) || /[^\s@]+@[^\s@]+\.[a-z]{2,}/i.test(text)) {
    return true;
  }
  return bestMatch(words(text), buddyJson.privateInfo.patterns) !== null;
}

/** Unkind words or swearing (never "fuzzy": "socks" is not "sucks"). */
export function hasUnkindWords(text: string): boolean {
  return bestMatch(words(text), buddyJson.unkind.words, false) !== null;
}
