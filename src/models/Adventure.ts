/**
 * Adventure.ts
 * --------------------------------------------------------------------------
 * Space buddy ADVENTURES: short stories (src/data/adventures.json) where the
 * child practises what they learned in the feelings leaves - noticing how
 * someone feels, what to say, how to calm down, how to join a game.
 *
 * An adventure is a list of steps. Each step is one of:
 *   talk     "say" lines, then a Next button ("next", optional "nextLabel")
 *   choice   "choices": buttons. A "good" one goes on; another one gets a
 *            kind reply and the child can try again (never "wrong!")
 *   words    "ideas" (buttons) and, when a grown-up turned on typing, the
 *            child's own words. "listen" patterns pick the reply; "again"
 *            = gently ask for another idea; "otherwise" = any other answer
 *   feelings "feelings": true - the child picks a feeling card
 *   end      "end": true
 *
 * A "say" line that starts with a cast id ("robo: Beep!") is said by that
 * character, the other lines by the child's space buddy.
 *
 * checkAdventures() finds mistakes in the file (npm test runs it), so
 * grown-ups can write their own adventures safely.
 */
import adventuresJson from '../data/adventures.json';
import feelingsJson from '../data/feelings.json';
import { bestMatch, words } from './buddyWords';

export interface ChoiceJson {
  text: string;
  reply: string;
  good?: boolean;
  next?: string;
}

export interface ListenJson {
  patterns: string[];
  reply: string;
  good?: boolean;
  /** Ask the child for another idea (an unkind answer, gently). */
  again?: boolean;
}

export interface StepJson {
  id: string;
  /** Big emoji picture at the top ("🪐🤖"). */
  scene?: string;
  /** The buddy's face (a mood id from looks.json). */
  mood?: string;
  say: string[];
  next?: string;
  /** The Next button's text (default "Next ➜"). */
  nextLabel?: string;
  choices?: ChoiceJson[];
  ideas?: string[];
  listen?: ListenJson[];
  otherwise?: string;
  feelings?: boolean;
  /** feeling id -> reply ("*" = any other feeling). */
  feelingReplies?: Record<string, string>;
  end?: boolean;
}

export interface AdventureJson {
  id: string;
  title: string;
  icon: string;
  about: string;
  /** The leaves (level ids) this adventure practises. */
  practices: number[];
  /** Leaves to finish first ([] = always open). */
  needsLeaves: number[];
  /** Characters: id -> name + emoji. */
  cast?: Record<string, { name: string; icon: string }>;
  /** First step (default: the first in the list). */
  start?: string;
  steps: StepJson[];
}

export const ADVENTURES: AdventureJson[] = (adventuresJson as unknown as { adventures: AdventureJson[] }).adventures;

export type StepKind = 'talk' | 'choice' | 'words' | 'feelings' | 'end';

export function stepKind(step: StepJson): StepKind {
  if (step.end) {
    return 'end';
  }
  if (step.choices) {
    return 'choice';
  }
  if (step.ideas || step.listen) {
    return 'words';
  }
  if (step.feelings) {
    return 'feelings';
  }
  return 'talk';
}

export function firstStep(adventure: AdventureJson): StepJson {
  return adventure.steps.find(s => s.id === adventure.start) ?? adventure.steps[0];
}

export function stepById(adventure: AdventureJson, id: string | undefined): StepJson | undefined {
  return adventure.steps.find(s => s.id === id);
}

/** One speech bubble: by the buddy, or by a character of the story. */
export interface StoryLine {
  by: 'buddy' | 'cast';
  name?: string;
  icon?: string;
  text: string;
}

/** The lines of a step, with {name} and {buddy} filled in. */
export function storyLines(adventure: AdventureJson, lines: string[], names: { name: string; buddy: string }): StoryLine[] {
  return lines.map(line => {
    const filled = line.replace(/\{name\}/g, names.name).replace(/\{buddy\}/g, names.buddy);
    const m = /^([a-z][a-z0-9_-]*):\s*(.*)$/i.exec(filled);
    const who = m ? adventure.cast?.[m[1].toLowerCase()] : undefined;
    if (m && who) {
      return { by: 'cast', name: who.name, icon: who.icon, text: m[2] };
    }
    return { by: 'buddy', text: filled };
  });
}

/** What happens after a choice. */
export function chooseResult(step: StepJson, choice: ChoiceJson): { reply: string; good: boolean; next: string | null } {
  const good = choice.good === true;
  return { reply: choice.reply, good, next: choice.next ?? (good ? step.next ?? null : null) };
}

/** What happens after the child's own words (or an idea button). */
export function wordsResult(step: StepJson, text: string): { reply: string; good: boolean; again: boolean } {
  const message = words(text);
  for (const listen of step.listen ?? []) {
    if (bestMatch(message, listen.patterns)) {
      return { reply: listen.reply, good: listen.good === true, again: listen.again === true };
    }
  }
  return { reply: step.otherwise ?? 'Great idea! 🌟', good: false, again: false };
}

/** The reply to a feeling card. */
export function feelingResult(step: StepJson, feelingId: string): string {
  return step.feelingReplies?.[feelingId] ?? step.feelingReplies?.['*'] ?? 'All feelings are OK! 💜';
}

