/**
 * MainScreen.tsx
 * --------------------------------------------------------------------------
 * The Main Screen from the brief: the first screen the child sees after the
 * grown-up logs in, with a big "Let's Start" button.
 *
 * As the brief asks, THIS is where the game is set up ("initialized"):
 *
 *   questions.json    -> Question[]   (initQuestions)
 *   explanations.json -> Explanation  (initExplanations)
 *   levels.json       -> planets      (initSections)
 *   levels.json       -> Level[]      (initLevels: name + explanation +
 *                                      questions + completed)
 *   Level[]           -> Leaf[]       (initTree: level.toLeaf())
 *   Leaf[]            -> MyTree       (initTree)
 *
 * The init functions are plain exported functions, so the tests can check
 * them without drawing anything.
 *
 * The screen has these views:
 *   'welcome' - the child's room: avatar, buddy, feeling, "Let's Start"
 *               (HomeScreen)
 *   'tree'    - the rainbow tree path (TreeScreen -> MyTree.draw())
 *   'level'   - one level being played (Level.play())
 *   'avatar'  - "My look" studio (AvatarStudio)
 *   'buddy'   - "My space buddy" studio (BuddyStudio)
 *   'friends' - Friends: setup, friends list, requests, groups
 *   'chat'    - one chat (ChatScreen)
 *   'test'    - the Feelings Test (TestScreen)
 *   'shop'    - the Space Shop (ShopScreen)
 *   'report'  - the grown-ups' weekly report (WeeklyReport)
 *   'grownup' - the Grown-up corner, locked with the grown-up PIN
 *   'buddyTime'     - time with the space buddy: talk, adventures, games,
 *                     "Help me with…" (screens/buddy/BuddyTime)
 *   'buddySettings' - for grown-ups: buddy time, open talk, Teach my buddy
 *
 * Space candies and the weekly homework (models/Rewards.ts) are kept here:
 * every right answer gives candies, every finished leaf or test is a
 * "mission" for this week's homework.
 *
 * When a level is finished, Level.finish() updates the tree and calls
 * handleTreeChanged() here, which saves the progress on the device and draws
 * the tree again.
 *
 * The avatar, buddy and feeling are saved on the device (profileService)
 * and - when Friends is on - also sent to the server, so friends see them.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, BackHandler, StyleSheet, View } from 'react-native';

import explanationsData from '../data/explanations.json';
import levelsData from '../data/levels.json';
import questionsData from '../data/questions.json';
import { Explanation, type ExplanationJson } from '../models/Explanation';
import { Level } from '../models/Level';
import { Look } from '../models/Look';
import { MyTree } from '../models/MyTree';
import { Pet } from '../models/Pet';
import {
  buy,
  CANDIES,
  checkupDue,
  dayOfWeek,
  earn,
  emptyRewards,
  markCheckupSeen,
  progressReport,
  recordMission,
  recordTest,
  setWeeklyGoal,
  streak,
  testBonus,
  thisWeek,
  bestTestPercent,
  type Checkup,
  type RewardsState,
  type TestRecord,
} from '../models/Rewards';
import { Question, type QuestionJson } from '../models/Question';
import { User } from '../models/User';
import type { Account } from '../services/authService';
import { friendsService, type OpenChat } from '../services/friendsService';
import { ProfileService, profileService, type SavedProfile } from '../services/profileService';
import { progressService } from '../services/progressService';
import { rewardsService } from '../services/rewardsService';
import { buddyService, DEFAULT_BUDDY, type BuddySaved } from '../services/buddyService';
import { canTakeTest } from '../services/testBuilder';
import { alertWho, sendWorry } from '../services/worryAlerts';
import { countNews, useFriendsOverview } from '../services/useFriendsOverview';
import WeeklyCheckup, { Celebration } from '../components/rewards/WeeklyCheckup';
import { colors } from '../theme/theme';
import AvatarStudio from './AvatarStudio';
import BuddySettings from './buddy/BuddySettings';
import BuddyTime from './buddy/BuddyTime';
import BuddyStudio from './BuddyStudio';
import ChatScreen from './friends/ChatScreen';
import FriendsScreen from './friends/FriendsScreen';
import FriendsSetup from './friends/FriendsSetup';
import GrownUpScreen from './friends/GrownUpScreen';
import HomeScreen from './HomeScreen';
import ShopScreen from './ShopScreen';
import TestScreen from './TestScreen';
import TreeScreen from './TreeScreen';
import WeeklyReport from './WeeklyReport';

/** The shape of one level inside levels.json. */
export interface LevelJson {
  id: number;
  name: string;
  icon: string;
  /** Which planet (section) the level is on. Optional. */
  section?: number;
}

