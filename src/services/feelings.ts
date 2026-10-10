/**
 * feelings.ts and phrases
 * --------------------------------------------------------------------------
 * Reads src/data/feelings.json (feelings a child can share) and
 * src/data/phrases.json (ready-made chat phrases, like Club Penguin's
 * Safe Chat).
 */
import feelingsData from '../data/feelings.json';
import phrasesData from '../data/phrases.json';

/** One feeling, e.g. { id: "happy", name: "Happy", emoji: "😊", face: "happy" }. */
export interface Feeling {
  id: string;
  name: string;
  emoji: string;
  /** Which face the avatar makes (see components/avatar/KidAvatar.tsx). */
  face: string;
}

export const feelings: Feeling[] = feelingsData.feelings;

export function getFeeling(id: string): Feeling | undefined {
  return feelings.find(f => f.id === id);
}

/** One ready-made phrase. */
export interface Phrase {
  id: string;
  text: string;
}

/** A group of phrases ("Hello", "Play", ...). */
export interface PhraseCategory {
  id: string;
  name: string;
  icon: string;
  phrases: Phrase[];
}

export const phraseCategories: PhraseCategory[] = phrasesData.categories;

/** The text of a phrase id, e.g. "hi" -> "Hi! 👋". */
export function phraseText(id: string): string {
  for (const category of phraseCategories) {
    const found = category.phrases.find(p => p.id === id);
    if (found) {
      return found.text;
    }
  }
  return '…';
}
