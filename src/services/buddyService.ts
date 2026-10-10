/**
 * buddyService.ts
 * --------------------------------------------------------------------------
 * Saves, ON THIS PHONE ONLY, what a grown-up set up for the space buddy:
 *
 *   settings  - buddy time on/off, and OPEN TALK (typing to the buddy),
 *               which is OFF until a grown-up turns it on
 *   notebook  - "Teach my buddy": a nickname, topics the child loves, the
 *               grown-up's own topics and facts, comfort words, things that
 *               help the child calm down, friends' and pets' names
 *
 * What the CHILD says to the buddy is never saved here (or anywhere).
 * Nothing in this file is ever sent to a server.
 */
import { EMPTY_NOTEBOOK, BUDDY, type BuddyNotebook, type MyTopic } from '../models/BuddyBrain';
import { deviceStorage, type KeyValueStore, readJson, writeJson } from './storage';

export interface BuddySettings {
  /** Buddy time (talking with buttons, games, adventures, help). */
  enabled: boolean;
  /** Open talk: the child can TYPE to the buddy. Off until a grown-up turns it on. */
  typing: boolean;
}

export interface BuddySaved {
  settings: BuddySettings;
  notebook: BuddyNotebook;
}

export const DEFAULT_BUDDY: BuddySaved = {
  settings: { enabled: true, typing: false },
  notebook: EMPTY_NOTEBOOK,
};

/** Limits, so the notebook stays small and simple. */
export const LIMITS = { text: 150, name: 20, list: 20, topics: 10, facts: 30 };

const TOPIC_IDS = BUDDY.topics.map(t => t.id);

/**
 * Checks a sentence a grown-up wants the buddy to say. Returns a problem in
 * easy English, or null when it is OK. (The buddy never shows links, emails
 * or phone numbers.)
 */
export function checkGrownUpText(text: string, max = LIMITS.text): string | null {
  const clean = text.trim();
  if (!clean) {
    return 'Please type something first.';
  }
  if (clean.length > max) {
    return `Please keep it shorter (${max} letters at most).`;
  }
  if (/https?:\/\/|www\.|\.[a-z]{2,4}\//i.test(clean) || /[^\s@]+@[^\s@]+\.[a-z]{2,}/i.test(clean) || /\d[\d\s().-]{6,}\d/.test(clean)) {
    return 'The buddy can\'t say links, emails or phone numbers.';
  }
  return null;
}

const strings = (value: unknown, max: number, count: number): string[] =>
  Array.isArray(value)
    ? value
        .filter((v): v is string => typeof v === 'string' && checkGrownUpText(v, max) === null)
        .map(v => v.trim())
        .slice(0, count)
    : [];

/** Makes saved data safe to use (old or broken saves can't break the buddy). */
export function normalizeBuddy(raw: unknown): BuddySaved {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Partial<BuddySaved>;
  const s = (r.settings ?? {}) as Partial<BuddySettings>;
  const n = (r.notebook ?? {}) as Partial<BuddyNotebook>;
  const myTopics: MyTopic[] = Array.isArray(n.myTopics)
    ? n.myTopics
        .filter(t => t && typeof t.name === 'string' && checkGrownUpText(t.name, LIMITS.name) === null)
        .map((t, i) => ({
          id: typeof t.id === 'string' && t.id.startsWith('my-') ? t.id : `my-${i + 1}`,
          name: t.name.trim(),
          icon: typeof t.icon === 'string' && t.icon.trim() ? t.icon.trim().slice(0, 8) : '⭐',
          facts: strings(t.facts, LIMITS.text, LIMITS.facts),
        }))
        .slice(0, LIMITS.topics)
    : [];
  return {
    settings: {
      enabled: typeof s.enabled === 'boolean' ? s.enabled : true,
      typing: s.typing === true,
    },
    notebook: {
      nickname: typeof n.nickname === 'string' && checkGrownUpText(n.nickname, LIMITS.name) === null ? n.nickname.trim() : '',
      loves: Array.isArray(n.loves) ? n.loves.filter(id => TOPIC_IDS.includes(id)) : [],
      myTopics,
      comfort: strings(n.comfort, LIMITS.text, LIMITS.list),
      calm: strings(n.calm, LIMITS.text, LIMITS.list),
      friends: strings(n.friends, LIMITS.name, LIMITS.list),
      pets: strings(n.pets, LIMITS.name, LIMITS.list),
    },
  };
}

const key = (localUserId: number) => `buddy.${localUserId}`;

export class BuddyService {
  constructor(private readonly store: KeyValueStore = deviceStorage) {}

  async load(localUserId: number): Promise<BuddySaved> {
    return normalizeBuddy(await readJson<unknown>(this.store, key(localUserId), null));
  }

  async save(localUserId: number, saved: BuddySaved): Promise<void> {
    await writeJson(this.store, key(localUserId), normalizeBuddy(saved));
  }
}

export const buddyService = new BuddyService();
