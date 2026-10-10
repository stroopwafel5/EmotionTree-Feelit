/**
 * SceneCard.tsx
 * --------------------------------------------------------------------------
 * A "story card" for quiz questions about real-life situations that are
 * hard to show in one photo, for example:
 *
 *     🧸
 *     A kid is playing with a new toy. You want it too,
 *     and you feel bad inside.
 *
 * It has the same size and frame as a PhotoCard, so photo questions and
 * story questions look alike and the answer buttons stay in the same place.
 *
 * Usage:
 *   <SceneCard icon="🧸" text="A kid is playing with a new toy..." />
 *   <SceneCard text="..." compact />   (small version, under a photo)
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, fontSizes, fonts, radius, spacing } from '../theme/theme';
import AppText from './AppText';

interface SceneCardProps {
  /** The story, in one to three short sentences. */
  text: string;
  /** A big emoji above the story. */
  icon?: string;
  /** Small version without the emoji, used under a photo. */
  compact?: boolean;
}

/** Stories longer than this use a slightly smaller font. */
const LONG_STORY = 70;

export default function SceneCard({
  text,
  icon = '💭',
  compact = false,
}: SceneCardProps) {
  return (
    <View
      style={[styles.card, compact ? styles.compact : styles.full]}
      accessible
      accessibilityLabel={`Story: ${text}`}>
      {!compact && <AppText style={styles.icon}>{icon}</AppText>}
      <AppText
        style={[
          styles.text,
          // Long stories get a slightly smaller font, so everything fits.
          text.length > LONG_STORY && styles.longText,
          compact && styles.compactText,
        ]}>
        {text}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 3,
    borderColor: colors.purpleGlow,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  full: {
    // About as tall as a PhotoCard, so the layout does not jump around.
    minHeight: 210,
    gap: spacing.sm,
  },
  compact: {
    paddingVertical: spacing.sm,
  },
  icon: {
    fontSize: 56,
    lineHeight: 70,
  },
  text: {
    color: colors.textDark,
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.large,
    lineHeight: fontSizes.large * 1.4,
    textAlign: 'center',
  },
  longText: {
    fontSize: fontSizes.body,
    lineHeight: fontSizes.body * 1.4,
  },
  compactText: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.body,
    lineHeight: fontSizes.body * 1.4,
  },
});
