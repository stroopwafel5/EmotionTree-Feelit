/**
 * WeeklyCard.tsx
 * --------------------------------------------------------------------------
 * "This week's homework" on the home screen (like Duolingo's streak, but
 * weekly):
 *
 *   📅 This week's homework                 🔥 4
 *   2 of 3 missions - 1 to go!
 *   [=========-----]
 *   (M) (T) (W) (T) (F) (S) (S)   ⭐ on the days with a mission
 *   A mission = finish a leaf 🍃, a test 🧪 or an adventure 🗺️
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { dayLetters, type WeekSummary } from '../../models/Rewards';
import { colors, fontSizes, fonts, radius, spacing } from '../../theme/theme';
import AppText from '../AppText';

interface WeeklyCardProps {
  week: WeekSummary;
  streak: number;
  /** Today's place in the week (0 = first day). */
  today: number;
}

export default function WeeklyCard({ week, streak, today }: WeeklyCardProps) {
  const letters = dayLetters();
  const progress = week.goal > 0 ? Math.min(1, week.missions / week.goal) : 1;
  return (
    <View style={[styles.card, week.done && styles.cardDone]}>
      <View style={styles.titleRow}>
        <AppText style={styles.title}>📅 This week's homework</AppText>
        <View
          style={[styles.streak, streak === 0 && styles.streakOff]}
          accessible
          accessibilityLabel={`${streak} week${streak === 1 ? '' : 's'} in a row`}>
          <AppText style={styles.streakText}>🔥 {streak}</AppText>
        </View>
      </View>

      <AppText style={styles.status}>
        {week.done
          ? 'Homework done! 🎉 See you next week.'
          : `${week.missions} of ${week.goal} missions · ${week.left} to go!`}
      </AppText>
      <View style={styles.bar}>
        <View style={[styles.barFill, { width: `${progress * 100}%` }]} />
      </View>

      <View style={styles.days}>
        {letters.map((letter, i) => (
          <View
            key={i}
            style={[styles.day, week.days[i] && styles.dayPlayed, i === today && styles.dayToday]}
            accessible
            accessibilityLabel={`${letter}${week.days[i] ? ', played' : ''}${i === today ? ', today' : ''}`}>
            <AppText style={[styles.dayText, week.days[i] && styles.dayTextPlayed]}>
              {week.days[i] ? '⭐' : letter}
            </AppText>
          </View>
        ))}
      </View>

      <AppText style={styles.hint}>
        {streak > 0
          ? `🔥 ${streak}-week streak! A mission = a leaf 🍃, a test 🧪 or an adventure 🗺️`
          : 'A mission = a leaf 🍃, a test 🧪 or an adventure 🗺️. Do your homework every week to grow a streak 🔥'}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignSelf: 'stretch',
    backgroundColor: colors.spacePanel,
    borderRadius: radius.md,
    borderWidth: 3,
    borderColor: colors.purpleGlow,
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardDone: {
    borderColor: '#FACC15',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: fontSizes.body,
    lineHeight: fontSizes.body * 1.3,
  },
  streak: {
    backgroundColor: '#FFEDD5',
    borderRadius: radius.round,
    borderWidth: 2,
    borderColor: '#FB923C',
    paddingHorizontal: spacing.sm,
    minHeight: 36,
    justifyContent: 'center',
  },
  streakOff: {
    opacity: 0.55,
  },
  streakText: {
    color: '#9A3412',
    fontFamily: fonts.bold,
    fontSize: fontSizes.small,
    lineHeight: fontSizes.small * 1.4,
  },
  status: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.body - 2,
    lineHeight: (fontSizes.body - 2) * 1.4,
  },
  bar: {
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4C2A8A',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 6,
    backgroundColor: '#FACC15',
  },
  days: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  day: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: '#6D4AAE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayPlayed: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FACC15',
  },
  dayToday: {
    borderColor: colors.textLight,
    borderWidth: 3,
  },
  dayText: {
    color: colors.textSoft,
    fontFamily: fonts.semiBold,
    fontSize: 14,
    lineHeight: 20,
  },
  dayTextPlayed: {
    fontSize: 18,
    lineHeight: 24,
  },
  hint: {
    color: colors.textSoft,
    fontSize: 14,
    lineHeight: 20,
  },
});
