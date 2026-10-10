/**
 * OptionTile.tsx
 * --------------------------------------------------------------------------
 * One choice in the dress-up studios: a big square button showing a little
 * preview (a drawing, an emoji or a colour), a name under it, and a ✓ when
 * it is chosen.
 */
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, fontSizes, fonts, radius } from '../theme/theme';
import AppText from './AppText';

interface OptionTileProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** A drawing or emoji to show (or use `color`). */
  children?: React.ReactNode;
  /** Show a colour swatch instead of children. */
  color?: string;
}

export default function OptionTile({ label, selected, onPress, children, color }: OptionTileProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      style={({ pressed }) => [styles.tile, selected && styles.selected, pressed && styles.pressed]}>
      <View style={styles.preview}>
        {color ? <View style={[styles.swatch, { backgroundColor: color }]} /> : children}
      </View>
      <AppText style={styles.label} numberOfLines={1}>
        {label}
      </AppText>
      {selected && (
        <View style={styles.tick}>
          <AppText style={styles.tickText}>✓</AppText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: 104,
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 3,
    borderColor: '#E4D4FB',
    paddingVertical: 6,
  },
  selected: {
    borderColor: colors.purpleBright,
    backgroundColor: '#EDE3FF',
  },
  pressed: {
    transform: [{ scale: 0.95 }],
  },
  preview: {
    width: 76,
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatch: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  label: {
    color: colors.textDark,
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.small - 2,
    lineHeight: (fontSizes.small - 2) * 1.4,
    paddingHorizontal: 4,
  },
  tick: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.purpleBright,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tickText: {
    color: '#FFFFFF',
    fontFamily: fonts.bold,
    fontSize: 15,
    lineHeight: 20,
  },
});
