/**
 * LeafButton.tsx
 * --------------------------------------------------------------------------
 * Draws ONE leaf (level) on the rainbow tree path. MyTree.draw() uses it.
 *
 * What the child sees:
 *  - a big round button with the feeling's emoji (😊 😢 😠 😴 😒)
 *  - the level name under it
 *  - the NEXT leaf: dark purple, white ring, and a "START 🚀" bubble on top
 *  - a COMPLETED leaf: light purple with a ✓ badge
 *  - a LOCKED leaf: grey with a 🔒 badge, and it cannot be tapped
 *
 * Clickable or not is decided by MyTree: it only passes `onPress` for leaves
 * with clickable = true. With no onPress, the button is disabled.
 */
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { Leaf } from '../models/Leaf';
import type { LeafColors } from '../models/MyTree';
import { colors, fontSizes, fonts, radius, spacing } from '../theme/theme';
import AppText from './AppText';

interface LeafButtonProps {
  leaf: Leaf;
  /** The colours for this leaf (from MyTree.getLeafColors). */
  leafColors: LeafColors;
  /** Left/right shift for the zig-zag path. */
  offset: number;
  /** Only given for clickable leaves. */
  onPress?: () => void;
}

/** Size of the round leaf button. */
const LEAF_SIZE = 96;

export default function LeafButton({
  leaf,
  leafColors,
  offset,
  onPress,
}: LeafButtonProps) {
  const status = leaf.getStatus();
  const canTap = leaf.clickable && onPress !== undefined;

  /** What a screen reader says for this leaf. */
  const spokenStatus =
    status === 'completed'
      ? 'Done. Tap to play again.'
      : status === 'next'
      ? 'Next level. Tap to start.'
      : 'Locked.';

  return (
    <View style={[styles.wrapper, { transform: [{ translateX: offset }] }]}>
      {/* "START" bubble above the next leaf, like Duolingo. */}
      {status === 'next' && (
        <View style={styles.startBubble}>
          <AppText style={styles.startText}>START 🚀</AppText>
        </View>
      )}

      <Pressable
        onPress={onPress}
        disabled={!canTap}
        accessibilityRole="button"
        accessibilityLabel={`Level ${leaf.id}: ${leaf.name}. ${spokenStatus}`}
        accessibilityState={{ disabled: !canTap }}
        style={({ pressed }) => [
          styles.leaf,
          {
            backgroundColor: leafColors.background,
            borderColor: leafColors.border,
          },
          status === 'next' && styles.nextLeaf,
          pressed && styles.pressed,
        ]}>
        <AppText style={styles.icon}>{leaf.icon}</AppText>

        {/* Small badge in the corner: ✓ for done, 🔒 for locked. */}
        {status !== 'next' && (
          <View
            style={[
              styles.badge,
              status === 'completed' ? styles.badgeDone : styles.badgeLocked,
            ]}>
            <AppText style={styles.badgeText}>
              {status === 'completed' ? '✓' : '🔒'}
            </AppText>
          </View>
        )}
      </Pressable>

      {/* Level name under the leaf. */}
      <View
        style={[
          styles.label,
          { backgroundColor: leafColors.background },
        ]}>
        <AppText style={[styles.labelText, { color: leafColors.text }]}>
          {leaf.id}. {leaf.name}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  startBubble: {
    backgroundColor: colors.textLight,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginBottom: spacing.sm,
  },
  startText: {
    color: colors.leafNext,
    fontFamily: fonts.bold,
    fontSize: fontSizes.small,
    lineHeight: fontSizes.small * 1.4,
  },
  leaf: {
    width: LEAF_SIZE,
    height: LEAF_SIZE,
    borderRadius: LEAF_SIZE / 2,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextLeaf: {
    borderWidth: 6,
    // A soft glow around the next leaf (shows on Android as elevation).
    elevation: 10,
    shadowColor: colors.purpleGlow,
    shadowOpacity: 0.9,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  pressed: {
    transform: [{ scale: 0.94 }],
  },
  icon: {
    fontSize: 44,
    lineHeight: 56,
  },
  badge: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.textLight,
  },
  badgeDone: {
    backgroundColor: colors.purpleBright,
  },
  badgeLocked: {
    backgroundColor: '#6B7280',
  },
  badgeText: {
    color: colors.textLight,
    fontFamily: fonts.bold,
    fontSize: 16,
    lineHeight: 22,
  },
  label: {
    marginTop: spacing.sm,
    borderRadius: radius.round,
    paddingHorizontal: spacing.md,
    paddingVertical: 2,
  },
  labelText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.small,
    lineHeight: fontSizes.small * 1.5,
  },
});
