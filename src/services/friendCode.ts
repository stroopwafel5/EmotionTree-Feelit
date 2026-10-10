/**
 * friendCode.ts
 * --------------------------------------------------------------------------
 * Friend codes look like "COMET-0427": a space word and 4 numbers.
 * Children add a friend by picking the word (a big picture button) and
 * tapping the 4 numbers - no spelling needed.
 *
 * There is no search and no list of other children: you can only add
 * someone whose code you got from them (in real life).
 *
 * IMPORTANT: the words must be the same as CODE_WORDS in
 * server/src/security.js (the server makes the codes).
 */

export interface CodeWord {
  word: string;
  icon: string;
}

export const CODE_WORDS: CodeWord[] = [
  { word: 'STAR', icon: '⭐' },
  { word: 'MOON', icon: '🌙' },
  { word: 'COMET', icon: '☄️' },
  { word: 'ROCKET', icon: '🚀' },
  { word: 'PLANET', icon: '🪐' },
  { word: 'NOVA', icon: '💥' },
  { word: 'ORBIT', icon: '🛰️' },
  { word: 'LUNA', icon: '🌕' },
  { word: 'SOLAR', icon: '☀️' },
  { word: 'GALAXY', icon: '🌌' },
];

/** "COMET-0427" -> "☄️ COMET-0427" (the picture helps children find the word). */
export function prettyCode(code: string): string {
  const word = code.split('-')[0];
  const found = CODE_WORDS.find(w => w.word === word);
  return found ? `${found.icon} ${code}` : code;
}

/** Builds a code from the picked word and numbers: ("COMET", "0427") -> "COMET-0427". */
export function makeCode(word: string, digits: string): string {
  return `${word}-${digits}`;
}
