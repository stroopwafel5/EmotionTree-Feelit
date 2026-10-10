/**
 * HomeScreen.tsx
 * --------------------------------------------------------------------------
 * The Main Screen (the "welcome" view): the child's own room on the space
 * station, a bit like an igloo in Club Penguin.
 *
 *   - "Hi, Mia!" and the room: the child's avatar, the space buddy, and a
 *     thought bubble with how the child feels right now (tap to change)
 *   - how many space candies the child has (🍬)
 *   - a round toolbar: My look · My buddy · Shop · Friends (Friends shows a
 *     red number when something new is waiting)
 *   - the big "Let's Start" button (the rainbow tree)
 *   - "Time with <buddy>": talk, adventures, games and help tips with the
 *     space buddy (a grown-up can turn it off in Buddy settings)
 *   - the Feelings Test (mixed questions from the finished leaves)
 *   - this week's homework and the weekly streak 🔥
 *   - the planets and how many leaves are done
 *   - small grown-up buttons at the bottom (weekly report, buddy settings)
 */
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import AppText from '../components/AppText';
import RoomScene from '../components/avatar/RoomScene';
import FeelingPicker from '../components/FeelingPicker';
import KidButton from '../components/KidButton';
import CandyCounter from '../components/rewards/CandyCounter';
import WeeklyCard from '../components/rewards/WeeklyCard';
import RoundToolButton from '../components/RoundToolButton';
import type { Level } from '../models/Level';
import type { MyTree } from '../models/MyTree';
import type { WeekSummary } from '../models/Rewards';
import type { User } from '../models/User';
import { colors, fontSizes, fonts, radius, spacing } from '../theme/theme';

interface HomeScreenProps {
  /** The child (avatar, buddy, feeling). */
  user: User;
  tree: MyTree;
  levels: Level[];
  /** How many new things wait in Friends (messages, requests). */
  friendsBadge: number;
  onStart: () => void;
  onEditLook: () => void;
  onEditBuddy: () => void;
  onFriends: () => void;
  onFeelingChange: (feelingId: string | null) => void;
  onLogOut: () => void;
  onReset: () => void;
  /** Space candies the child has. */
  candies: number;
  /** This week's homework, the streak, and today's place in the week. */
  week: WeekSummary;
  streak: number;
  today: number;
  /** Is the Feelings Test open yet (enough leaves finished)? */
  testUnlocked: boolean;
  onTest: () => void;
  onShop: () => void;
  onReport: () => void;
  /** Buddy time is on (a grown-up can turn it off). */
  buddyOn: boolean;
  onBuddyTime: () => void;
  onBuddySettings: () => void;
}

