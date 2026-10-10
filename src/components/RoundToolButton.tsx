/**
 * RoundToolButton.tsx
 * --------------------------------------------------------------------------
 * A big round toolbar button with an emoji and a short label under it,
 * like the toolbar in Club Penguin. Can show a red number badge
 * (e.g. 2 new messages).
 *
 *   <RoundToolButton icon="💬" label="Friends" badge={3} onPress={...} />
 */
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, fontSizes, fonts } from '../theme/theme';
import AppText from './AppText';

interface RoundToolButtonProps {
  icon: string;
  label: string;
  onPress: () => void;
  /** A number in a red circle (hidden when 0). */
  badge?: number;
  /** Shows the button as chosen (lighter, with a white ring). */
  active?: boolean;
  /** Smaller button (for the chat toolbar). */
  small?: boolean;
}

export default function RoundToolButton({
  icon,
  label,
  onPress,
  badge = 0,
  active = false,
  small = false,
}: RoundToolButtonProps) {
  const size = small ? 58 : 76;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={badge > 0 ? `${label}, ${badge} new` : label}
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [styles.wrap, pressed && styles.pressed]}>
      <View
        style={[
          styles.circle,
          { width: size, height: size, borderRadius: size / 2 },
          active && styles.active,
        ]}>
        <AppText style={small ? styles.iconSmall : styles.icon}>{icon}</AppText>
        {badge > 0 && (
          <View style={styles.badge}>
            <AppText style={styles.badgeText}>{badge > 9 ? '9+' : badge}</AppText>
          </View>
        )}
      </View>
      <AppText style={styles.label} numberOfLines={1}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    minWidth: 72,
  },
  pressed: {
    transform: [{ scale: 0.94 }],
  },
  circle: {
    backgroundColor: colors.purpleBright,
    borderWidth: 4,
    borderColor: colors.purpleGlow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  active: {
    backgroundColor: colors.leafNext,
    borderColor: colors.textLight,
  },
  icon: {
    fontSize: 34,
    lineHeight: 44,
  },
  iconSmall: {
    fontSize: 26,
    lineHeight: 34,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    paddingHorizontal: 4,
    backgroundColor: '#DC2626',
    borderWidth: 2,
    borderColor: colors.textLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: colors.textLight,
    fontFamily: fonts.bold,
    fontSize: 14,
    lineHeight: 18,
  },
  label: {
    marginTop: 4,
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.small,
    lineHeight: fontSizes.small * 1.35,
    color: colors.textSoft,
  },
});
