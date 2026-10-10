/**
 * StudioTabs.tsx
 * --------------------------------------------------------------------------
 * The row of tabs in the dress-up studios ("Hair", "Skin", "Extras"...).
 * One tab is chosen at a time; the choices for that tab show underneath.
 * Every tab has an emoji AND a word, so children who don't read yet can
 * still find their way.
 */
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, fontSizes, fonts, radius, spacing } from '../theme/theme';
import AppText from './AppText';

export interface StudioTab<T extends string> {
  id: T;
  icon: string;
  label: string;
}

interface StudioTabsProps<T extends string> {
  tabs: StudioTab<T>[];
  current: T;
  onChange: (id: T) => void;
}

export default function StudioTabs<T extends string>({ tabs, current, onChange }: StudioTabsProps<T>) {
  return (
    <View style={styles.row} accessibilityRole="tablist">
      {tabs.map(tab => {
        const selected = tab.id === current;
        return (
          <Pressable
            key={tab.id}
            onPress={() => onChange(tab.id)}
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected }}
            style={({ pressed }) => [styles.tab, selected && styles.selected, pressed && styles.pressed]}>
            <AppText style={styles.icon}>{tab.icon}</AppText>
            <AppText style={[styles.label, selected && styles.labelSelected]} numberOfLines={1}>
              {tab.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  tab: {
    minWidth: 70,
    minHeight: 64,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.purpleGlow,
    backgroundColor: colors.spacePanel,
  },
  selected: {
    backgroundColor: colors.card,
    borderColor: colors.textLight,
  },
  pressed: {
    transform: [{ scale: 0.95 }],
  },
  icon: {
    fontSize: 24,
    lineHeight: 30,
  },
  label: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.small - 2,
    lineHeight: (fontSizes.small - 2) * 1.4,
    color: colors.textSoft,
  },
  labelSelected: {
    color: colors.textDark,
  },
});