/** The shape of one planet (group of levels) inside levels.json. */
export interface SectionJson {
  id: number;
  title: string;
  icon: string;
}

// ===========================================================================
// 1. INITIALIZING THE GAME (Question, Explanation, Level, Leaf, MyTree)
// ===========================================================================

/**
 * Reads questions.json and makes a Question for every entry.
 * Returns them grouped by level: levelId -> that level's questions,
 * in the same order as in the file.
 */
export function initQuestions(
  json: QuestionJson[] = questionsData.questions,
): Map<number, Question[]> {
  const byLevel = new Map<number, Question[]>();
  for (const entry of json) {
    const list = byLevel.get(entry.levelId) ?? [];
    list.push(Question.fromJson(entry));
    byLevel.set(entry.levelId, list);
  }
  return byLevel;
}

/**
 * Reads explanations.json and makes an Explanation for every entry.
 * Returns them by level id.
 */
export function initExplanations(
  json: ExplanationJson[] = explanationsData.explanations,
): Map<number, Explanation> {
  const byLevel = new Map<number, Explanation>();
  for (const entry of json) {
    byLevel.set(entry.id, Explanation.fromJson(entry));
  }
  return byLevel;
}

/**
 * Reads the planets from levels.json.
 * Returns planet id -> the label shown on the tree, e.g.
 * 1 -> "🪐 Planet 1: Basic Feelings".
 */
export function initSections(
  json: SectionJson[] = levelsData.sections,
): Map<number, string> {
  const labels = new Map<number, string>();
  for (const entry of json) {
    labels.set(entry.id, `${entry.icon} ${entry.title}`);
  }
  return labels;
}

/**
 * Builds all the Levels in the order of levels.json (Happiness, Sadness,
 * ... then the Big Feelings and Special Missions), each with its
 * Explanation, Questions and planet.
 *
 * @param completedIds Levels this child already finished (from the device).
 */
export function initLevels(
  completedIds: number[] = [],
  json: LevelJson[] = levelsData.levels,
): Level[] {
  const questions = initQuestions();
  const explanations = initExplanations();
  const sections = initSections();

  return json.map(entry => {
    const explanation = explanations.get(entry.id);
    if (!explanation) {
      // A level with no lesson is a mistake in the data files.
      throw new Error(
        `Level ${entry.id} (${entry.name}) has no explanation in explanations.json.`,
      );
    }
    return new Level(
      entry.id,
      entry.name,
      explanation,
      questions.get(entry.id) ?? [],
      completedIds.includes(entry.id),
      entry.icon,
      entry.section ? sections.get(entry.section) ?? '' : '',
    );
  });
}

/**
 * Turns every Level into a Leaf and puts the Leaves into the child's MyTree.
 * Each child has one tree, so the tree id is the user id.
 */
export function initTree(userId: number, levels: Level[]): MyTree {
  const leaves = levels.map(level => level.toLeaf());
  return new MyTree(userId, userId, leaves);
}

// ===========================================================================
// 2. THE SCREEN
// ===========================================================================

interface MainScreenProps {
  /** The logged-in account (each child has their own tree). */
  user: Account;
  /** Called when the grown-up taps "Log out". */
  onLogOut: () => void;
}

/** The views of the main screen (see top of file). */
type MainView =
  | 'welcome'
  | 'tree'
  | 'level'
  | 'avatar'
  | 'buddy'
  | 'friends'
  | 'chat'
  | 'test'
  | 'shop'
  | 'report'
  | 'grownup'
  | 'buddyTime'
  | 'buddySettings';

/** Where the Android back button goes from each view. */
const BACK: Record<MainView, MainView | null> = {
  welcome: null, // let Android close the app
  tree: 'welcome',
  level: 'tree',
  avatar: 'welcome',
  buddy: 'welcome',
  friends: 'welcome',
  chat: 'friends',
  test: 'welcome',
  shop: 'welcome', // (or back to the studio it was opened from)
  report: 'welcome',
  grownup: 'friends',
  buddyTime: 'welcome', // (buddy time handles "back" inside itself first)
  buddySettings: 'welcome',
};

