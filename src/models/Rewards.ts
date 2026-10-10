/**
 * Rewards.ts
 * --------------------------------------------------------------------------
 * Space candies 🍬, the Space Shop, Feelings Tests and the weekly homework.
 *
 *  - Candies: the child gets candies for every right answer (in a leaf or
 *    a test), for finishing a leaf or a test, and for doing the weekly
 *    homework. They spend them in the Space Shop (looks.json items with a
 *    "price").
 *  - Missions: a finished leaf or a finished test is one "mission".
 *  - Weekly homework: a grown-up picks how many missions a week (default 3,
 *    see rewards.json). Doing it every week grows a STREAK (like Duolingo's
 *    daily streak, but weekly): "🔥 4 weeks in a row".
 *  - Weekly check-up: the first time the app opens in a new week, the child
 *    sees how last week went and this week's homework.
 *
 * Everything here is plain functions that take the old state and give back
 * a new one (nothing is changed in place), so it is easy to test and to
 * save. The state is saved per child by services/rewardsService.ts.
 * Dates use the phone's own time zone.
 */
import rewardsData from '../data/rewards.json';

// ---------------------------------------------------------------------------
// Settings (from src/data/rewards.json)
// ---------------------------------------------------------------------------

export const CANDIES = rewardsData.candies;
export const TEST_SETTINGS = rewardsData.test;
export const WEEKLY_SETTINGS = rewardsData.weekly;

export type WeekStart = 'monday' | 'sunday';
const WEEK_STARTS_ON: WeekStart = WEEKLY_SETTINGS.weekStartsOn === 'sunday' ? 'sunday' : 'monday';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** One week of homework. */
export interface WeekRecord {
  /** Missions done (finished leaves + tests). */
  missions: number;
  /** The weekly goal for this week. */
  goal: number;
  /** Which days had a mission (0 = first day of the week ... 6). */
  days: number[];
  /** True once the weekly-goal candies were given. */
  bonus: boolean;
}

/** One finished Feelings Test. */
export interface TestRecord {
  /** When (ISO date). */
  at: string;
  score: number;
  total: number;
  /** Per level: level id -> [right, asked]. */
  byLevel: Record<string, [number, number]>;
}

export interface RewardsState {
  /** Candies the child has now. */
  candies: number;
  /** All candies ever earned. */
  earned: number;
  /** Shop items bought, e.g. "human:guitar", "pet:petShades". */
  owned: string[];
  /** Missions per week (set by a grown-up). */
  weeklyGoal: number;
  /** Week start date "YYYY-MM-DD" -> that week. */
  weeks: Record<string, WeekRecord>;
  /** Finished tests, oldest first (the last 30 are kept). */
  tests: TestRecord[];
  /** The week (key) the weekly check-up was last shown. */
  lastCheckup: string | null;
}

export function emptyRewards(): RewardsState {
  return {
    candies: 0,
    earned: 0,
    owned: [],
    weeklyGoal: WEEKLY_SETTINGS.defaultGoal,
    weeks: {},
    tests: [],
    lastCheckup: null,
  };
}

/** Fills in anything missing (e.g. data saved by an older app version). */
export function normalizeRewards(saved: Partial<RewardsState> | null | undefined): RewardsState {
  const base = emptyRewards();
  if (!saved || typeof saved !== 'object') {
    return base;
  }
  return {
    candies: Math.max(0, Number(saved.candies) || 0),
    earned: Math.max(0, Number(saved.earned) || 0),
    owned: Array.isArray(saved.owned) ? saved.owned.filter(x => typeof x === 'string') : [],
    weeklyGoal: Number(saved.weeklyGoal) > 0 ? Number(saved.weeklyGoal) : base.weeklyGoal,
    weeks: saved.weeks && typeof saved.weeks === 'object' ? saved.weeks : {},
    tests: Array.isArray(saved.tests) ? saved.tests : [],
    lastCheckup: typeof saved.lastCheckup === 'string' ? saved.lastCheckup : null,
  };
}

// ---------------------------------------------------------------------------
// Weeks (local time)
// ---------------------------------------------------------------------------

const pad = (n: number) => String(n).padStart(2, '0');
const dateKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function parseKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Which day of the week (0 = the first day of the week ... 6). */
export function dayOfWeek(now: Date, startsOn: WeekStart = WEEK_STARTS_ON): number {
  const day = now.getDay(); // 0 = Sunday
  return startsOn === 'monday' ? (day + 6) % 7 : day;
}