/** Is this adventure open for a child who finished these leaves? */
export function isUnlocked(adventure: AdventureJson, finishedLevelIds: number[]): boolean {
  return adventure.needsLeaves.every(id => finishedLevelIds.includes(id));
}

/**
 * Finds mistakes in adventures.json. Returns a list of easy-English
 * problems (empty = all good).
 */
export function checkAdventures(adventures: AdventureJson[], levelIds: number[], moods: string[]): string[] {
  const problems: string[] = [];
  const feelingIds = feelingsJson.feelings.map(f => f.id);
  const ids = new Set<string>();
  for (const adv of adventures) {
    const where = `Adventure "${adv.id}"`;
    if (!adv.id || ids.has(adv.id)) {
      problems.push(`${where}: every adventure needs its own id.`);
    }
    ids.add(adv.id);
    if (!adv.title || !adv.icon || !adv.about) {
      problems.push(`${where}: needs a title, an icon and an about text.`);
    }
    for (const id of [...(adv.practices ?? []), ...(adv.needsLeaves ?? [])]) {
      if (!levelIds.includes(id)) {
        problems.push(`${where}: leaf ${id} does not exist in levels.json.`);
      }
    }
    if (!Array.isArray(adv.steps) || adv.steps.length < 2) {
      problems.push(`${where}: needs at least 2 steps.`);
      continue;
    }
    const stepIds = new Set<string>();
    for (const step of adv.steps) {
      if (!step.id || stepIds.has(step.id)) {
        problems.push(`${where}: step "${step.id}" - every step needs its own id.`);
      }
      stepIds.add(step.id);
    }
    if (adv.start && !stepIds.has(adv.start)) {
      problems.push(`${where}: the start step "${adv.start}" does not exist.`);
    }
    const goesTo = (target: string | undefined, from: string) => {
      if (target !== undefined && !stepIds.has(target)) {
        problems.push(`${where}: step "${from}" goes to "${target}", which does not exist.`);
      }
    };
    for (const step of adv.steps) {
      const at = `${where}, step "${step.id}"`;
      if (!Array.isArray(step.say) || step.say.length === 0 || step.say.some(l => typeof l !== 'string' || !l.trim())) {
        problems.push(`${at}: needs "say" lines.`);
      }
      for (const line of step.say ?? []) {
        const m = /^([a-z][a-z0-9_-]*):\s/i.exec(line);
        if (m && !adv.cast?.[m[1].toLowerCase()] && !/^(https?|tip|note)$/i.test(m[1])) {
          problems.push(`${at}: "${m[1]}:" is not in the cast list.`);
        }
      }
      if (step.mood && !moods.includes(step.mood)) {
        problems.push(`${at}: mood "${step.mood}" does not exist (use one of: ${moods.join(', ')}).`);
      }
      goesTo(step.next, step.id);
      const kind = stepKind(step);
      if (kind === 'choice') {
        const choices = step.choices ?? [];
        if (choices.length < 2) {
          problems.push(`${at}: needs at least 2 choices.`);
        }
        if (!choices.some(c => c.good)) {
          problems.push(`${at}: at least one choice needs "good": true.`);
        }
        for (const c of choices) {
          if (!c.text || !c.reply) {
            problems.push(`${at}: every choice needs a "text" and a "reply".`);
          }
          goesTo(c.next, step.id);
          if (c.good && !c.next && !step.next) {
            problems.push(`${at}: the good choice "${c.text}" needs a "next" step.`);
          }
        }
      }
      if (kind === 'words') {
        if (!step.ideas || step.ideas.length === 0) {
          problems.push(`${at}: needs "ideas" (buttons for children who don't type).`);
        }
        if (!step.otherwise) {
          problems.push(`${at}: needs an "otherwise" reply.`);
        }
        for (const l of step.listen ?? []) {
          if (!Array.isArray(l.patterns) || l.patterns.length === 0 || !l.reply) {
            problems.push(`${at}: every "listen" needs "patterns" and a "reply".`);
          }
        }
        // Every idea button must lead somewhere (not only to "again").
        if (step.ideas && !step.ideas.some(i => !wordsResult(step, i).again)) {
          problems.push(`${at}: at least one idea must be a good answer.`);
        }
      }
      if (kind === 'feelings') {
        for (const key of Object.keys(step.feelingReplies ?? {})) {
          if (key !== '*' && !feelingIds.includes(key)) {
            problems.push(`${at}: "${key}" is not a feeling in feelings.json.`);
          }
        }
      }
      if ((kind === 'talk' || kind === 'words' || kind === 'feelings') && !step.next) {
        problems.push(`${at}: needs a "next" step (or "end": true).`);
      }
    }
    if (!adv.steps.some(s => s.end)) {
      problems.push(`${where}: needs a step with "end": true.`);
    }
    // Every step can be reached from the start.
    const seen = new Set<string>();
    const queue = [firstStep(adv).id];
    while (queue.length > 0) {
      const id = queue.pop() as string;
      if (seen.has(id)) {
        continue;
      }
      seen.add(id);
      const step = stepById(adv, id);
      if (!step) {
        continue;
      }
      for (const next of [step.next, ...(step.choices ?? []).map(c => c.next)]) {
        if (next) {
          queue.push(next);
        }
      }
    }
    for (const step of adv.steps) {
      if (!seen.has(step.id)) {
        problems.push(`${where}: step "${step.id}" can never be reached.`);
      }
    }
  }
  return problems;
}