export default function HomeScreen({
  user,
  tree,
  levels,
  friendsBadge,
  onStart,
  onEditLook,
  onEditBuddy,
  onFriends,
  onFeelingChange,
  onLogOut,
  onReset,
  candies,
  week,
  streak,
  today,
  testUnlocked,
  onTest,
  onShop,
  onReport,
  buddyOn,
  onBuddyTime,
  onBuddySettings,
}: HomeScreenProps) {
  const [pickingFeeling, setPickingFeeling] = useState(false);
  const done = tree.getCompletedCount();
  const total = tree.getLeaves().length;
  const buddyIcon = { cat: '🐱', dog: '🐶', alien: '👽' }[user.pet.getKind()] ?? '🐾';

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <View style={styles.helloRow}>
        <AppText style={styles.hello} numberOfLines={1}>
          Hi, {user.username}! 👋
        </AppText>
        <CandyCounter candies={candies} />
      </View>

      {/* The room: avatar + buddy + feeling bubble */}
      <RoomScene user={user} onFeelingPress={() => setPickingFeeling(true)} avatarSize={180} />

      {/* Round toolbar, like Club Penguin */}
      <View style={styles.toolbar}>
        <RoundToolButton icon="🪞" label="My look" onPress={onEditLook} />
        <RoundToolButton icon={buddyIcon} label="My buddy" onPress={onEditBuddy} />
        <RoundToolButton icon="🛍️" label="Shop" onPress={onShop} />
        <RoundToolButton icon="💬" label="Friends" onPress={onFriends} badge={friendsBadge} />
      </View>

      <KidButton label="Let's Start 🚀" onPress={onStart} style={styles.startButton} />
      <AppText style={styles.progress}>
        {done === 0
          ? 'Your tree is waiting for you! 🌱'
          : tree.isFinished()
          ? 'Your rainbow tree is full! 🌈'
          : `Leaves done: ${done} of ${total} 🍃`}
      </AppText>

      {buddyOn && (
        <KidButton
          label={`${buddyIcon} Time with ${user.pet.name}`}
          onPress={onBuddyTime}
          style={styles.buddyButton}
          accessibilityLabel={`Talk and play with ${user.pet.name}`}
        />
      )}

      <KidButton
        label={testUnlocked ? '🧪 Feelings Test' : '🔒 Feelings Test'}
        variant="soft"
        onPress={onTest}
        style={styles.testButton}
        accessibilityLabel={testUnlocked ? 'Feelings Test' : 'Feelings Test, finish 2 leaves first'}
      />

      <WeeklyCard week={week} streak={streak} today={today} />

      {/* The planets, so the child knows what is coming. */}
      <View style={styles.planets}>
        {tree.getSections().map(section => (
          <View key={section.title} style={styles.planet}>
            <AppText style={styles.planetTitle}>{section.title}</AppText>
            <AppText style={styles.planetIcons}>
              {levels
                .filter(level => level.getSection() === section.title)
                .map(level => level.getIcon())
                .join(' ')}
            </AppText>
            {/* Progress bar: how many leaves are done on this planet. */}
            <View style={styles.bar}>
              <View style={[styles.barFill, { width: `${(section.done / section.total) * 100}%` }]} />
            </View>
            <AppText style={styles.planetCount}>
              {section.done} of {section.total} done
            </AppText>
          </View>
        ))}
      </View>

      {/* Small buttons for grown-ups, kept at the bottom. */}
      <View style={styles.grownUps}>
        <AppText style={styles.grownUpsTitle}>For grown-ups</AppText>
        <View style={styles.grownUpsRow}>
          <KidButton label="Weekly report" variant="soft" onPress={onReport} />
          <KidButton label="Buddy settings" variant="soft" onPress={onBuddySettings} />
          <KidButton label="Log out" variant="soft" onPress={onLogOut} />
          {done > 0 && <KidButton label="Start again" variant="soft" onPress={onReset} />}
        </View>
      </View>

      <FeelingPicker
        visible={pickingFeeling}
        current={user.feeling}
        onPick={feelingId => {
          setPickingFeeling(false);
          onFeelingChange(feelingId);
        }}
        onClose={() => setPickingFeeling(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flexGrow: 1,
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  helloRow: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  hello: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: fontSizes.title,
    lineHeight: fontSizes.title * 1.3,
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  testButton: {
    alignSelf: 'stretch',
  },
  buddyButton: {
    alignSelf: 'stretch',
    backgroundColor: colors.leafNext,
  },
  startButton: {
    alignSelf: 'stretch',
    alignItems: 'center',
    minHeight: 80,
  },
  progress: {
    fontFamily: fonts.semiBold,
    textAlign: 'center',
  },
  planets: {
    alignSelf: 'stretch',
    gap: spacing.sm,
  },
  planet: {
    backgroundColor: colors.spacePanel,
    borderColor: colors.purpleGlow,
    borderWidth: 2,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  planetTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.body,
    lineHeight: fontSizes.body * 1.35,
  },
  planetIcons: {
    fontSize: 26,
    lineHeight: 34,
  },
  bar: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4C2A8A',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 5,
    backgroundColor: colors.leafCompleted,
  },
  planetCount: {
    color: colors.textSoft,
    fontSize: fontSizes.small - 2,
    lineHeight: (fontSizes.small - 2) * 1.4,
  },
  grownUps: {
    marginTop: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  grownUpsTitle: {
    color: colors.textSoft,
    fontSize: fontSizes.small - 2,
    lineHeight: (fontSizes.small - 2) * 1.4,
  },
  grownUpsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
  },
});