/** The week a date is in, as the date of its first day: "2026-10-05". */
export function weekKey(now: Date, startsOn: WeekStart = WEEK_STARTS_ON): string {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek(now, startsOn));
  return dateKey(start);
}

/** Moves a week key forward (n > 0) or back (n < 0). */
export function addWeeks(key: string, n: number): string {
  const d = parseKey(key);
  return dateKey(new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7 * n));
}

/** "Oct 5" for a week key (for the grown-ups' report). */
export function weekLabel(key: string): string {
  const d = parseKey(key);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}`;
}

/** The short day names, in week order (for the M T W T F S S dots). */
export function dayLetters(startsOn: WeekStart = WEEK_STARTS_ON): string[] {
  return startsOn === 'monday'
    ? ['M', 'T', 'W', 'T', 'F', 'S', 'S']
    : ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
}

const isDone = (w: WeekRecord | undefined) => !!w && w.missions >= w.goal;

export interface WeekSummary {
  key: string;
  missions: number;
  goal: number;
  /** One entry per day of the week: true = a mission that day. */
  days: boolean[];
  done: boolean;
  /** Missions still needed (0 when done). */
  left: number;
}

/** How a week went (an empty week if nothing was done). */
export function weekSummary(state: RewardsState, key: string, fallbackGoal = state.weeklyGoal): WeekSummary {
  const w = state.weeks[key];
  const goal = w?.goal ?? fallbackGoal;
  const missions = w?.missions ?? 0;
  const days = Array.from({ length: 7 }, (_, i) => !!w?.days.includes(i));
  return { key, missions, goal, days, done: missions >= goal, left: Math.max(0, goal - missions) };
}

/** This week's homework. */
export function thisWeek(state: RewardsState, now: Date): WeekSummary {
  return weekSummary(state, weekKey(now));
}

/**
 * The streak: how many weeks in a row the homework was done. This week
 * counts once it is done; until then the streak is still "alive" (the
 * child has the rest of the week).
 */
export function streak(state: RewardsState, now: Date): number {
  const current = weekKey(now);
  let count = isDone(state.weeks[current]) ? 1 : 0;
  let key = addWeeks(current, -1);
  while (isDone(state.weeks[key])) {
    count += 1;
    key = addWeeks(key, -1);
  }
  return count;
}

/** The last `n` weeks, newest first (for the grown-ups' report). */
export function recentWeeks(state: RewardsState, now: Date, n = 8): WeekSummary[] {
  const current = weekKey(now);
  return Array.from({ length: n }, (_, i) => weekSummary(state, addWeeks(current, -i)));
}

// ---------------------------------------------------------------------------
// Candies
// ---------------------------------------------------------------------------

/** Gives candies. */
export function earn(state: RewardsState, candies: number): RewardsState {
  if (candies <= 0) {
    return state;
  }
  return { ...state, candies: state.candies + candies, earned: state.earned + candies };
}

/** The result of recording a mission. */
export interface MissionResult {
  state: RewardsState;
  /** True when this mission finished the weekly homework (bonus given). */
  goalReached: boolean;
  /** Candies given for the weekly homework (0 if not reached now). */
  bonus: number;
}

/**
 * A mission is done (a finished leaf or test). Counts it for this week and,
 * when the weekly homework is now complete, gives the weekly candies (once a
 * week).
 */
export function recordMission(state: RewardsState, now: Date): MissionResult {
  const key = weekKey(now);
  const old = state.weeks[key] ?? { missions: 0, goal: state.weeklyGoal, days: [], bonus: false };
  const day = dayOfWeek(now);
  const week: WeekRecord = {
    ...old,
    missions: old.missions + 1,
    days: old.days.includes(day) ? old.days : [...old.days, day].sort(),
  };
  const goalReached = !week.bonus && week.missions >= week.goal;
  if (goalReached) {
    week.bonus = true;
  }
  let next: RewardsState = { ...state, weeks: { ...state.weeks, [key]: week } };
  const bonus = goalReached ? CANDIES.weeklyGoal : 0;
  next = earn(next, bonus);
  return { state: next, goalReached, bonus };
}

/** A grown-up changes the weekly homework (this week changes too). */
export function setWeeklyGoal(state: RewardsState, goal: number, now: Date): RewardsState {
  const key = weekKey(now);
  const weeks = { ...state.weeks };
  if (weeks[key]) {
    weeks[key] = { ...weeks[key], goal };
  }
  return { ...state, weeklyGoal: goal, weeks };
}

// ---------------------------------------------------------------------------
// Space Shop
// ---------------------------------------------------------------------------

/** "human:guitar" or "pet:petShades". */
export const itemKey = (forPet: boolean, id: string) => `${forPet ? 'pet' : 'human'}:${id}`;

export function owns(state: RewardsState, key: string): boolean {
  return state.owned.includes(key);
}

export type BuyResult = { ok: true; state: RewardsState } | { ok: false; need: number };

/** Buys a shop item (if there are enough candies). */
export function buy(state: RewardsState, key: string, price: number): BuyResult {
  if (owns(state, key)) {
    return { ok: true, state };
  }
  if (state.candies < price) {
    return { ok: false, need: price - state.candies };
  }
  return { ok: true, state: { ...state, candies: state.candies - price, owned: [...state.owned, key] } };
}

// ---------------------------------------------------------------------------
// Feelings Tests
// ---------------------------------------------------------------------------

/** Stars for a test score (from rewards.json: e.g. 90% = 3 stars). */
export function starsFor(score: number, total: number): number {
  if (total === 0) {
    return 0;
  }
  const percent = (score / total) * 100;
  for (const step of TEST_SETTINGS.stars) {
    if (percent >= step.percent) {
      return step.stars;
    }
  }
  return 0;
}

/** Candies for finishing a test (the per-answer candies are given as they go). */
export function testBonus(score: number, total: number): number {
  return CANDIES.finishTest + (total > 0 && score === total ? CANDIES.perfectTest : 0);
}

/** Saves a finished test (keeps the last 30). */
export function recordTest(state: RewardsState, test: TestRecord): RewardsState {
  return { ...state, tests: [...state.tests, test].slice(-30) };
}

/** The best score so far, as a percentage (null if no tests yet). */
export function bestTestPercent(state: RewardsState): number | null {
  if (state.tests.length === 0) {
    return null;
  }
  return Math.max(...state.tests.map(t => (t.total ? Math.round((t.score / t.total) * 100) : 0)));
}

// ---------------------------------------------------------------------------
// Weekly check-up
// ---------------------------------------------------------------------------

export type Checkup =
  | { kind: 'welcome'; goal: number }
  | { kind: 'newWeek'; lastWeek: WeekSummary; streak: number; goal: number };

/**
 * Should the weekly check-up pop up now? Yes the first time the app opens
 * in a new week (or the very first time: a welcome to weekly homework).
 */
export function checkupDue(state: RewardsState, now: Date): Checkup | null {
  const current = weekKey(now);
  if (state.lastCheckup === current) {
    return null;
  }
  if (state.lastCheckup === null) {
    return { kind: 'welcome', goal: state.weeklyGoal };
  }
  return {
    kind: 'newWeek',
    lastWeek: weekSummary(state, addWeeks(current, -1)),
    streak: streak(state, now),
    goal: state.weeklyGoal,
  };
}

export function markCheckupSeen(state: RewardsState, now: Date): RewardsState {
  return { ...state, lastCheckup: weekKey(now) };
}

// ---------------------------------------------------------------------------
// For the parent page (sent to the Friends server when Friends is on)
// ---------------------------------------------------------------------------

export interface ProgressReport {
  weeklyGoal: number;
  streak: number;
  /** Newest first: this week, last week, ... (8 weeks). */
  weeks: { start: string; missions: number; goal: number }[];
  /** Newest first (5 tests). */
  tests: { at: string; score: number; total: number }[];
  candiesEarned: number;
}

export function progressReport(state: RewardsState, now: Date): ProgressReport {
  return {
    weeklyGoal: state.weeklyGoal,
    streak: streak(state, now),
    weeks: recentWeeks(state, now, 8).map(w => ({ start: w.key, missions: w.missions, goal: w.goal })),
    tests: [...state.tests]
      .reverse()
      .slice(0, 5)
      .map(t => ({ at: t.at, score: t.score, total: t.total })),
    candiesEarned: state.earned,
  };
}
