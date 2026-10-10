/**
 * WeeklyReport.tsx
 * --------------------------------------------------------------------------
 * For grown-ups: is the child using Emotion Tree every week?
 *
 *   - Weekly homework: how many missions a week (a grown-up picks)
 *   - This week + the streak
 *   - The last 8 weeks (✓ when the homework was done)
 *   - The last Feelings Tests and their scores
 *   - Space candies earned and shop items bought
 *
 * (When Friends is on, the same check-up is shown on the parent page too.)
 */
import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import AppText from '../components/AppText';
import TopBar from '../components/TopBar';
import {
  recentWeeks,
  starsFor,
  streak,
  thisWeek,
  WEEKLY_SETTINGS,
  weekLabel,
  type RewardsState,
} from '../models/Rewards';
import { colors, fontSizes, fonts, radius, spacing } from '../theme/theme';

interface WeeklyReportProps {
  name: string;
  rewards: RewardsState;
  now: Date;
  onGoalChange: (goal: number) => void;
  onBack: () => void;
}

export default function WeeklyReport({ name, rewards, now, onGoalChange, onBack }: WeeklyReportProps) {
  const week = thisWeek(rewards, now);
  const weeks = recentWeeks(rewards, now, 8);
  const tests = [...rewards.tests].reverse().slice(0, 5);
  const fmt = (iso: string) => {
    const d = new Date(iso);
    return `${weekLabel(`${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`)}`;
  };

  return (
    <View style={styles.screen}>
      <TopBar title="Weekly report" onBack={onBack} backLabel="🏠 Home" backHint="Go back home" />
      <ScrollView contentContainerStyle={styles.content}>
        <AppText style={styles.intro}>For grown-ups: how {name} is doing with the weekly homework.</AppText>

        {/* ---- the goal ---- */}
        <View style={styles.card}>
          <AppText style={styles.heading}>Weekly homework</AppText>
          <AppText style={styles.text}>
            Missions per week (a mission = a finished leaf, a Feelings Test or a buddy adventure):
          </AppText>
          <View style={styles.choices}>
            {WEEKLY_SETTINGS.goalChoices.map(goal => (
              <Pressable
                key={goal}
                onPress={() => onGoalChange(goal)}
                accessibilityRole="button"
                accessibilityLabel={`${goal} missions a week`}
                accessibilityState={{ selected: rewards.weeklyGoal === goal }}
                style={[styles.choice, rewards.weeklyGoal === goal && styles.choiceOn]}>
                <AppText style={[styles.choiceText, rewards.weeklyGoal === goal && styles.choiceTextOn]}>
                  {goal}
                </AppText>
              </Pressable>
            ))}
          </View>
        </View>

        {/* ---- this week + streak ---- */}
        <View style={styles.card}>
          <AppText style={styles.heading}>This week</AppText>
          <AppText style={styles.text}>
            {week.missions} of {week.goal} missions {week.done ? '✓ done' : ''}
          </AppText>
          <AppText style={styles.text}>
            🔥 Streak: {streak(rewards, now)} week{streak(rewards, now) === 1 ? '' : 's'} in a row
          </AppText>
        </View>

        {/* ---- last 8 weeks ---- */}
        <View style={styles.card}>
          <AppText style={styles.heading}>Last 8 weeks</AppText>
          {weeks.map((w, i) => (
            <View key={w.key} style={styles.weekRow}>
              <AppText style={styles.weekLabel}>{i === 0 ? 'This week' : `Week of ${weekLabel(w.key)}`}</AppText>
              <View style={styles.weekBar}>
                <View style={[styles.weekFill, { width: `${Math.min(1, w.goal ? w.missions / w.goal : 0) * 100}%` }, w.done && styles.weekFillDone]} />
              </View>
              <AppText style={styles.weekCount}>
                {w.missions}/{w.goal} {w.done ? '✓' : ''}
              </AppText>
            </View>
          ))}
        </View>

        {/* ---- tests ---- */}
        <View style={styles.card}>
          <AppText style={styles.heading}>Feelings Tests</AppText>
          {tests.length === 0 ? (
            <AppText style={styles.text}>No tests yet.</AppText>
          ) : (
            tests.map(t => (
              <AppText key={t.at} style={styles.text}>
                {fmt(t.at)}: {t.score} of {t.total} {'⭐'.repeat(starsFor(t.score, t.total))}
              </AppText>
            ))
          )}
        </View>

        {/* ---- candies ---- */}
        <View style={styles.card}>
          <AppText style={styles.heading}>Space candies 🍬</AppText>
          <AppText style={styles.text}>
            Earned so far: {rewards.earned} · Has now: {rewards.candies} · Shop items: {rewards.owned.length}
          </AppText>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  intro: {
    color: colors.textSoft,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  heading: {
    color: colors.textDark,
    fontFamily: fonts.bold,
    fontSize: fontSizes.large,
    lineHeight: fontSizes.large * 1.3,
  },
  text: {
    color: colors.textDark,
    fontSize: fontSizes.body - 2,
    lineHeight: (fontSizes.body - 2) * 1.4,
  },
  choices: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  choice: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 3,
    borderColor: colors.purpleGlow,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  choiceOn: {
    backgroundColor: colors.purpleBright,
    borderColor: colors.leafNext,
  },
  choiceText: {
    color: colors.textDark,
    fontFamily: fonts.bold,
  },
  choiceTextOn: {
    color: colors.textLight,
  },
  weekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  weekLabel: {
    width: 130,
    color: colors.textDark,
    fontSize: fontSizes.small,
    lineHeight: fontSizes.small * 1.4,
  },
  weekBar: {
    flex: 1,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E4D4FB',
    overflow: 'hidden',
  },
  weekFill: {
    height: '100%',
    backgroundColor: colors.purpleGlow,
  },
  weekFillDone: {
    backgroundColor: colors.correct,
  },
  weekCount: {
    width: 52,
    textAlign: 'right',
    color: colors.textDark,
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.small,
    lineHeight: fontSizes.small * 1.4,
  },
});
