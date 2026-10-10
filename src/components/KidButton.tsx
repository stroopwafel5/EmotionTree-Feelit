/**
 * KidButton.tsx
 * --------------------------------------------------------------------------
 * A big, round, bright purple button that is easy for small hands to tap.
 *
 * - At least 64px tall (bigger than normal buttons).
 * - Gets a little darker while pressed, so the child sees the tap worked.
 * - Fades out when disabled.
 * - Tells screen readers that it is a button.
 *
 * Usage:
 *   <KidButton label="Let's Start" onPress={start} />
 *   <KidButton label="Back" variant="soft" onPress={goBack} />
 */
import React from 'react';
import {
  Pressable,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import {
  colors,
  fontSizes,
  fonts,
  minTouchSize,
  radius,
  spacing,
} from '../theme/theme';
import AppText from './AppText';

interface KidButtonProps {
  /** Text on the button. */
  label: string;
  /** What happens on tap. */
  onPress: () => void;
  /** 'main' = bright purple (default). 'soft' = outline, for less important actions. */
  variant?: 'main' | 'soft';
  /** Greys the button out and ignores taps. */
  disabled?: boolean;
  /** Extra layout styles (margins, width...). */
  style?: StyleProp<ViewStyle>;
  /** Text read by screen readers, if different from `label`. */
  accessibilityLabel?: string;
}

export default function KidButton({
  label,
  onPress,
  variant = 'main',
  disabled = false,
  style,
  accessibilityLabel,
}: KidButtonProps) {
  const isSoft = variant === 'soft';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      // `pressed` is true while the finger is on the button.
      style={({ pressed }) => [
        styles.base,
        isSoft ? styles.soft : styles.main,
        pressed && (isSoft ? styles.softPressed : styles.mainPressed),
        disabled && styles.disabled,
        style,
      ]}>
      <AppText style={[styles.label, isSoft && styles.softLabel]}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: minTouchSize,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.round,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
  },
  main: {
    backgroundColor: colors.purpleBright,
    borderColor: colors.purpleGlow,
  },
  mainPressed: {
    backgroundColor: colors.leafNext,
  },
  soft: {
    backgroundColor: 'transparent',
    borderColor: colors.purpleGlow,
  },
  softPressed: {
    backgroundColor: colors.spacePanel,
  },
  disabled: {
    opacity: 0.45,
  },
  label: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.large,
    lineHeight: fontSizes.large * 1.3,
    color: colors.textLight,
    textAlign: 'center',
  },
  softLabel: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.body,
    lineHeight: fontSizes.body * 1.3,
  },
});
