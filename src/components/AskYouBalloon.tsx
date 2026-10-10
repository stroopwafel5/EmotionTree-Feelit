/**
 * AskYouBalloon.tsx
 * --------------------------------------------------------------------------
 * A speech balloon that asks the child about THEIR life, at the end of the
 * lesson, for example:
 *
 *        ╭──────────────────────────────╮
 *        │ What makes YOU happy?         │
 *        │ Think about it, or tell a     │
 *        │ grown-up! 💜                  │
 *        ╰─╲────────────────────────────╯
 *           👽 Zib asks:
 *
 * There is nothing to type and no right or wrong answer: it is a moment to
 * think, or to talk with a grown-up. The question comes from "askYou" in
 * src/data/explanations.json.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, fontSizes, fonts, radius, spacing } from '../theme/theme';
import AppText from './AppText';

interface AskYouBalloonProps {
  /** The question, e.g. "What makes YOU happy?". */
  question: string;
}

export default function AskYouBalloon({ question }: AskYouBalloonProps) {
  const spoken = `Zib asks: ${question} Think about it, or tell a grown-up.`;
  return (
    <View style={styles.wrapper} accessible accessibilityLabel={spoken}>
      {/* The balloon */}
      <View style={styles.balloon}>
        <AppText style={styles.question}>{question}</AppText>
        <AppText style={styles.hint}>
          Think about it, or tell a grown-up! 💜
        </AppText>
      </View>
      {/* The little tail that points down to Zib */}
      <View style={styles.tail} />
      {/* Who is asking */}
      <View style={styles.speaker}>
        <AppText style={styles.speakerIcon}>👽</AppText>
        <AppText style={styles.speakerName}>Zib asks you</AppText>
      </View>
    </View>
  );
}

const TAIL_SIZE = 22;

const styles = StyleSheet.create({
  wrapper: {
    marginTop: spacing.sm,
  },
  balloon: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    borderWidth: 3,
    borderColor: colors.rainbow[2],
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
  },
  question: {
    color: colors.textDark,
    fontFamily: fonts.bold,
    fontSize: fontSizes.large,
    lineHeight: fontSizes.large * 1.35,
    textAlign: 'center',
  },
  hint: {
    color: colors.textDark,
    fontSize: fontSizes.small,
    lineHeight: fontSizes.small * 1.45,
    textAlign: 'center',
  },
  // A small square turned 45°, half hidden under the balloon = a tail.
  tail: {
    width: TAIL_SIZE,
    height: TAIL_SIZE,
    backgroundColor: '#FFFFFF',
    borderRightWidth: 3,
    borderBottomWidth: 3,
    borderColor: colors.rainbow[2],
    transform: [{ rotate: '45deg' }],
    marginTop: -TAIL_SIZE / 2 - 2,
    marginLeft: spacing.xl,
  },
  speaker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginLeft: spacing.lg,
    marginTop: spacing.xs,
  },
  speakerIcon: {
    fontSize: 36,
    lineHeight: 46,
  },
  speakerName: {
    fontFamily: fonts.semiBold,
    color: colors.textSoft,
    fontSize: fontSizes.small,
    lineHeight: fontSizes.small * 1.4,
  },
});