/** A "🎉 Well done!" popup. */
interface CelebrationInfo {
  icon: string;
  title: string;
  lines: string[];
}

export default function MainScreen({ user: account, onLogOut }: MainScreenProps) {
  // The game objects. `levels` is null until the saved progress is loaded.
  const [levels, setLevels] = useState<Level[] | null>(null);
  const treeRef = useRef<MyTree | null>(null);

  const [view, setView] = useState<MainView>('welcome');
  const [playingLevelId, setPlayingLevelId] = useState<number | null>(null);

  // MyTree is a normal class (not React state). When it changes, we bump
  // this number so React draws the screen again.
  const [, setTreeVersion] = useState(0);

  // The avatar, buddy and feeling (null while loading).
  const [profile, setProfile] = useState<SavedProfile | null>(null);
  // The Friends login token (null = Friends is not on, on this phone).
  const [token, setToken] = useState<string | null>(null);
  // The open chat.
  const [chat, setChat] = useState<OpenChat | null>(null);

  // Space candies, shop items, tests, weekly homework (null while loading).
  const [rewards, setRewards] = useState<RewardsState | null>(null);
  const rewardsRef = useRef<RewardsState | null>(null);
  const [checkup, setCheckup] = useState<Checkup | null>(null);
  const [celebration, setCelebration] = useState<CelebrationInfo | null>(null);
  // Where "Back" goes from the shop, and which shop tab opens first.
  const [shopReturn, setShopReturn] = useState<MainView>('welcome');
  const [shopTab, setShopTab] = useState<'me' | 'buddy'>('me');
  // The space buddy settings + "Teach my buddy" (saved on this phone only).
  const [buddy, setBuddy] = useState<BuddySaved>(DEFAULT_BUDDY);

  // --- Set up the game when the screen opens -------------------------------
  useEffect(() => {
    let cancelled = false;
    progressService
      .loadCompletedLevelIds(account.id)
      .catch(() => [] as number[]) // no saved progress? start fresh
      .then(completedIds => {
        if (cancelled) {
          return;
        }
        const builtLevels = initLevels(completedIds);
        treeRef.current = initTree(account.id, builtLevels);
        setLevels(builtLevels);
      });
    profileService
      .load(account.id)
      .catch(() => ProfileService.defaults()) // (can't read? use the defaults)
      .then(loaded => !cancelled && setProfile(loaded));
    friendsService
      .getToken(account.id)
      .catch(() => null)
      .then(saved => !cancelled && setToken(saved));
    buddyService
      .load(account.id)
      .catch(() => DEFAULT_BUDDY)
      .then(loaded => !cancelled && setBuddy(loaded));
    rewardsService
      .load(account.id)
      .catch(() => emptyRewards())
      .then(loaded => {
        if (cancelled) {
          return;
        }
        rewardsRef.current = loaded;
        setRewards(loaded);
        // A new week? Show the weekly check-up.
        setCheckup(checkupDue(loaded, new Date()));
      });
    return () => {
      cancelled = true;
    };
  }, [account.id]);

  // --- Friends: what's new (checked again every few seconds) ---------------
  const { overview, error, refresh } = useFriendsOverview(
    token,
    view === 'welcome' || view === 'friends',
  );

  // The server forgot this phone (e.g. a parent removed Friends): turn it off here too.
  useEffect(() => {
    if (error?.status === 401) {
      friendsService.forget(account.id).catch(() => {});
      setToken(null);
    }
  }, [error, account.id]);

  // When Friends is on, send the avatar, buddy and feeling to the server,
  // so friends see the latest ones.
  const sendProfile = useCallback(
    (next: SavedProfile) => {
      if (!token) {
        return;
      }
      friendsService.saveProfile(token, next.look, next.pet).catch(() => {});
      friendsService.saveFeeling(token, next.feeling).catch(() => {});
    },
    [token],
  );
  const profileRef = useRef(profile);
  profileRef.current = profile;
  useEffect(() => {
    if (token && profileRef.current) {
      sendProfile(profileRef.current);
    }
  }, [token, sendProfile]);

  /** Saves a new avatar / buddy / feeling on the phone (and the server). */
  const saveProfile = (next: SavedProfile) => {
    profileRef.current = next;
    setProfile(next);
    profileService.save(account.id, next).catch(() => {});
    sendProfile(next);
  };

  // --- Space candies + weekly homework ---------------------------------------

  /** When Friends is on, the parent page shows the weekly check-up too. */
  const sendProgress = useCallback(
    (next: RewardsState) => {
      if (token) {
        friendsService.saveProgress(token, progressReport(next, new Date())).catch(() => {});
      }
    },
    [token],
  );
  useEffect(() => {
    if (token && rewardsRef.current) {
      sendProgress(rewardsRef.current);
    }
  }, [token, sendProgress]);

  /** Saves new rewards (on the phone, and for the parent page). */
  const commitRewards = (next: RewardsState) => {
    rewardsRef.current = next;
    setRewards(next);
    rewardsService.save(account.id, next).catch(() => {});
    sendProgress(next);
  };

  /** A right answer: candies! */
  const rightAnswer = () => {
    if (rewardsRef.current) {
      commitRewards(earn(rewardsRef.current, CANDIES.rightAnswer));
    }
  };

  /** A finished leaf or test: candies + one mission for this week. */
  const missionDone = (candies: number, change: (r: RewardsState) => RewardsState = r => r) => {
    if (!rewardsRef.current) {
      return;
    }
    const now = new Date();
    const result = recordMission(earn(change(rewardsRef.current), candies), now);
    commitRewards(result.state);
    if (result.goalReached) {
      const weeks = streak(result.state, now);
      setCelebration({
        icon: '🎉',
        title: 'Weekly homework done!',
        lines: [`+${result.bonus} 🍬 bonus candies!`, `🔥 ${weeks} week${weeks === 1 ? '' : 's'} in a row!`],
      });
    }
  };

  /** A test is finished: save it, give the bonus, count the mission. */
  const testFinished = (test: TestRecord) =>
    missionDone(testBonus(test.score, test.total), r => recordTest(r, test));

  /** Buys a shop item. Returns null when bought, or how many candies are missing. */
  const buyItem = (key: string, price: number): number | null => {
    if (!rewardsRef.current) {
      return price;
    }
    const result = buy(rewardsRef.current, key, price);
    if (!result.ok) {
      return result.need;
    }
    commitRewards(result.state);
    return null;
  };

  /** Puts a shop item on (or takes it off). */
  const wearItem = (forPet: boolean, id: string, wear: boolean) => {
    const current = profileRef.current;
    if (!current) {
      return;
    }
    const change = (list: string[]) => (wear ? [...list.filter(a => a !== id), id] : list.filter(a => a !== id));
    saveProfile(
      forPet
        ? { ...current, pet: { ...current.pet, accessories: change(current.pet.accessories) } }
        : { ...current, look: { ...current.look, accessories: change(current.look.accessories) } },
    );
  };

  const openShop = (from: MainView, tab: 'me' | 'buddy') => {
    setShopReturn(from);
    setShopTab(tab);
    setView('shop');
  };

  // The child as a User (avatar Look + buddy Pet + feeling) for the drawings.
  const kid = useMemo(
    () =>
      profile
        ? new User(
            account.id,
            [],
            Look.safeHuman(account.id, profile.look),
            Pet.fromJson(account.id, profile.pet),
            account.username,
            profile.feeling,
          )
        : null,
    [profile, account.id, account.username],
  );

  // --- Android back button: go back one view instead of closing the app ---
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (view === 'buddyTime') {
        return false; // BuddyTime goes back one step inside itself
      }
      const back = view === 'shop' ? shopReturn : BACK[view];
      if (!back) {
        return false;
      }
      if (view === 'chat') {
        refresh();
      }
      setView(back);
      return true;
    });
    return () => subscription.remove();
  }, [view, refresh, shopReturn]);

  /**
   * Level.finish() calls this after it set completed = TRUE and gave the
   * tree its new leaf. We save the progress and draw the tree again.
   */
  const handleTreeChanged = () => {
    if (!levels) {
      return;
    }
    const finishedIds = levels
      .filter(level => level.isCompleted())
      .map(level => level.getId());
    progressService
      .saveCompletedLevelIds(account.id, finishedIds)
      .catch(() => {
        // Saving failed (very rare). The game still works; the progress
        // will be saved the next time a level is finished.
      });
    setTreeVersion(version => version + 1);
  };

  /** A clickable leaf was tapped on the tree: play that level. */
  const openLevel = (levelId: number) => {
    setPlayingLevelId(levelId);
    setView('level');
  };

  /** "Start the tree again" (for grown-ups): asks first, then resets. */
  const confirmReset = () => {
    Alert.alert(
      'Start again?',
      'This makes all the leaves grey again. Are you sure?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, start again',
          style: 'destructive',
          onPress: () => {
            progressService.reset(account.id).catch(() => {});
            const freshLevels = initLevels([]);
            treeRef.current = initTree(account.id, freshLevels);
            setLevels(freshLevels);
          },
        },
      ],
    );
  };

  const goHome = () => setView('welcome');
  /** A grown-up turned on Friends / made a PIN: use the new login. */
  const reloadToken = () => {
    friendsService
      .getToken(account.id)
      .then(setToken)
      .catch(() => {});
  };
  const backToFriends = () => {
    refresh();
    setView('friends');
  };

  // --- Still loading -------------------------------------------------------
  const tree = treeRef.current;
  if (!levels || !tree || !profile || !kid || !rewards) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.purpleGlow} />
      </View>
    );
  }

  // Popups that can show over any view.
  const overlays = (
    <>
      {view === 'welcome' && (
        <WeeklyCheckup
          checkup={checkup}
          onClose={() => {
            setCheckup(null);
            if (rewardsRef.current) {
              commitRewards(markCheckupSeen(rewardsRef.current, new Date()));
            }
          }}
        />
      )}
      {celebration && <Celebration {...celebration} onClose={() => setCelebration(null)} />}
    </>
  );
  const withOverlays = (screen: React.ReactNode) => (
    <>
      {screen}
      {overlays}
    </>
  );
  const now = new Date();

  // --- View: playing a level -----------------------------------------------
  const playingLevel = levels.find(level => level.getId() === playingLevelId);
  if (view === 'level' && playingLevel) {
    return withOverlays(
      playingLevel.play(
        tree,
        () => {
          handleTreeChanged();
          missionDone(CANDIES.finishLeaf);
        },
        () => setView('tree'),
        { onCorrectAnswer: rightAnswer, perAnswer: CANDIES.rightAnswer, finishBonus: CANDIES.finishLeaf },
      ),
    );
  }

  // --- View: the Feelings Test -------------------------------------------------
  if (view === 'test') {
    return withOverlays(
      <TestScreen
        levels={levels}
        candies={rewards.candies}
        best={bestTestPercent(rewards)}
        onCorrectAnswer={rightAnswer}
        onFinished={testFinished}
        onHome={goHome}
        onTree={() => setView('tree')}
      />,
    );
  }

  // --- View: the Space Shop ---------------------------------------------------
  if (view === 'shop') {
    return (
      <ShopScreen
        user={kid}
        look={profile.look}
        pet={profile.pet}
        candies={rewards.candies}
        owned={rewards.owned}
        onBuy={buyItem}
        onWear={wearItem}
        onBack={() => setView(shopReturn)}
        startTab={shopTab}
      />
    );
  }

  // --- View: the grown-ups' weekly report ---------------------------------------
  if (view === 'report') {
    return (
      <WeeklyReport
        name={account.username}
        rewards={rewards}
        now={now}
        onGoalChange={goal => commitRewards(setWeeklyGoal(rewards, goal, new Date()))}
        onBack={goHome}
      />
    );
  }

  // --- Views: space buddy time + its grown-up settings ------------------------
  const inSchoolGroup = (overview?.groups.length ?? 0) > 0;
  if (view === 'buddyTime') {
    return withOverlays(
      <BuddyTime
        user={kid}
        buddy={buddy}
        leaves={levels.map(level => ({ id: level.getId(), name: level.getName(), icon: level.getIcon(), done: level.isCompleted() }))}
        candies={rewards.candies}
        missionsLeft={thisWeek(rewards, now).left}
        alertWho={alertWho(token, inSchoolGroup)}
        onWorry={worry => sendWorry(token, worry).then(result => result.ok)}
        onCandy={rightAnswer}
        onAdventureDone={() => missionDone(CANDIES.finishAdventure)}
        onHome={goHome}
      />,
    );
  }
  if (view === 'buddySettings') {
    return (
      <BuddySettings
        account={account}
        buddyName={kid.pet.name}
        buddy={buddy}
        friendsOn={!!token}
        schools={[...new Set((overview?.groups ?? []).map(g => g.school).filter(Boolean))]}
        onChange={next => {
          setBuddy(next);
          buddyService.save(account.id, next).catch(() => {});
        }}
        onBack={goHome}
      />
    );
  }

  // --- View: the rainbow tree ----------------------------------------------
  if (view === 'tree') {
    return <TreeScreen tree={tree} onLeafPress={openLevel} onHome={goHome} />;
  }

  // --- View: "My look" -------------------------------------------------------
  if (view === 'avatar') {
    return (
      <AvatarStudio
        user={kid}
        initial={profile.look}
        onSave={(look, feeling) => {
          saveProfile({ ...profile, look, feeling });
          goHome();
        }}
        onBack={goHome}
        owned={rewards.owned}
        onOpenShop={(look, feeling) => {
          saveProfile({ ...profile, look, feeling });
          openShop('avatar', 'me');
        }}
      />
    );
  }

  // --- View: "My space buddy" ----------------------------------------------
  if (view === 'buddy') {
    return (
      <BuddyStudio
        user={kid}
        initial={profile.pet}
        onSave={pet => {
          saveProfile({ ...profile, pet });
          goHome();
        }}
        onBack={goHome}
        owned={rewards.owned}
        onOpenShop={pet => {
          saveProfile({ ...profile, pet });
          openShop('buddy', 'buddy');
        }}
      />
    );
  }

  // --- View: Friends ---------------------------------------------------------
  if (view === 'friends' || (view === 'chat' && !token)) {
    if (!token) {
      return (
        <FriendsSetup
          account={account}
          onHome={goHome}
          onConnected={reloadToken}
        />
      );
    }
    return (
      <FriendsScreen
        token={token}
        overview={overview}
        error={error}
        refresh={refresh}
        onHome={goHome}
        onOpenChat={next => {
          setChat(next);
          setView('chat');
        }}
        onTurnOff={() => {
          friendsService.forget(account.id).catch(() => {});
          setToken(null);
          goHome();
        }}
        account={account}
        onOpenGrownUp={() => setView('grownup')}
        onReconnected={reloadToken}
      />
    );
  }

  // --- View: the Grown-up corner (PIN) ---------------------------------------
  if (view === 'grownup' && token) {
    return (
      <GrownUpScreen
        token={token}
        account={account}
        hasPin={overview?.me.hasPin ?? false}
        onBack={backToFriends}
        onReconnected={reloadToken}
      />
    );
  }

  // --- View: one chat --------------------------------------------------------
  if (view === 'chat' && token && chat && overview) {
    return (
      <ChatScreen
        key={chat.ref}
        token={token}
        me={overview.me}
        chat={chat}
        onBack={backToFriends}
        onLeftGroup={backToFriends}
      />
    );
  }

  // --- View: welcome (the child's room) --------------------------------------
  return withOverlays(
    <HomeScreen
      user={kid}
      tree={tree}
      levels={levels}
      friendsBadge={countNews(overview)}
      onStart={() => setView('tree')}
      onEditLook={() => setView('avatar')}
      onEditBuddy={() => setView('buddy')}
      onFriends={() => setView('friends')}
      onFeelingChange={feeling => saveProfile({ ...profile, feeling })}
      onLogOut={onLogOut}
      onReset={confirmReset}
      candies={rewards.candies}
      week={thisWeek(rewards, now)}
      streak={streak(rewards, now)}
      today={dayOfWeek(now)}
      testUnlocked={canTakeTest(levels)}
      onTest={() => setView('test')}
      onShop={() => openShop('welcome', 'me')}
      onReport={() => setView('report')}
      buddyOn={buddy.settings.enabled}
      onBuddyTime={() => setView('buddyTime')}
      onBuddySettings={() => setView('buddySettings')}
    />,
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
