/**
 * rewards.test.ts
 * --------------------------------------------------------------------------
 * Checks space candies, the Space Shop, the weekly homework + streak, the
 * weekly check-up, and how Feelings Tests are built.
 *
 * Run with:  npm test
 */
import looksData from '../src/data/looks.json';
import rewardsData from '../src/data/rewards.json';
import { initLevels } from '../src/screens/MainScreen';
import {
  addWeeks,
  buy,
  CANDIES,
  checkupDue,
  dayOfWeek,
  earn,
  emptyRewards,
  markCheckupSeen,
  normalizeRewards,
  progressReport,
  recordMission,
  recordTest,
  setWeeklyGoal,
  starsFor,
  streak,
  testBonus,
  thisWeek,
  weekKey,
} from '../src/models/Rewards';
import { catalog } from '../src/services/looksCatalog';
import { buildTest, canTakeTest, learnedLevels, resultsByLevel, shuffle } from '../src/services/testBuilder';

// Fixed dates (local time). 2026-10-05 is a Monday.
const MON = new Date(2026, 9, 5, 10, 0);
const WED = new Date(2026, 9, 7, 16, 30);
const SUN = new Date(2026, 9, 11, 20, 0);
const NEXT_MON = new Date(2026, 9, 12, 9, 0);
const day = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, 12);

/** A fixed "random" so tests are repeatable. */
function seeded(seed = 7) {
  let x = seed;
  return () => {
    x = (x * 16807) % 2147483647;
    return (x - 1) / 2147483646;
  };
}

describe('Weeks', () => {
  it('a week starts on Monday (rewards.json) and has 7 days', () => {
    expect(weekKey(MON)).toBe('2026-10-05');
    expect(weekKey(WED)).toBe('2026-10-05');
    expect(weekKey(SUN)).toBe('2026-10-05');
    expect(weekKey(NEXT_MON)).toBe('2026-10-12');
    expect(dayOfWeek(MON)).toBe(0);
    expect(dayOfWeek(SUN)).toBe(6);
    expect(weekKey(SUN, 'sunday')).toBe('2026-10-11');
  });

  it('moves between weeks (also across months and years)', () => {
    expect(addWeeks('2026-10-05', 1)).toBe('2026-10-12');
    expect(addWeeks('2026-10-05', -1)).toBe('2026-09-28');
    expect(addWeeks('2026-12-28', 1)).toBe('2027-01-04');
  });
});

describe('Space candies and the Space Shop', () => {
  it('earning adds to what the child has and to the total', () => {
    const r = earn(earn(emptyRewards(), 3), 2);
    expect(r.candies).toBe(5);
    expect(r.earned).toBe(5);
  });

  it('buying needs enough candies, and an item is only bought once', () => {
    const rich = earn(emptyRewards(), 40);
    const bought = buy(rich, 'human:guitar', 30);
    expect(bought.ok).toBe(true);
    if (!bought.ok) {
      return;
    }
    expect(bought.state.candies).toBe(10);
    expect(bought.state.owned).toEqual(['human:guitar']);
    expect(bought.state.earned).toBe(40); // spending does not lower "earned"
    // Again: nothing is taken twice.
    const again = buy(bought.state, 'human:guitar', 30);
    expect(again.ok && again.state.candies).toBe(10);
    // Too expensive: says how many are missing.
    expect(buy(bought.state, 'human:firePowers', 60)).toEqual({ ok: false, need: 50 });
  });

  it('every shop item in looks.json has a price and a picture', () => {
    const items = [...catalog.human.accessories, ...catalog.pet.accessories].filter(d => d.isShopItem());
    expect(items.length).toBeGreaterThanOrEqual(10);
    for (const item of items) {
      expect(item.price).toBeGreaterThan(0);
      expect(item.icon).not.toBe('');
    }
    // The ones the brief asked for are there:
    const ids = items.map(d => d.id);
    for (const id of ['guitar', 'coolShades', 'pumpkinCostume', 'firePowers', 'petFirePowers']) {
      expect(ids).toContain(id);
    }
    // Free items stay free.
    expect(catalog.human.accessories.find(d => d.id === 'glasses')?.isShopItem()).toBe(false);
  });

  it('the defaults never include a shop item', () => {
    const shop = new Set([...catalog.human.accessories, ...catalog.pet.accessories].filter(d => d.isShopItem()).map(d => d.id));
    for (const id of [...looksData.defaults.human.accessories, ...looksData.defaults.pet.accessories]) {
      expect(shop.has(id)).toBe(false);
    }
  });
});

