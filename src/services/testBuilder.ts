/**
 * testBuilder.ts
 * --------------------------------------------------------------------------
 * Builds a Feelings Test: questions MIXED from the leaves the child already
 * finished (Happiness, Sadness, Anger...), to check what they remember.
 *
 *  - Only finished leaves are used (the child has learned those).
 *  - The questions take turns between the feelings, so a test is always a
 *    good mix, then they are shuffled.
 *  - The 4 answers are shuffled too, so the child can't remember "the
 *    right one was the blue button".
 *
 * How many questions, and how many leaves are needed first: rewards.json.
 */
import type { Level } from '../models/Level';
import type { Question } from '../models/Question';
import { TEST_SETTINGS } from '../models/Rewards';

export interface TestQuestion {
  question: Question;
  levelId: number;
  levelName: string;
  levelIcon: string;
  /** The 4 answers in a new order. */
  answers: string[];
}

/** Mixes a list (Fisher-Yates). `random` can be fixed in tests. */
export function shuffle<T>(list: T[], random: () => number = Math.random): T[] {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** The finished leaves (the test only asks about these). */
export function learnedLevels(levels: Level[]): Level[] {
  return levels.filter(l => l.isCompleted() && l.getQuestions().length > 0);
}

/** True when enough leaves are finished to take a test. */
export function canTakeTest(levels: Level[]): boolean {
  return learnedLevels(levels).length >= TEST_SETTINGS.leavesNeeded;
}

/** Builds a new test. */
export function buildTest(
  levels: Level[],
  count: number = TEST_SETTINGS.questions,
  random: () => number = Math.random,
): TestQuestion[] {
  const pools = shuffle(learnedLevels(levels), random).map(level => ({
    level,
    questions: shuffle(level.getQuestions(), random),
  }));
  const picked: TestQuestion[] = [];
  // Take turns: one question from each feeling, again and again.
  let added = true;
  while (picked.length < count && added) {
    added = false;
    for (const pool of pools) {
      const question = pool.questions.shift();
      if (question && picked.length < count) {
        picked.push({
          question,
          levelId: pool.level.getId(),
          levelName: pool.level.getName(),
          levelIcon: pool.level.getIcon(),
          answers: shuffle(question.answers, random),
        });
        added = true;
      }
    }
  }
  return shuffle(picked, random);
}

/** Right / asked per feeling, for the results screen. */
export function resultsByLevel(
  questions: TestQuestion[],
  right: boolean[],
): { levelId: number; levelName: string; levelIcon: string; right: number; asked: number }[] {
  const byLevel = new Map<number, { levelId: number; levelName: string; levelIcon: string; right: number; asked: number }>();
  questions.forEach((q, i) => {
    const row = byLevel.get(q.levelId) ?? { levelId: q.levelId, levelName: q.levelName, levelIcon: q.levelIcon, right: 0, asked: 0 };
    row.asked += 1;
    row.right += right[i] ? 1 : 0;
    byLevel.set(q.levelId, row);
  });
  return [...byLevel.values()].sort((a, b) => a.levelId - b.levelId);
}
