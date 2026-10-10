/**
 * WeeklyCheckup.tsx
 * --------------------------------------------------------------------------
 * The weekly check-up: a popup the first time the app opens in a new week.
 *   - How last week went ("You did 3 of 3 missions. Well done! 🎉")
 *   - The streak ("🔥 4 weeks in a row!")
 *   - This week's homework
 * The very first time it explains weekly homework instead.
 * Always kind: a missed week is "a new start", never a telling-off.
 *
 * Also exports Celebration: a small "🎉 Well done!" popup (weekly homework
 * done, a new shop item...).
 */
import React from 'react';
import { Modal, StyleSheet, View } from 'react-native';

import { CANDIES, type Checkup } from '../../models/Rewards';
import { colors, fontSizes, fonts, radius, spacing } from '../../theme/theme';
import AppText from '../AppText';
import KidButton from '../KidButton';

export default function WeeklyCheckup({ checkup, onClose }: { checkup: Checkup | null; onClose: () => void }) {
  if (!checkup) {
    return null;
  }
  const missionsWord = (n: number) => `${n} mission${n === 1 ? '' : 's'}`;
  let title: string;
  let lines: string[];
  if (checkup.kind === 'welcome') {
    title = '📅 Weekly homework!';
    lines = [
      `Every week, do ${missionsWord(checkup.goal)}: finish a leaf 🍃, take a Feelings Test 🧪, or go on a buddy adventure 🗺️.`,
      `When you do, you get ${CANDIES.weeklyGoal} 🍬 bonus candies!`,
      'Do it every week to grow your streak 🔥.',
    ];
  } else {
    const { lastWeek, streak, goal } = checkup;
    title = '📅 Weekly check-up';
    lines = [
      lastWeek.done
        ? `Last week you did ${lastWeek.missions} of ${lastWeek.goal} missions. Well done! 🎉`
        : lastWeek.missions > 0
        ? `Last week you did ${lastWeek.missions} of ${lastWeek.goal} missions. Good try! 💜`
        : 'Last week was a rest week. 💜',
      streak > 0
        ? `🔥 Your streak: ${streak} week${streak === 1 ? '' : 's'} in a row!`
        : 'This week is a new start. You can do it! 🚀',
      `This week's homework: ${missionsWord(goal)}.`,
    ];
  }
  return (
    <Celebration icon="" title={title} lines={lines} button="Let's go! 🚀" onClose={onClose} />
  );
}

interface CelebrationProps {
  /** Big emoji at the top ('' = none). */
  icon: string;
  title: string;
  lines: string[];
  button?: string;
  onClose: () => void;
}

export function Celebration({ icon, title, lines, button = 'Yay! 🎉', onClose }: CelebrationProps) {
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.dimmer}>
        <View style={styles.card} accessibilityViewIsModal accessibilityLiveRegion="polite">
          {icon ? <AppText style={styles.icon}>{icon}</AppText> : null}
          <AppText style={styles.title}>{title}</AppText>
          {lines.map(line => (
            <AppText key={line} style={styles.line}>
              {line}
            </AppText>
          ))}
          <KidButton label={button} onPress={onClose} style={styles.button} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  dimmer: {
    flex: 1,
    backgroundColor: 'rgba(10, 4, 30, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 6,
    borderColor: '#FACC15',
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  icon: {
    fontSize: 64,
    lineHeight: 80,
  },
  title: {
    color: colors.textDark,
    fontFamily: fonts.bold,
    fontSize: fontSizes.title,
    lineHeight: fontSizes.title * 1.25,
    textAlign: 'center',
  },
  line: {
    color: colors.textDark,
    fontSize: fontSizes.body,
    lineHeight: fontSizes.body * 1.4,
    textAlign: 'center',
  },
  button: {
    alignSelf: 'stretch',
    marginTop: spacing.sm,
  },
});