describe('Weekly homework and the streak', () => {
  it('missions count for this week, with the days they were done', () => {
    let r = emptyRewards();
    r = recordMission(r, MON).state;
    r = recordMission(r, WED).state;
    const week = thisWeek(r, WED);
    expect(week.missions).toBe(2);
    expect(week.goal).toBe(rewardsData.weekly.defaultGoal);
    expect(week.days).toEqual([true, false, true, false, false, false, false]);
    expect(week.left).toBe(1);
    expect(week.done).toBe(false);
  });

  it('reaching the goal gives the weekly candies once', () => {
    let r = emptyRewards();
    r = recordMission(r, MON).state;
    r = recordMission(r, MON).state;
    const third = recordMission(r, WED);
    expect(third.goalReached).toBe(true);
    expect(third.bonus).toBe(CANDIES.weeklyGoal);
    expect(third.state.candies).toBe(CANDIES.weeklyGoal);
    const fourth = recordMission(third.state, SUN);
    expect(fourth.goalReached).toBe(false);
    expect(fourth.state.candies).toBe(CANDIES.weeklyGoal);
  });

  it('the streak counts weeks in a row, and this week counts once it is done', () => {
    let r = setWeeklyGoal(emptyRewards(), 1, MON);
    // Three weeks in a row: 2 weeks ago, last week, this week.
    r = recordMission(r, day(MON, -14)).state;
    r = recordMission(r, day(MON, -7)).state;
    expect(streak(r, MON)).toBe(2); // this week not done yet: still alive
    r = recordMission(r, WED).state;
    expect(streak(r, WED)).toBe(3);
    // A week with nothing breaks it.
    expect(streak(r, day(NEXT_MON, 7))).toBe(0);
  });

  it('changing the goal changes this week, not the weeks before', () => {
    let r = recordMission(emptyRewards(), day(MON, -7)).state; // 1 of 3 last week
    r = setWeeklyGoal(r, 1, MON);
    expect(r.weeks['2026-09-28'].goal).toBe(3);
    expect(thisWeek(r, MON).goal).toBe(1);
  });
});

describe('Weekly check-up', () => {
  it('welcomes the child the first time, then shows once each new week', () => {
    let r = emptyRewards();
    expect(checkupDue(r, MON)).toEqual({ kind: 'welcome', goal: 3 });
    r = markCheckupSeen(r, MON);
    expect(checkupDue(r, WED)).toBeNull(); // same week
    r = recordMission(recordMission(recordMission(r, WED).state, WED).state, SUN).state;
    const next = checkupDue(r, NEXT_MON);
    expect(next?.kind).toBe('newWeek');
    if (next?.kind === 'newWeek') {
      expect(next.lastWeek.missions).toBe(3);
      expect(next.lastWeek.done).toBe(true);
      expect(next.streak).toBe(1);
    }
  });
});

describe('Feelings Tests', () => {
  it('stars and bonus candies', () => {
    expect(starsFor(10, 10)).toBe(3);
    expect(starsFor(9, 10)).toBe(3);
    expect(starsFor(7, 10)).toBe(2);
    expect(starsFor(4, 10)).toBe(1);
    expect(starsFor(1, 10)).toBe(0);
    expect(testBonus(10, 10)).toBe(CANDIES.finishTest + CANDIES.perfectTest);
    expect(testBonus(6, 10)).toBe(CANDIES.finishTest);
  });

  it('is locked until enough leaves are finished', () => {
    expect(canTakeTest(initLevels([1]))).toBe(false);
    expect(canTakeTest(initLevels([1, 2]))).toBe(true);
  });

  it('only asks about finished leaves, mixes them, and shuffles the answers', () => {
    const levels = initLevels([1, 2, 3]);
    const test = buildTest(levels, 10, seeded());
    expect(test).toHaveLength(10);
    const ids = new Set(test.map(q => q.levelId));
    expect([...ids].every(id => [1, 2, 3].includes(id))).toBe(true);
    expect(ids.size).toBe(3); // a real mix
    // No question twice.
    expect(new Set(test.map(q => q.question.id)).size).toBe(10);
    for (const q of test) {
      expect([...q.answers].sort()).toEqual([...q.question.answers].sort());
      expect(q.answers).toContain(q.question.correct);
    }
  });

  it('a small pool gives a shorter test', () => {
    const levels = initLevels([1, 2]);
    const pool = learnedLevels(levels).reduce((n, l) => n + l.getQuestions().length, 0);
    expect(buildTest(levels, 999, seeded()).length).toBe(pool);
  });

  it('results per feeling', () => {
    const test = buildTest(initLevels([1, 2]), 4, seeded(3));
    const rows = resultsByLevel(test, [true, false, true, true]);
    expect(rows.reduce((n, r) => n + r.asked, 0)).toBe(4);
    expect(rows.reduce((n, r) => n + r.right, 0)).toBe(3);
  });

  it('shuffle keeps every item', () => {
    expect(shuffle([1, 2, 3, 4, 5], seeded()).sort()).toEqual([1, 2, 3, 4, 5]);
  });

  it('keeps the last 30 tests', () => {
    let r = emptyRewards();
    for (let i = 0; i < 35; i++) {
      r = recordTest(r, { at: new Date(2026, 9, 1, i).toISOString(), score: i % 10, total: 10, byLevel: {} });
    }
    expect(r.tests).toHaveLength(30);
  });
});

describe('Saved data', () => {
  it('normalizeRewards repairs missing or broken data', () => {
    expect(normalizeRewards(null)).toEqual(emptyRewards());
    const r = normalizeRewards({ candies: -5, owned: ['human:guitar', 7 as unknown as string], weeklyGoal: 0 });
    expect(r.candies).toBe(0);
    expect(r.owned).toEqual(['human:guitar']);
    expect(r.weeklyGoal).toBe(rewardsData.weekly.defaultGoal);
  });

  it('the parent-page report has 8 weeks (newest first) and the latest tests', () => {
    let r = recordMission(emptyRewards(), WED).state;
    r = recordTest(r, { at: WED.toISOString(), score: 8, total: 10, byLevel: {} });
    const report = progressReport(r, WED);
    expect(report.weeks).toHaveLength(8);
    expect(report.weeks[0]).toEqual({ start: '2026-10-05', missions: 1, goal: 3 });
    expect(report.tests[0]).toEqual({ at: WED.toISOString(), score: 8, total: 10 });
  });
});
